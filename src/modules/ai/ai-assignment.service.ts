import { Injectable } from '@nestjs/common';
import { AiGatewayService } from './services/ai.service';
import { PromptType } from './constants/prompt-types.constant';

/**
 * Service for generating assignments (lesson tasks) via AI.
 */
@Injectable()
export class AiAssignmentService {
  constructor(private readonly aiGateway: AiGatewayService) {}

  async generateAssignment(userId: string, topic: string): Promise<string> {
    const systemPrompt = `Anda adalah Asisten Guru di SantriQ. Buatlah satu set tugas (assignment) lengkap berdasarkan topik yang diberikan.
Gunakan format JSON Array tanpa markdown. Setiap objek harus memiliki:
{
  "title": "Nama tugas",
  "description": "Instruksi singkat",
  "dueDate": "YYYY-MM-DD"
}`;
    const prompt = `Topik: ${topic}\nBuatlah tugas untuk topik ini.`;
    return this.aiGateway.generateText(prompt, userId, systemPrompt, undefined, PromptType.ASSIGNMENT_GENERATOR);
  }
}
