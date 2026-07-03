import OpenAI from "openai";
import type { AIProvider, AIProviderRequest, AIProviderResponse } from "./types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export const openaiProvider: AIProvider = {
  id: "openai",

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  },

  async generate({ model, systemPrompt, userPrompt }: AIProviderRequest): Promise<AIProviderResponse> {
    const completion = await getClient().chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return { text, raw: completion };
  },
};
