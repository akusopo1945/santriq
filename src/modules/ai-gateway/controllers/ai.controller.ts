// ai-gateway/controllers/ai.controller.ts
// NOTE: This module is no longer registered in AppModule.
// All AI routes are handled by src/modules/ai/ai.controller.ts (AiModule).
// Kept as placeholder to avoid import errors in ai-gateway.module.ts.
import { Controller } from '@nestjs/common';
@Controller('ai-gw-legacy')
export class AiGatewayController {}
