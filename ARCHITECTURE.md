# Architecture Document - SantriQ

Dokumen ini menjelaskan desain arsitektur sistem **SantriQ** (LMS Madrasah Diniyah berbasis Metode Ummi). Target utama arsitektur ini adalah stabilitas di VPS berspesifikasi rendah (RAM 2GB, CPU 2 Core, single server).

---

## 1. High-Level Architecture

SantriQ menggunakan arsitektur monolitik ringan (Monolithic Single-Server) untuk meminimalkan overhead jaringan dan konsumsi memori.

```text
+-------------------------------------------------------------------+
|                           Ubuntu VPS                              |
|                                                                   |
|  [ Client Browser ]                                               |
|         │                                                         |
|         ▼ (Port 80/443)                                           |
|    ┌─────────┐                                                    |
|    │  Nginx  │ ─── (Static Assets) ──► [ Flutter Web Static ]     |
|    └────┬────┘                                                    |
|         │ (Reverse Proxy)                                         |
|         ▼ (Port 3000)                                             |
|  ┌─────────────┐                                                  |
|  │ NestJS (PM2)│ ─── (Local Storage) ──► [ /var/www/html/uploads ]|
|  └──────┬──────┘                                                  |
|         │ (Native Unix Socket/TCP)                                |
|         ▼                                                         |
|  ┌─────────────┐                                                  |
|  │ PostgreSQL  │                                                  |
|  └─────────────┘                                                  |
+-------------------------------------------------------------------+
```

### Komponen Utama:
1. **Nginx**:
   - Sebagai web server untuk melayani aset statis Flutter Web secara langsung.
   - Sebagai reverse proxy ke backend NestJS.
   - Menangani SSL termination (Let's Encrypt).
2. **Flutter Web Static**:
   - SPA (Single Page Application) hasil compile production.
   - Tidak menggunakan SSR (Server Side Rendering) untuk menghemat RAM server.
3. **NestJS (PM2)**:
   - Rest API Server.
   - Berjalan di single instance di bawah PM2.
   - Memory limit diset ketat agar proses restart otomatis jika bocor memori.
4. **PostgreSQL**:
   - Database relational terinstal langsung di VPS (tanpa Docker).
   - Pengaturan pool connection dibatasi (max 20) untuk menghemat RAM.
5. **Local Filesystem**:
   - Penyimpanan materi belajar menggunakan storage lokal VPS.
   - Path default: `/var/www/html/santriq-uploads`.

---

## 2. Struktur Direktori Backend (NestJS)

Mengikuti arsitektur modular standar NestJS dengan fokus pada modularitas horizontal untuk memudahkan transisi ke microservices atau modul terpisah di masa depan (jika diperlukan), namun tetap sederhana di dalam monolit.

```text
src/
├── app.module.ts              # Entry module utama aplikasi
├── main.ts                    # Entrypoint aplikasi NestJS
│
├── common/                    # Helper global dan shared logic
│   ├── decorators/            # Custom decorators (e.g. @Roles, @CurrentUser)
│   ├── filters/               # HttpException filters
│   ├── guards/                # Auth guard, roles guard
│   ├── interceptors/          # Response formatter, logging interceptor
│   └── pipes/                 # Validasi data global
│
└── modules/                   # Fitur bisnis (Modular)
    ├── auth/                  # Sistem Login, Register, JWT & RBAC
    ├── users/                 # Manajemen User (Admin, Guru, Santri, Wali)
    ├── classes/               # Manajemen Kelas & mapping Guru/Santri
    ├── materials/             # Upload & unduh materi belajar lokal
    ├── assignments/           # Manajemen tugas (Buat, kumpul, nilai)
    ├── attendance/            # Input absensi harian santri
    └── ummi-progress/         # Log progress jilid & halaman Ummi santri
```

---

## 3. Database & Cache Strategy

### 3.1 PostgreSQL Optimization (RAM 2GB)
Tanpa adanya pooling proxy eksternal, konfigurasi PostgreSQL dioptimalkan langsung di `postgresql.conf`:
- `max_connections = 50` (Nilai rendah mencegah konsumsi memori berlebih per connection).
- `shared_buffers = 512MB` (25% dari total RAM 2GB).
- `work_mem = 4MB` (Membatasi RAM untuk sorting query berat).
- `maintenance_work_mem = 64MB`.

### 3.2 No-Cache Layer
Sesuai PRD, sistem **tidak menggunakan Redis**. Kecepatan query didapatkan dari:
- Penggunaan indeks yang tepat pada primary key & foreign key.
- Denormalisasi data minor jika diperlukan untuk dashboard.
- Optimasi query SQL (menghindari N+1 query).

---

## 4. PM2 & Run-Time Optimization

Backend NestJS dijalankan menggunakan PM2 dengan spesifikasi file `ecosystem.config.js` berikut untuk menjamin high availability di VPS berspesifikasi rendah:

```javascript
module.exports = {
  apps: [
    {
      name: 'santriq-backend',
      script: 'dist/main.js',
      instances: 1,                 // Single instance mode sesuai PRD
      exec_mode: 'fork',            // Fork mode untuk resource terendah
      watch: false,                 // Matikan watch di production
      max_memory_restart: '300M',   // Restart jika konsumsi memori > 300MB
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
```

### Alasan Pengaturan:
- **`instances: 1`**: Untuk server RAM 2GB, clustering Node.js justru memboroskan RAM tanpa peningkatan performa yang sebanding.
- **`max_memory_restart: '300M'`**: NestJS secara normal mengonsumsi RAM sekitar 80-150MB. Jika terjadi kebocoran memori (memory leak), PM2 akan melakukan restart otomatis sebelum VPS crash kehabisan RAM.

---

## 5. Security & Isolation

1. **Role-Based Access Control (RBAC)**:
   Setiap endpoint API dilindungi oleh `AuthGuard` (JWT) dan `RolesGuard`. Role terbagi menjadi: `ADMIN`, `GURU`, `SANTRI`, dan `WALI`.
2. **Upload Sanitization**:
   File upload dibatasi maksimal 10MB per file. Ekstensi file divalidasi ketat (hanya PDF, Dokumen, Gambar) untuk mencegah upload script berbahaya (PHP/JS).
3. **Nginx Security Headers**:
   Nginx dikonfigurasi untuk menyembunyikan versi server dan menerapkan headers keamanan standar:
   - `X-Frame-Options: SAMEORIGIN`
   - `X-Content-Type-Options: nosniff`
   - `X-XSS-Protection: 1; mode=block`
   - `Content-Security-Policy` dasar.

---

## 6. Disaster Recovery & Maintenance

1. **Backup Database Harian**:
   Script cronjob harian untuk melakukan `pg_dump` ke direktori lokal terkompresi. Backup disimpan maksimal selama 7 hari ke belakang.
2. **Auto-start**:
   PM2 dikonfigurasi menggunakan startup script sistem agar backend otomatis berjalan kembali saat VPS reboot/restart:
   ```bash
   pm2 startup systemd
   pm2 save
   ```
