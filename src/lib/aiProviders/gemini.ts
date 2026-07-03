import type { AIProvider, AIProviderRequest, AIProviderResponse } from "./types";

// Adaptador preparado para Google Gemini. Pendiente de implementar (v1.5).
export const geminiProvider: AIProvider = {
  id: "gemini",

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_API_KEY);
  },

  async generate(_request: AIProviderRequest): Promise<AIProviderResponse> {
    throw new Error(
      "El proveedor Gemini aun no esta implementado. Esta previsto para la v1.5 del roadmap."
    );
  },
};
