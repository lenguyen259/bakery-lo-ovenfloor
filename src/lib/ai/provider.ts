import { createOpenAI } from "@ai-sdk/openai";

/** Default chat model for portfolio demos (Groq OpenAI-compatible API). */
export const DEFAULT_AI_MODEL = "openai/gpt-oss-20b";

export function getAiModelId(): string {
  const id = process.env.AI_MODEL?.trim();
  return id || DEFAULT_AI_MODEL;
}

export function createLlmProvider() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  return createOpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}
