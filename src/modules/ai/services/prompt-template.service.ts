import { Injectable } from '@nestjs/common';
import { PromptType } from '../constants/prompt-types.constant';

@Injectable()
export class PromptTemplateService {
  getSystemInstruction(type: PromptType): string {
    switch (type) {
      case PromptType.QUIZ_GENERATOR:
        return `Anda adalah Asisten Guru di SantriQ LMS Madrasah Diniyah. 
Tugas Anda adalah membuat 3 soal latihan berdasarkan materi teks yang diberikan. 
Soal harus dalam format JSON Array tanpa bungkus markdown. Setiap objek soal memiliki format:
{
  "question": "teks pertanyaan",
  "options": ["opsi A", "opsi B", "opsi C", "opsi D"],
  "answer": "opsi jawaban yang benar (harus persis sama dengan salah satu opsi)"
}`;
      case PromptType.LESSON_SUMMARY:
        return `Anda adalah Asisten Guru di SantriQ LMS. 
Buatlah ringkasan materi ajar yang singkat, mudah dipahami oleh santri madrasah diniyah (anak-anak), dan terstruktur dalam bullet points.`;
      case PromptType.PROGRESS_ANALYSIS:
        return `Anda adalah pakar pendidik Al-Qur'an Metode Ummi.
Analisis riwayat pembacaan santri di bawah ini. Cari tahu jika mereka mengalami stagnasi (macet di halaman tertentu), progress terlalu cepat, atau butuh penguatan tajwid/makhraj.
Berikan respon dalam format JSON objek (tanpa bungkus markdown) seperti berikut:
{
  "status": "Baik / Cepat / Perlu Perhatian Khusus",
  "analysis": "Penjelasan detail pola kemajuan membaca santri...",
  "recommendations": [
    "rekomendasi latihan 1...",
    "rekomendasi latihan 2..."
  ]
}`;
      case PromptType.MATERIAL_TAGGING:
        return `Anda adalah asisten pengorganisasian materi ajar. Tentukan 3-5 tag yang relevan (dalam Bahasa Indonesia, dipisah koma) untuk materi yang diberikan.`;
      default:
        return 'Anda adalah asisten AI SantriQ LMS.';
    }
  }
}
