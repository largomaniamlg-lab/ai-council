import type { AIProvider, AIProviderRequest, AIProviderResponse } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Adaptador para OpenRouter. Usa la misma forma de API que OpenAI (chat
// completions), por lo que se implementa con fetch directo en lugar del SDK.
export const openrouterProvider: AIProvider = {
  id: "openrouter",

  isConfigured(): boolean {
    return Boolean(process.env.OPENROUTER_API_KEY);
  },

  async generate({ model, systemPrompt, userPrompt }: AIProviderRequest): Promise<AIProviderResponse> {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter respondio con error ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return { text, raw: data };
  },
};
