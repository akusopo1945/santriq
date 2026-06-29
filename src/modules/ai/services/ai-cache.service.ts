import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiCache } from '../entities/ai-cache.entity';

@Injectable()
export class AiCacheService {
  constructor(
    @InjectRepository(AiCache)
    private aiCacheRepository: Repository<AiCache>,
  ) {}

  async get(promptHash: string): Promise<string | null> {
    const cached = await this.aiCacheRepository.findOne({ where: { promptHash } });
    if (cached) {
      const ageInMs = Date.now() - new Date(cached.createdAt).getTime();
      const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
      if (ageInDays <= 7) {
        return cached.response;
      }
      await this.aiCacheRepository.remove(cached);
    }
    return null;
  }

  async set(promptHash: string, response: string): Promise<void> {
    let cached = await this.aiCacheRepository.findOne({ where: { promptHash } });
    if (!cached) {
      cached = this.aiCacheRepository.create({ promptHash, response });
      await this.aiCacheRepository.save(cached);
    }
  }
}
