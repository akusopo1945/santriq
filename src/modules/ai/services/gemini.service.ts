import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AiProvider } from '../interfaces/ai-provider.interface';
import { estimateTokens } from '../utils/token-estimator.util';

@Injectable()
export class GeminiService implements AiProvider {
  private client: any;
  private hasApiKey = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' && apiKey.trim() !== '') {
      this.client = new GoogleGenAI({ apiKey });
      this.hasApiKey = true;
    }
  }

  async generateText(
    prompt: string,
    model: string,
    systemInstruction?: string,
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const defaultModel = this.configService.get<string>('AI_DEFAULT_MODEL') || 'gemini-2.5-flash';
    const activeModel = model || defaultModel;

    let responseText = '';
    let inputTokens = estimateTokens(prompt);
    let outputTokens = 0;

    if (this.hasApiKey) {
      try {
        const interaction = await this.client.interactions.create({
          model: activeModel,
          input: prompt,
          system_instruction: systemInstruction,
        });
        responseText = interaction.output_text || '';
        outputTokens = estimateTokens(responseText);
      } catch (err) {
        console.error('Gemini API call failed, falling back to Simulation:', err);
        responseText = this.generateMockResponse(prompt);
        outputTokens = estimateTokens(responseText);
      }
    } else {
      responseText = this.generateMockResponse(prompt);
      outputTokens = estimateTokens(responseText);
    }

    return { text: responseText, inputTokens, outputTokens };
  }

  private generateMockResponse(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('soal pilihan ganda') || lower.includes('quiz') || lower.includes('buat soal')) {
      return JSON.stringify([
        {
          question: "Apakah arti dari hukum bacaan Izhar Halqi?",
          options: [
            "Membaca huruf dengan jelas tanpa mendengung",
            "Membaca huruf samar-samar dengan mendengung",
            "Membaca huruf dengan memantul",
            "Membaca huruf dengan memasukkan ke huruf berikutnya"
          ],
          answer: "Membaca huruf dengan jelas tanpa mendengung"
        },
        {
          question: "Huruf Izhar Halqi berjumlah 6. Yang bukan merupakan huruf Izhar adalah...",
          options: ["Hamzah (أ) dan Ha (هـ)", "Kha (خ) dan Ghain (غ)", "Ya (ي) dan Nun (sn)", "Ain (ع) dan Ha (ح)"],
          answer: "Ya (ي) dan Nun (sn)"
        },
        {
          question: "Jika ada Nun sukun bertemu dengan huruf Kha (خ), hukum bacaannya adalah...",
          options: ["Idgham Bighunnah", "Izhar Halqi", "Ikhfa Haqiqi", "Iqlab"],
          answer: "Izhar Halqi"
        }
      ]);
    }
    if (lower.includes('ringkas') || lower.includes('summary') || lower.includes('ringkasan')) {
      return `### Ringkasan Materi:
- **Inti Pelajaran**: Penjelasan hukum tajwid dasar terutama makharijul huruf dan hukum nun mati/tanwin.
- **Poin Penting**:
  * Izhar Halqi dibaca jelas tanpa dengung.
  * Idgham dibagi menjadi Bighunnah (dengan dengung) dan Bilaghunnah (tanpa dengung).
  * Ikhfa dibaca samar-samar.
- **Rekomendasi**: Lakukan latihan pelafalan secara rutin setiap selesai sholat fardhu.`;
    }
    if (lower.includes('stagnan') || lower.includes('pola progress') || lower.includes('evaluasi ummi') || lower.includes('analisis') || lower.includes('insight')) {
      return JSON.stringify({
        status: "Baik",
        analysis: "Santri menunjukkan pola peningkatan konsisten dari pekan ke pekan. Kemampuan makhraj sangat baik namun perlu penguatan pada harakat panjang (mad).",
        recommendations: [
          "Fokus pada latihan ketukan mad asli (2 harakat)",
          "Perbanyak talqin/peniruan bacaan guru di kelas",
          "Gunakan buku panduan Metode Ummi secara berkala di rumah"
        ]
      });
    }
    if (lower.includes('tugas') || lower.includes('assignment') || lower.includes('pekerjaan rumah')) {
      return JSON.stringify({
        title: "Latihan Tajwid Izhar Halqi",
        description: "Bacalah materi Izhar Halqi di buku Ummi Anda, sebutkan 6 huruf halqi, dan rekam audio pelafalan minimal 3 contoh kata."
      });
    }
    return `[Mode Simulasi AI SantriQ] Prompt Anda telah diproses. Hasil simulasi respon:\n\n${prompt.substring(0, 100)}...`;
  }
}
