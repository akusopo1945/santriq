import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiCacheService } from './ai-cache.service';
import { AiUsageService } from './ai-usage.service';
import { PromptTemplateService } from './prompt-template.service';
import { PromptBuilderService } from './prompt-builder.service';
import { generatePromptHash } from '../utils/prompt-hash.util';
import { AI_MODELS } from '../constants/ai-models.constant';
import { PromptType } from '../constants/prompt-types.constant';

@Injectable()
export class AiGatewayService {
  constructor(
    private geminiService: GeminiService,
    private cacheService: AiCacheService,
    private usageService: AiUsageService,
    private templateService: PromptTemplateService,
    private builderService: PromptBuilderService,
  ) {}

  async generateText(
    prompt: string,
    userId: string,
    systemInstruction?: string,
    model?: string,
    promptType?: PromptType,
  ): Promise<string> {
    // 1. Check Quota
    const usage = await this.usageService.checkQuota(userId);

    // 2. Check Cache (skip for progress analysis & teacher assistant)
    const isCacheable = promptType !== PromptType.PROGRESS_ANALYSIS && promptType !== PromptType.TEACHER_ASSISTANT;
    const promptHash = generatePromptHash(prompt, systemInstruction);

    if (isCacheable) {
      const cachedResponse = await this.cacheService.get(promptHash);
      if (cachedResponse) {
        await this.usageService.incrementUsage(usage);
        return cachedResponse;
      }
    }

    // 3. Call Provider (Gemini)
    const activeModel = model || AI_MODELS.DEFAULT;
    const result = await this.geminiService.generateText(prompt, activeModel, systemInstruction);

    // 4. Save Cache
    if (isCacheable) {
      await this.cacheService.set(promptHash, result.text);
    }

    // 5. Save Usage Log
    const cost = (result.inputTokens * 0.000075) / 1000 + (result.outputTokens * 0.0003) / 1000;
    await this.usageService.logRequest(userId, prompt, result.text, result.inputTokens + result.outputTokens, cost);
    await this.usageService.incrementUsage(usage);

    return result.text;
  }
}
