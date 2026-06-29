// src/modules/ai-gateway/ai-gateway.module.ts
// Legacy stub — all AI logic has been moved to src/modules/ai/ai.module.ts
// This file is kept to satisfy any future re-use or migration path.
import { Module } from '@nestjs/common';
import { AiGatewayController } from './controllers/ai.controller';

@Module({
  controllers: [AiGatewayController],
  providers: [],
})
export class AiGatewayModule {}
