import { Injectable } from '@nestjs/common';
import { AiGatewayService } from './services/ai.service';
import { PromptType } from './constants/prompt-types.constant';

@Injectable()
export class AiInsightsService {
  constructor(private readonly aiGateway: AiGatewayService) {}

  /**
   * Generate weekly insight summary for all classes.
   * Returns a markdown string (or plain text) that front‑end can render.
   */
  async generateWeeklyInsight(userId: string): Promise<string> {
    const systemPrompt = `Anda adalah Asisten Guru di SantriQ. Buatlah ringkasan mingguan yang menyoroti:
- Santri paling aktif (paling banyak login / tugas selesai)
- Santri yang tertinggal (progress rendah, absensi tinggi)
- Ringkasan performa kelas secara keseluruhan.
Berikan output dalam format markdown dengan bullet points.`;
    const prompt = `Buat insight mingguan berdasarkan data progres, absensi, dan gamifikasi semua santri pada minggu ini.`;
    return this.aiGateway.generateText(prompt, userId, systemPrompt, 'gemini-2.5-pro', PromptType.TEACHER_ASSISTANT);
  }

  /**
   * Simple risk detection: list users who haven't logged in >7 hari or have zero progress.
   */
  async detectRisks(userId: string): Promise<string> {
    const systemPrompt = `Anda adalah Asisten Guru. Analisis data berikut dan identifikasi santri yang berada pada risiko tinggi (tidak login >7 hari, tidak mengumpulkan tugas, progress stagnan). Kembalikan JSON array dengan fields: id, fullname, reason.`;
    const prompt = `Data risiko akan di‑inject oleh backend, gunakan placeholder untuk memicu AI.`;
    return this.aiGateway.generateText(prompt, userId, systemPrompt, 'gemini-2.5-pro', PromptType.TEACHER_ASSISTANT);
  }
}
