export interface AiProvider {
  generateText(prompt: string, model: string, systemInstruction?: string): Promise<{ text: string; inputTokens: number; outputTokens: number }>;
}
