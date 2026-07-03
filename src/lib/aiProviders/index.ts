import type { ModelProvider } from "@/config/councilRoles";
import type { AIProvider } from "./types";
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import { openrouterProvider } from "./openrouter";
import { xaiProvider } from "./xai";

const providers: Record<ModelProvider, AIProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  openrouter: openrouterProvider,
  xai: xaiProvider,
};

export function getProvider(id: ModelProvider): AIProvider {
  return providers[id];
}

export * from "./types";
