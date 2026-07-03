import type { AIProvider, AIProviderRequest, AIProviderResponse } from "./types";

// Adaptador preparado para Anthropic Claude. Todavia no implementado en el
// MVP (v1.0), pensado para activarse en v1.5 (roadmap) sin tocar el
// orquestador ni la UI. Cuando se implemente, usar el SDK "@anthropic-ai/sdk".
export const anthropicProvider: AIProvider = {
  id: "anthropic",

  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  async generate(_request: AIProviderRequest): Promise<AIProviderResponse> {
    throw new Error(
      "El proveedor Anthropic aun no esta implementado. Esta previsto para la v1.5 del roadmap."
    );
  },
};
