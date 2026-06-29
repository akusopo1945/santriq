# Phase 2 Implementation Blueprint - SantriQ

Dokumen ini mendefinisikan rencana teknis, perubahan skema database, dan struktur API untuk implementasi fitur-fitur Phase 2 SantriQ.

---

## 1. Perubahan Skema Database (Database Migrations)

### 1.1 Tabel `users` (Penambahan Atribut Gamifikasi)
Untuk menyimpan status XP, level, dan streak santri:
* `xp` (INT, default 0)
* `level` (INT, default 1)
* `streak` (INT, default 0)
* `last_active_date` (DATE, nullable)

### 1.2 Tabel Baru: `user_badges` (Pencapaian Santri)
Menyimpan data lencana yang dibuka oleh santri:
```sql
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
```

### 1.3 Tabel `materials` (Penambahan Hirarki & Tagging)
* `tags` TEXT (Format koma terpisah untuk meminimalkan join query)
* `folder_path` VARCHAR(255) (e.g., "Ummi Jilid 1", "Tajwid Dasar")

### 1.4 Tabel `ummi_progress` (Evolusi Progress Detail)
* `mistake_details` TEXT (Catatan detil makhraj/tajwid yang salah)
* `recommendations` TEXT (Rekomendasi latihan)
* `target_page` INT (Target halaman sesi berikutnya)

### 1.5 Tabel Baru: `assignment_templates` (Produktivitas Guru)
Menyimpan template tugas milik guru:
```sql
CREATE TABLE assignment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 1.6 Tabel Baru: `weekly_reports` (Parent Monitoring)
Laporan pekanan yang digenerate otomatis:
```sql
CREATE TABLE weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    attendance_rate INT NOT NULL, -- Persentase (0-100)
    progress_summary TEXT NOT NULL,
    assignments_completed INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Struktur API Endpoints Baru

### Gamification (`/api/gamification`)
* `GET /api/gamification/student/:studentId` - Mengambil XP, level, streak, dan list badges santri.
* `POST /api/gamification/claim-streak` - Memicu klaim streak belajar harian.

### Materials Enhancements (`/api/materials`)
* `GET /api/classes/:classId/materials` - Mendukung query filter pencarian & folder_path.

### Teacher Productivity (`/api/templates`)
* `GET /api/templates` - List templates tugas milik guru.
* `POST /api/templates` - Membuat template tugas baru.
* `DELETE /api/templates/:id` - Menghapus template.

### Bulk Actions (`/api/classes/:classId/bulk`)
* `POST /api/classes/:classId/bulk-progress` - Bulk update progress Ummi santri dalam satu klik.
* `POST /api/classes/:classId/copy-progress` - Menyalin progress membaca dari sesi pertemuan sebelumnya.

### Weekly Reports (`/api/students/:studentId/reports`)
* `GET /api/students/:studentId/reports` - List laporan pekanan anak untuk Wali Santri.
* `POST /api/students/:studentId/reports/generate` - Membuat laporan mingguan (Admin/Guru).

---

## 3. Langkah Implementasi
1. **Langkah 1**: Perbarui entitas backend (`User`, `Material`, `UmmiProgress`) dan buat entitas baru (`UserBadge`, `AssignmentTemplate`, `WeeklyReport`).
2. **Langkah 2**: Terapkan logika XP, Level, dan Streak saat Santri mengumpulkan tugas, melakukan presensi Hadir, atau Guru memicu progress Ummi Lulus.
3. **Langkah 3**: Buat endpoint materi bersarang (folder) dan template tugas.
4. **Langkah 4**: Hubungkan frontend UI dengan menu gamifikasi, progress mendalam, dan template tugas Guru.
