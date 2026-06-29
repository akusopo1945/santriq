# Database Schema - SantriQ

Dokumen ini mendefinisikan skema database PostgreSQL untuk SantriQ LMS. Skema dirancang seminimalis mungkin dengan mengoptimalkan penggunaan tipe data native, foreign key constraints, dan indexing untuk query yang efisien.

---

## 1. Entity Relationship Diagram (ERD) - Conceptual

```text
  +------------------+          +------------------+          +-------------------+
  |      users       |◄─────────|  parents_mapping |─────────►|       users       |
  |     (Parent)     |          |                  |          |     (Student)     |
  +------------------+          +------------------+          +-------------------+
                                                                        ▲
                                                                        │
  +------------------+          +------------------+                    │
  |      classes     |◄─────────|  class_students  |────────────────────┤
  |                  |          |                  |                    │
  +------------------+          +------------------+                    │
           ▲                                                            │
           │                                                            │
           ├────────────────────────────┐                               │
           │                            │                               │
           ▼                            ▼                               ▼
  +------------------+          +------------------+          +-------------------+
  |    materials     |          |   assignments    |          |    attendance     |
  +------------------+          +------------------+          +-------------------+
                                         ▲                              ▲
                                         │                              │
                                         ▼                              │
                                +------------------+                    │
                                |   submissions    |────────────────────┘
                                +------------------+
                                         ▲
                                         │
                                         ▼
                                +------------------+
                                |  ummi_progress   |
                                +------------------+
```

---

## 2. Definisi Tabel

### 2.1 Table: `users`
Menyimpan semua role pengguna: Admin, Guru, Santri, dan Wali Santri.

```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'GURU', 'SANTRI', 'WALI');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing untuk mempercepat login & pencarian role
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 2.2 Table: `classes`
Menyimpan data kelas yang dikelola guru.

```sql
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_teacher ON classes(teacher_id);
```

### 2.3 Table: `class_students`
Menghubungkan santri ke dalam kelas (relationship Many-to-Many).

```sql
CREATE TABLE class_students (
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (class_id, student_id)
);

CREATE INDEX idx_class_students_student ON class_students(student_id);
```

### 2.4 Table: `parents_mapping`
Menghubungkan Wali Santri dengan anak (santri) mereka.

```sql
CREATE TABLE parents_mapping (
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (parent_id, student_id)
);

CREATE INDEX idx_parents_mapping_student ON parents_mapping(student_id);
```

### 2.5 Table: `materials`
Penyimpanan metadata file materi pelajaran yang diupload ke local storage.

```sql
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(512) NOT NULL, -- Path ke local file storage
    file_size INT NOT NULL,          -- Ukuran file dalam bytes
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materials_class ON materials(class_id);
```

### 2.6 Table: `assignments`
Tugas kelas yang diposting oleh Guru.

```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_class ON assignments(class_id);
```

### 2.7 Table: `submissions`
Pengumpulan tugas oleh Santri.

```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(512),          -- File jawaban santri (opsional jika ada input teks)
    text_content TEXT,               -- Konten teks jawaban (opsional)
    grade INT CHECK (grade >= 0 AND grade <= 100), -- Nilai 0-100
    teacher_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX idx_submissions_assignment_student ON submissions(assignment_id, student_id);
```

### 2.8 Table: `attendance`
Absensi harian kelas.

```sql
CREATE TYPE attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alfa');

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    notes VARCHAR(255),
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint agar satu santri hanya absen 1x per kelas per hari
CREATE UNIQUE INDEX idx_attendance_day ON attendance(class_id, student_id, date);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
```

### 2.9 Table: `ummi_progress`
Tracking pembelajaran Metode Ummi (Jilid 1-6 & Al-Qur'an).

```sql
CREATE TYPE ummi_status AS ENUM ('Lulus', 'Belum', 'Perbaikan');

CREATE TABLE ummi_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jilid VARCHAR(50) NOT NULL,      -- 'Jilid 1', 'Jilid 2', ..., 'Quran'
    page INT NOT NULL,              -- Halaman saat ini
    status ummi_status NOT NULL DEFAULT 'Belum',
    teacher_notes TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing untuk query riwayat progress santri tercepat
CREATE INDEX idx_ummi_progress_student ON ummi_progress(student_id);
CREATE INDEX idx_ummi_progress_date ON ummi_progress(updated_at DESC);
```

---

## 3. Optimasi Indexing & Performance (VPS 2GB RAM)

1. **Foreign Key Indexes**:
   Secara default, PostgreSQL tidak membuat indeks pada foreign key. Di semua tabel di atas, indeks manual dibuat pada kolom yang direferensikan (`class_id`, `student_id`, `teacher_id`) untuk mempercepat operasi `JOIN`.
2. **Constraint Checks**:
   Tabel `submissions` memiliki check constraint `CHECK (grade >= 0 AND grade <= 100)` langsung di level database untuk menjamin integritas data tanpa perlu query tambahan dari server NestJS.
3. **Optimized Data Types**:
   - `UUID` digunakan sebagai Primary Key untuk skalabilitas ID yang lebih aman dan memudahkan migrasi/sinkronisasi di masa depan.
   - `DATE` digunakan untuk data absen (tanpa komponen jam) untuk menghemat ruang penyimpanan dan mempermudah filter tanggal.
