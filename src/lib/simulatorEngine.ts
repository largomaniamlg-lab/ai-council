import type { ModelProvider } from "@/config/councilRoles";

// Motor del "Council Simulator": el mismo Council Engine (orchestrator +
// minutes) que usa Live Mode, pero forzando a TODOS los roles y al
// Moderador a usar un unico modelo economico/gratuito, en vez del
// proveedor/modelo asignado individualmente a cada rol. Es una capa de
// configuracion, no una logica distinta: el flujo de generacion es
// identico al de Live Mode.
export const SIMULATOR_PROVIDER: ModelProvider = "openrouter";

// Los modelos gratuitos (":free") de OpenRouter cambian con el tiempo. Si
// este deja de estar disponible, comprueba openrouter.ai/models?max_price=0
// y sobreescribe el valor con la variable de entorno OPENROUTER_SIMULATOR_MODEL.
export const SIMULATOR_MODEL =
  process.env.OPENROUTER_SIMULATOR_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
