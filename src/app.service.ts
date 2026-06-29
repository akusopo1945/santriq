import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from './modules/users/users.service';
import { UserRole } from './modules/users/entities/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly usersService: UsersService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  getHello(): string {
    return 'SantriQ API Active';
  }

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = 'admin@santriq.com';
    const existing = await this.usersService.findByEmail(adminEmail);
    if (!existing) {
      console.log('Seeding default Admin user...');
      try {
        await this.usersService.create({
          email: adminEmail,
          password: 'adminPassword123',
          fullname: 'Administrator Yayasan',
          role: UserRole.ADMIN,
        });
        console.log('Admin user seeded successfully: admin@santriq.com / adminPassword123');
      } catch (err) {
        console.error('Gagal melakukan seeding admin:', err);
      }
    }
  }

  async seedDemo() {
    // 1. Truncate all tables Cascade
    await this.dataSource.query(
      'TRUNCATE "weekly_reports", "assignment_templates", "user_badges", "submissions", "assignments", "materials", "attendance", "ummi_progress", "class_students", "classes", "parents_mapping", "users" CASCADE'
    );

    // 2. Hash passwords
    const adminPasswordHash = await bcrypt.hash('adminPassword123', 10);
    const userPasswordHash = await bcrypt.hash('password123', 10);

    // 3. Create Admin User
    await this.dataSource.query(
      `INSERT INTO "users" (email, password_hash, fullname, role) VALUES ($1, $2, $3, $4)`,
      ['admin@santriq.com', adminPasswordHash, 'Administrator Yayasan', 'ADMIN']
    );

    // 4. Create Gurus
    const gurus = [
      { email: 'ustadz.ahmad@santriq.com', fullname: 'Ustadz Ahmad Fauzi', role: 'GURU' },
      { email: 'ustadzah.aisyah@santriq.com', fullname: 'Ustadzah Aisyah Aminah', role: 'GURU' },
      { email: 'ustadz.yusuf@santriq.com', fullname: 'Ustadz Yusuf Mansur', role: 'GURU' }
    ];
    const guruIds: string[] = [];
    for (const g of gurus) {
      const res = await this.dataSource.query(
        `INSERT INTO "users" (email, password_hash, fullname, role) VALUES ($1, $2, $3, $4) RETURNING id`,
        [g.email, userPasswordHash, g.fullname, g.role]
      );
      guruIds.push(res[0].id);
    }

    // 5. Create Santris (with initial XP, Level, Streak)
    const todayStr = new Date().toISOString().split('T')[0];
    const santris = [
      { email: 'ali@santriq.com', fullname: 'Muhammad Ali', role: 'SANTRI', xp: 120, level: 2, streak: 3 },
      { email: 'fatima@santriq.com', fullname: 'Fatima Az-Zahra', role: 'SANTRI', xp: 80, level: 1, streak: 1 },
      { email: 'aisha@santriq.com', fullname: 'Aisha Humaira', role: 'SANTRI', xp: 350, level: 3, streak: 5 },
      { email: 'hassan@santriq.com', fullname: 'Hassan Al-Basri', role: 'SANTRI', xp: 620, level: 4, streak: 8 },
      { email: 'husain@santriq.com', fullname: 'Husain As-Sajjad', role: 'SANTRI', xp: 1050, level: 5, streak: 12 }
    ];
    const santriIds: string[] = [];
    for (const s of santris) {
      const res = await this.dataSource.query(
        `INSERT INTO "users" (email, password_hash, fullname, role, xp, level, streak, last_active_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [s.email, userPasswordHash, s.fullname, s.role, s.xp, s.level, s.streak, todayStr]
      );
      santriIds.push(res[0].id);
    }

    // 6. Create User Badges for Gamification
    await this.dataSource.query(
      `INSERT INTO "user_badges" (badge_name, description, icon, student_id) VALUES 
       ('Tugas Tepat Waktu', 'Berhasil mengumpulkan tugas mandiri.', 'award', $1),
       ('Tugas Tepat Waktu', 'Berhasil mengumpulkan tugas mandiri.', 'award', $2),
       ('Rajin Sholat', 'Istiqomah menjaga ibadah harian.', 'shield', $2),
       ('Kehadiran Sempurna', 'Kehadiran tanpa alpa sepanjang pekan.', 'check-circle', $3),
       ('Hafalan Lancar', 'Menyelesaikan target kelulusan jilid.', 'book-open', $4)`,
      [santriIds[0], santriIds[2], santriIds[3], santriIds[4]]
    );

    // 7. Create Wali Santris
    const walis = [
      { email: 'wali.ahmad@santriq.com', fullname: 'Pak Ahmad (Wali Ali & Fatima)', role: 'WALI' },
      { email: 'wali.aisyah@santriq.com', fullname: 'Ibu Aisyah (Wali Aisha & Hassan)', role: 'WALI' }
    ];
    const waliIds: string[] = [];
    for (const w of walis) {
      const res = await this.dataSource.query(
        `INSERT INTO "users" (email, password_hash, fullname, role) VALUES ($1, $2, $3, $4) RETURNING id`,
        [w.email, userPasswordHash, w.fullname, w.role]
      );
      waliIds.push(res[0].id);
    }

    // 8. Map Wali Santri Children in parents_mapping
    await this.dataSource.query(
      `INSERT INTO "parents_mapping" (parent_id, student_id) VALUES ($1, $2), ($3, $4)`,
      [waliIds[0], santriIds[0], waliIds[0], santriIds[1]]
    );
    await this.dataSource.query(
      `INSERT INTO "parents_mapping" (parent_id, student_id) VALUES ($1, $2), ($3, $4)`,
      [waliIds[1], santriIds[2], waliIds[1], santriIds[3]]
    );

    // 9. Create Classes
    const classNames = [
      'Jilid 1-A',
      'Jilid 2-B',
      'Jilid 3-A',
      'Jilid 4-B',
      'Jilid 5-A',
      'Jilid 6-B',
      'Al-Quran Tahfidz'
    ];
    const classIds: string[] = [];
    for (let i = 0; i < classNames.length; i++) {
      const teacherId = guruIds[i % guruIds.length];
      const res = await this.dataSource.query(
        `INSERT INTO "classes" (name, teacher_id) VALUES ($1, $2) RETURNING id`,
        [classNames[i], teacherId]
      );
      classIds.push(res[0].id);
    }

    // 10. Map Students to Classes
    const classMappings = [
      [classIds[0], santriIds[0]],
      [classIds[1], santriIds[1]],
      [classIds[2], santriIds[2]],
      [classIds[3], santriIds[3]],
      [classIds[4], santriIds[4]],
      [classIds[5], santriIds[0]],
      [classIds[5], santriIds[4]],
      [classIds[6], santriIds[4]]
    ];
    for (const [classId, studentId] of classMappings) {
      await this.dataSource.query(
        `INSERT INTO "class_students" (class_id, student_id) VALUES ($1, $2)`,
        [classId, studentId]
      );
    }

    // 11. Create Mock Attendances (Last 3 days)
    const today = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      for (const [classId, studentId] of classMappings) {
        const isSakit = i === 1 && studentId === santriIds[1];
        const status = isSakit ? 'Sakit' : 'Hadir';
        const notes = isSakit ? 'Demam' : 'Tepat waktu';
        await this.dataSource.query(
          `INSERT INTO "attendance" (date, status, notes, student_id, class_id) VALUES ($1, $2, $3, $4, $5)`,
          [dateStr, status, notes, studentId, classId]
        );
      }
    }

    // 12. Create Mock Ummi Progress Logs (with mistake details & recommendations)
    await this.dataSource.query(
      `INSERT INTO "ummi_progress" (jilid, page, status, teacher_notes, mistake_details, recommendations, target_page, student_id) VALUES 
       ('Jilid 1', 10, 'Lulus', 'Bacaan makhraj huruf sangat baik.', 'Tidak ada kesalahan mayor', 'Lanjutkan halaman selanjutnya dengan konsisten.', 11, $1),
       ('Jilid 1', 11, 'Belum', 'Latih kembali pengucapan huruf Dhad.', 'Pelafalan huruf Dhad masih terdengar seperti Dal', 'Fokus pada penekanan sisi lidah pada gigi geraham atas.', 11, $1)`,
      [santriIds[0]]
    );
    await this.dataSource.query(
      `INSERT INTO "ummi_progress" (jilid, page, status, teacher_notes, mistake_details, recommendations, target_page, student_id) VALUES 
       ('Jilid 1', 15, 'Lulus', 'Lancar membaca, lanjutkan.', 'Sangat bersih dan lancar', 'Pelajari harakat sukun secara mendalam.', 16, $1)`,
      [santriIds[1]]
    );
    await this.dataSource.query(
      `INSERT INTO "ummi_progress" (jilid, page, status, teacher_notes, mistake_details, recommendations, target_page, student_id) VALUES 
       ('Jilid 2', 5, 'Perbaikan', 'Harap perhatikan panjang pendek mad thabi-i.', 'Ketukan mad 2 harakat sering terlewat', 'Gunakan ketukan jari saat latihan mad thabi-i.', 5, $1),
       ('Jilid 2', 5, 'Lulus', 'Sudah bagus dan tepat ketukan mad-nya.', 'Sangat baik', 'Lanjut ke halaman 6.', 6, $1)`,
      [santriIds[2]]
    );

    // 13. Create Mock Weekly Reports
    await this.dataSource.query(
      `INSERT INTO "weekly_reports" (student_id, report_date, attendance_rate, progress_summary, assignments_completed) VALUES 
       ($1, $2, 100, 'Tingkatan Ummi Jilid 1 Halaman 11 (Belum Lulus). Catatan: Ulangi makhraj huruf Dhad.', 2),
       ($3, $2, 100, 'Tingkatan Ummi Jilid 1 Halaman 15 (Lulus). Catatan: Bacaan lancar, dilanjutkan ke materi sukun.', 1)`,
      [santriIds[0], todayStr, santriIds[1]]
    );

    // 14. Create Mock Assignment Templates
    await this.dataSource.query(
      `INSERT INTO "assignment_templates" (title, description, teacher_id) VALUES 
       ('Jilid 1: Latihan Huruf Tunggal Fathah', 'Bacalah huruf hijaiyah berharakat fathah dari Alif sampai Ya secara acak tanpa mengeja dengan ketukan konstan.', $1),
       ('Jilid 2: Latihan Mad Thabi-i', 'Bacalah baris latihan yang mengandung Alif, Ya, dan Wau sukun. Pastikan panjang mad thabi-i tepat 2 harakat.', $1),
       ('Jilid 3: Huruf Sukun dan Qolqolah', 'Bacalah potongan kata dengan huruf sukun, perhatikan pantulan jelas (qolqolah) pada huruf Ba, Ji, Di, Tho, Qo.', $2),
       ('Jilid 4: Hukum Nun Sukun / Tanwin', 'Lafalkan ayat dengan hukum Idgham Bighunnah, Ikhfa Haqiqi, dan Idzhar Halqi secara tepat dengan dengung 2 harakat.', $2),
       ('Jilid 5: Alif Lam Qomariyah & Syamsiyah', 'Praktikkan perbedaan membaca Alif Lam Qomariyah (jelas) dan Alif Lam Syamsiyah (lebur) pada contoh ayat pilihan.', $1),
       ('Jilid 6: Membaca Hukum Gharib', 'Bacalah ayat pilihan yang mengandung bacaan Saktah (berhenti sejenak tanpa bernapas) dan Imalah.', $2),
       ('Al-Qur''an: Hafalan Juz Amma Tartil', 'Setorkan hafalan surat Al-Balad secara tartil dengan tajwid dan makhraj yang benar.', $1)`,
      [guruIds[0], guruIds[1]]
    );

    // 15. Create Mock Materials with Tagging & Folder Hierarchy
    await this.dataSource.query(
      `INSERT INTO "materials" (title, description, file_path, file_size, uploader_id, class_id, tags, folder_path) VALUES 
       ('Panduan Makhraj Hijaiyah', 'PDF petunjuk visual cara melafalkan 28 huruf hijaiyah secara tepat.', 'uploads/panduan_makhraj.pdf', 2450000, $1, $2, 'hijaiyah,makhraj,latihan', 'Ummi Jilid 1'),
       ('Tajwid Hukum Mad Dasar', 'Materi bergambar tentang ketukan mad thabi-i, mad wajib, dan mad jaiz.', 'uploads/tajwid_mad.pdf', 3800000, $3, $4, 'tajwid,mad,bacaan', 'Tajwid Dasar')`,
      [guruIds[0], classIds[0], guruIds[1], classIds[1]]
    );

    // 16. Create Mock Assignments
    const assign1Res = await this.dataSource.query(
      `INSERT INTO "assignments" (title, description, due_date, class_id) VALUES 
       ($1, $2, $3, $4) RETURNING id`,
      ['Tugas Tajwid Jilid 1', 'Silakan rekam suara pelafalan halaman 5-6 dan tulis keterangannya.', new Date(today.getTime() + 86400000 * 2), classIds[0]]
    );
    const assign1Id = assign1Res[0].id;

    // 17. Create Mock Submissions
    await this.dataSource.query(
      `INSERT INTO "submissions" (text_content, file_path, grade, teacher_notes, student_id, assignment_id) VALUES 
       ($1, $2, 95, 'Sangat baik dan tajwid tepat.', $3, $4)`,
      ['Saya sudah mempraktikkan pelafalan dengan ustadz.', null, santriIds[0], assign1Id]
    );
  }
}
