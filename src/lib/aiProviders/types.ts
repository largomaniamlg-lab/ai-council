import type { ModelProvider } from "@/config/councilRoles";

export interface AIProviderRequest {
  model: string;
  systemPrompt: string;
  userPrompt: string;
}

export interface AIProviderResponse {
  text: string;
  raw?: unknown;
}

// Interfaz comun para poder anadir Anthropic, Gemini, OpenRouter y xAI
// sin cambiar el orquestador ni los componentes de UI.
export interface AIProvider {
  id: ModelProvider;
  isConfigured(): boolean;
  generate(request: AIProviderRequest): Promise<AIProviderResponse>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: ModelProvider) {
    super(
      `El proveedor "${provider}" no esta configurado. Anade la variable de entorno correspondiente (ver .env.local.example).`
    );
    this.name = "ProviderNotConfiguredError";
  }
}
