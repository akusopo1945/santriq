import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiGatewayService } from './services/ai.service';
import { GeminiService } from './services/gemini.service';
import { AiCacheService } from './services/ai-cache.service';
import { AiUsageService } from './services/ai-usage.service';
import { PromptTemplateService } from './services/prompt-template.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { AiInsightsService } from './ai-insights.service';
import { AiAssignmentService } from './ai-assignment.service';
import { AiRequest } from './entities/ai-request.entity';
import { AiCache } from './entities/ai-cache.entity';
import { AiUsageLog } from './entities/ai-usage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiRequest, AiCache, AiUsageLog]),
  ],
  controllers: [AiController],
  providers: [
    AiGatewayService,
    GeminiService,
    AiCacheService,
    AiUsageService,
    PromptTemplateService,
    PromptBuilderService,
    AiInsightsService,
    AiAssignmentService,
  ],
  exports: [AiGatewayService],
})
export class AiModule {}
