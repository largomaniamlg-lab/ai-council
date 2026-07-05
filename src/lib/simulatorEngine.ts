import type { ModelProvider } from "@/config/councilRoles";

// Motor del "Council Simulator": el mismo Council Engine (orchestrator +
// minutes) que usa Live Mode, pero forzando a TODOS los roles y al
// Moderador a usar un unico modelo economico/gratuito, en vez del
// proveedor/modelo asignado individualmente a cada rol. Es una capa de
// configuracion, no una logica distinta: el flujo de generacion es
// identico al de Live Mode.
export const SIMULATOR_PROVIDER: ModelProvider = "openrouter";

// Los modelos gratuitos (":free") de OpenRouter rotan y desaparecen sin
// aviso (p.ej. DeepSeek R1 free y Qwen3 Coder free dejaron de existir a
// finales de junio de 2026). Elegido tras comparar los que seguian activos
// en julio de 2026: nemotron-3-ultra es el unico orientado a razonamiento
// general (no solo codigo) con buen equilibrio calidad/velocidad para
// roles tan distintos como Riesgos, CFO, Etico o Creativo.
// Si deja de funcionar, comprueba openrouter.ai/models?max_price=0 y
// sobreescribe el valor con la variable de entorno OPENROUTER_SIMULATOR_MODEL
// (alternativa mas ligera y rapida: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free").
export const SIMULATOR_MODEL =
  process.env.OPENROUTER_SIMULATOR_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";
