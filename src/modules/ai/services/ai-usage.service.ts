import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiUsageLog } from '../entities/ai-usage.entity';
import { AiRequest } from '../entities/ai-request.entity';

@Injectable()
export class AiUsageService {
  constructor(
    @InjectRepository(AiUsageLog)
    private aiUsageLogRepository: Repository<AiUsageLog>,
    @InjectRepository(AiRequest)
    private aiRequestRepository: Repository<AiRequest>,
    private configService: ConfigService,
  ) {}

  async checkQuota(userId: string): Promise<AiUsageLog> {
    const today = new Date().toISOString().split('T')[0];
    let usage = await this.aiUsageLogRepository.findOne({ where: { userId, date: today } });
    if (!usage) {
      usage = this.aiUsageLogRepository.create({ userId, date: today, requestCount: 0 });
    }

    const dailyLimit = parseInt(this.configService.get<string>('AI_DAILY_LIMIT') || '1000', 10);
    const userLimit = parseInt(this.configService.get<string>('AI_USER_LIMIT') || '20', 10);

    if (usage.requestCount >= userLimit) {
      throw new ForbiddenException(`Batas penggunaan AI harian Anda telah habis (Maksimal ${userLimit} request/hari).`);
    }

    const totalRequestsToday = await this.aiUsageLogRepository.createQueryBuilder('log')
      .select('SUM(log.requestCount)', 'sum')
      .where('log.date = :today', { today })
      .getRawOne();
    
    const sysSum = parseInt(totalRequestsToday?.sum || '0', 10);
    if (sysSum >= dailyLimit) {
      throw new ForbiddenException('Batas penggunaan AI sistem hari ini telah habis. Silakan coba lagi besok.');
    }

    return usage;
  }

  async incrementUsage(usage: AiUsageLog): Promise<void> {
    usage.requestCount += 1;
    await this.aiUsageLogRepository.save(usage);
  }

  async logRequest(userId: string, prompt: string, response: string, tokensUsed: number, cost: number): Promise<void> {
    const requestLog = this.aiRequestRepository.create({
      prompt,
      response,
      tokensUsed,
      cost,
      requestedBy: userId,
    });
    await this.aiRequestRepository.save(requestLog);
  }
}
