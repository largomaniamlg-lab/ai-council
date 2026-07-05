#!/usr/bin/env node
// Arranca el servidor de desarrollo de Next.js y un tunel publico de
// Cloudflare a la vez, con un solo comando (`npm run dev:tunnel`).
// Imprime la URL publica en cuanto esta lista, y da un mensaje claro si
// algo falla (cloudflared no instalado, tunel caido, servidor caido...).

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const PORT = process.env.PORT || "3000";

// Rutas conocidas primero (mas fiable); "cloudflared" a pelo el ultimo
// recurso, por si esta en el PATH pero no en ninguna ruta conocida.
const CLOUDFLARED_CANDIDATES = [
  "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
  "C:\\Program Files\\cloudflared\\cloudflared.exe",
  "/usr/local/bin/cloudflared",
  "/opt/homebrew/bin/cloudflared",
  "cloudflared",
];

function isOnPath(command) {
  const result = spawnSync(command, ["--version"], { shell: true });
  return !result.error;
}

function findCloudflared() {
  for (const candidate of CLOUDFLARED_CANDIDATES) {
    if (candidate === "cloudflared" ? isOnPath(candidate) : existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function log(msg) {
  console.log(`[dev-with-tunnel] ${msg}`);
}

function box(lines) {
  const width = Math.max(...lines.map((l) => l.length)) + 4;
  const bar = "-".repeat(width);
  console.log(bar);
  for (const line of lines) {
    console.log(`| ${line.padEnd(width - 4)} |`);
  }
  console.log(bar);
}

let nextProcess;
let tunnelProcess;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  log("Cerrando procesos...");
  nextProcess?.kill();
  tunnelProcess?.kill();
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// 1. Arrancar Next.js
log(`Arrancando Next.js en el puerto ${PORT}...`);
nextProcess = spawn("npm", ["run", "dev"], {
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
  env: { ...process.env, PORT },
});

let nextReady = false;
nextProcess.stdout.on("data", (data) => {
  const text = data.toString();
  process.stdout.write(text);
  if (!nextReady && /Ready in/.test(text)) {
    nextReady = true;
    log("Next.js esta listo. Arrancando el tunel de Cloudflare...");
    startTunnel();
  }
});
nextProcess.stderr.on("data", (data) => process.stderr.write(data.toString()));
nextProcess.on("exit", (code) => {
  if (!shuttingDown) {
    log(`Next.js se ha detenido inesperadamente (codigo ${code}).`);
    shutdown(code ?? 1);
  }
});
nextProcess.on("error", (err) => {
  log(`No se pudo arrancar Next.js: ${err.message}`);
  shutdown(1);
});

function startTunnel() {
  const cloudflaredBin = findCloudflared();

  if (!cloudflaredBin) {
    box([
      "cloudflared no esta instalado.",
      "El servidor sigue disponible en local, pero no hay URL publica.",
      "",
      "Instalalo con:",
      "  Windows: winget install Cloudflare.cloudflared",
      "  macOS:   brew install cloudflared",
    ]);
    return;
  }

  tunnelProcess = spawn(cloudflaredBin, ["tunnel", "--url", `http://localhost:${PORT}`], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let urlPrinted = false;
  const urlTimeout = setTimeout(() => {
    if (!urlPrinted) {
      box([
        "El tunel de Cloudflare tarda mas de lo esperado.",
        "Revisa tu conexion a internet, o sigue trabajando en local",
        `en http://localhost:${PORT} mientras se soluciona.`,
      ]);
    }
  }, 20000);

  function handleTunnelOutput(data) {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match && !urlPrinted) {
      urlPrinted = true;
      clearTimeout(urlTimeout);
      box([
        "AI Council esta disponible publicamente en:",
        match[0],
        "",
        `(local: http://localhost:${PORT})`,
        "Compartelo con quien quieras probarlo. Se cae si cierras esta terminal.",
      ]);
    }
  }

  tunnelProcess.stdout.on("data", handleTunnelOutput);
  tunnelProcess.stderr.on("data", handleTunnelOutput);

  tunnelProcess.on("error", (err) => {
    box([
      "No se pudo arrancar el tunel de Cloudflare.",
      err.message,
      `El servidor sigue disponible en local: http://localhost:${PORT}`,
    ]);
  });

  tunnelProcess.on("exit", (code) => {
    if (!shuttingDown) {
      box([
        `El tunel de Cloudflare se ha detenido (codigo ${code}).`,
        "La URL publica ha dejado de funcionar.",
        `El servidor sigue disponible en local: http://localhost:${PORT}`,
      ]);
    }
  });
}
