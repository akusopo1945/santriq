// src/modules/ai-gateway/dto/generate-quiz.dto.ts
export class GenerateQuizDto {
  materialId: string;      // ID materi yang akan dibuat kuiz
  totalQuestions: number; // Jumlah soal kuiz yang diinginkan
  difficulty: string;     // easy | medium | hard
}
