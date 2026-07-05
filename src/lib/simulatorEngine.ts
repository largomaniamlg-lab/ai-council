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
// finales de junio de 2026). Se probaron en vivo los dos candidatos de
// razonamiento general activos en julio de 2026:
//   - nemotron-3-ultra-550b-a55b:free -> respuestas excelentes pero entre
//     1 y 4+ minutos por especialista (demasiado lento para uso interactivo).
//   - nemotron-3-nano-omni-30b-a3b-reasoning:free -> misma calidad de
//     analisis (estructurado, con tablas, riesgos, escenarios) en ~40s.
// Se elige el nano-omni por ser el unico con velocidad aceptable para una
// app interactiva. Si deja de funcionar, comprueba
// openrouter.ai/models?max_price=0 y sobreescribe el valor con la variable
// de entorno OPENROUTER_SIMULATOR_MODEL.
export const SIMULATOR_MODEL =
  process.env.OPENROUTER_SIMULATOR_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
