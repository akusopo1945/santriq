import * as crypto from 'crypto';

export function generatePromptHash(prompt: string, systemInstruction?: string): string {
  return crypto.createHash('sha256').update(prompt + (systemInstruction || '')).digest('hex');
}
