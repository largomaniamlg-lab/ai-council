import type { AIProvider, AIProviderRequest, AIProviderResponse } from "./types";

// Adaptador preparado para xAI Grok. Pendiente de implementar (v1.5).
export const xaiProvider: AIProvider = {
  id: "xai",

  isConfigured(): boolean {
    return Boolean(process.env.XAI_API_KEY);
  },

  async generate(_request: AIProviderRequest): Promise<AIProviderResponse> {
    throw new Error(
      "El proveedor xAI (Grok) aun no esta implementado. Esta previsto para la v1.5 del roadmap."
    );
  },
};
