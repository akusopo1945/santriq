import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AiGatewayService } from './services/ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AiInsightsService } from './ai-insights.service';
import { AiAssignmentService } from './ai-assignment.service';
import { DataSource } from 'typeorm';
import { PromptType } from './constants/prompt-types.constant';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(
    private readonly aiGatewayService: AiGatewayService,
    private readonly dataSource: DataSource,
    private readonly insightsService: AiInsightsService,
    private readonly assignmentService: AiAssignmentService,
  ) {}

  @Post('quiz-generator')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async generateQuiz(
    @CurrentUser() user: User,
    @Body() body: { contentText: string },
  ) {
    const systemPrompt = `Anda adalah Asisten Guru di SantriQ LMS Madrasah Diniyah. 
Tugas Anda adalah membuat 3 soal latihan berdasarkan materi teks yang diberikan. 
Soal harus dalam format JSON Array tanpa bungkus markdown. Setiap objek soal memiliki format:
{
  "question": "teks pertanyaan",
  "options": ["opsi A", "opsi B", "opsi C", "opsi D"],
  "answer": "opsi jawaban yang benar (harus persis sama dengan salah satu opsi)"
}`;
    const prompt = `Materi Ajar:
${body.contentText}

Buatlah soal latihan sekarang:`;
    const resText = await this.aiGatewayService.generateText(prompt, user.id, systemPrompt, undefined, PromptType.QUIZ_GENERATOR);
    try {
      return JSON.parse(resText);
    } catch {
      return { text: resText };
    }
  }

  @Post('lesson-summary')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async generateSummary(
    @CurrentUser() user: User,
    @Body() body: { contentText: string },
  ) {
    const systemPrompt = `Anda adalah Asisten Guru di SantriQ LMS. 
Buatlah ringkasan materi ajar yang singkat, mudah dipahami oleh santri madrasah diniyah (anak-anak), dan terstruktur dalam bullet points.`;
    const prompt = `Materi Ajar:
${body.contentText}

Ringkas materi ini:`;
    const resText = await this.aiGatewayService.generateText(prompt, user.id, systemPrompt, undefined, PromptType.LESSON_SUMMARY);
    return { summary: resText };
  }

  @Post('ummi-analysis')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async analyzeUmmiProgress(
    @CurrentUser() user: User,
    @Body() body: { studentId: string },
  ) {
    const history = await this.dataSource.query(
      `SELECT jilid, page, status, teacher_notes as "teacherNotes", mistake_details as "mistakeDetails", recommendations, created_at as "createdAt"
       FROM ummi_progress 
       WHERE student_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [body.studentId]
    );

    const historyStr = JSON.stringify(history, null, 2);

    const systemPrompt = `Anda adalah pakar pendidik Al-Qur'an Metode Ummi.
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
    const prompt = `Riwayat Membaca Santri (Metode Ummi):
${historyStr}

Analisis perkembangan santri ini:`;
    const resText = await this.aiGatewayService.generateText(prompt, user.id, systemPrompt, 'gemini-2.5-pro', PromptType.PROGRESS_ANALYSIS);
    try {
      return JSON.parse(resText);
    } catch {
      return { text: resText };
    }
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  async getAiAnalytics() {
    const totalRequests = await this.dataSource.query(`SELECT COUNT(*) as count FROM ai_requests`);
    const totalCost = await this.dataSource.query(`SELECT SUM(cost) as sum FROM ai_requests`);
    const totalTokens = await this.dataSource.query(`SELECT SUM(tokens_used) as sum FROM ai_requests`);
    
    const usageLogs = await this.dataSource.query(
      `SELECT u.fullname, l.date, l.request_count as "requestCount" 
       FROM ai_usage_logs l
       JOIN users u ON l.user_id = u.id
       ORDER BY l.date DESC, l.request_count DESC
       LIMIT 50`
    );

    return {
      totalRequests: parseInt(totalRequests[0]?.count || 0),
      totalCost: parseFloat(totalCost[0]?.sum || 0),
      totalTokens: parseInt(totalTokens[0]?.sum || 0),
      usageLogs
    }
}

  // NEW: Assignment generator
  @Post('assignment-generator')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async generateAssignment(
    @CurrentUser() user: User,
    @Body() body: { topic: string },
  ) {
    const result = await this.assignmentService.generateAssignment(user.id, body.topic);
    try {
      return JSON.parse(result);
    } catch {
      return { text: result };
    }
  }

  // NEW: Weekly insight summary
  @Get('weekly-insight')
  @Roles(UserRole.ADMIN)
  async weeklyInsight(@CurrentUser() user: User) {
    const insight = await this.insightsService.generateWeeklyInsight(user.id);
    return { insight };
  }

  // NEW: Risk detection
  @Get('risk-detection')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async riskDetection(@CurrentUser() user: User) {
    const risks = await this.insightsService.detectRisks(user.id);
    try {
      return JSON.parse(risks);
    } catch {
      return { text: risks };
    }
  }

  // NEW: Material Tagging
  @Post('material-tagging')
  @Roles(UserRole.ADMIN, UserRole.GURU)
  async tagMaterial(
    @CurrentUser() user: User,
    @Body() body: { contentText: string },
  ) {
    if (!body.contentText || body.contentText.trim().length < 10) {
      return { tags: [] };
    }
    const prompt = `Berikan 3-5 tag kategori yang relevan (dalam Bahasa Indonesia, pisah koma) untuk materi berikut:\n\n${body.contentText}\n\nFormat output: hanya tulis tag dipisah koma, tanpa penjelasan lain.`;
    const result = await this.aiGatewayService.generateText(prompt, user.id, undefined, undefined, PromptType.MATERIAL_TAGGING);
    const tags = result.split(',').map((t: string) => t.trim().replace(/^[^a-zA-Z0-9\u00C0-\u024F]+|[^a-zA-Z0-9\u00C0-\u024F\s]+$/g, '').trim()).filter(Boolean);
    return { tags };
  }
}
