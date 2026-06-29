# SantriQ - LMS Madrasah Diniyah (Metode Ummi)

SantriQ adalah sistem manajemen pembelajaran (LMS) ringan yang dirancang khusus untuk Madrasah Diniyah dengan basis pengajaran Metode Ummi. Aplikasi ini dirancang agar hemat sumber daya, stabil berjalan di VPS berspesifikasi rendah (RAM 2GB, CPU 2 Core).

---

## 🚀 Tautan Akses Aplikasi

Aplikasi berjalan di VPS `13.55.3.99` dengan SSL Let's Encrypt terbit otomatis di alamat:
* **Tautan Utama**: [https://santriq.13.55.3.99.sslip.io](https://santriq.13.55.3.99.sslip.io)
* **Tautan Cadangan**: [https://santriq.13.55.3.99.nip.io](https://santriq.13.55.3.99.nip.io)

---

## 🛠️ Tech Stack & Konfigurasi VPS

1. **Frontend (SPA)**:
   - Aset statis berupa HTML5/CSS3/Vanilla JS diletakkan di `/var/www/html/santriQ/frontend`.
   - Menggunakan CSS variable modern untuk visual identity dan interaksi transisi tema (Light/Dark Mode) berbasis View Transition API.
2. **Backend**:
   - NestJS REST API berjalan di bawah daemon **PM2** di port **3005** (karena konflik port 3000-3002).
3. **Web Server**:
   - **Caddy** bertindak sebagai reverse proxy ke NestJS (`/api*`) dan melayani static files frontend secara langsung dengan enkripsi HTTPS SSL Let's Encrypt otomatis.
4. **Database**:
   - PostgreSQL lokal dengan optimalisasi ram (`shared_buffers = 512MB`, `max_connections = 50`).
5. **Storage**:
   - File materi ajar dan jawaban tugas disimpan secara lokal di VPS pada direktori `/var/www/html/santriQ/uploads`.

---

## 🔑 Akun Demo (Hasil Seeder)

Untuk mempermudah pengujian seluruh fitur, gunakan tombol **Inisialisasi Data Demo (Seeder)** di halaman login untuk mengisi ulang database secara otomatis dengan data berikut:

* **Administrator Yayasan** (Admin):
  - Email: `admin@santriq.com`
  - Password: `adminPassword123`
* **Ustadz Ahmad Fauzi** (Guru Kelas Jilid 1-A):
  - Email: `ustadz.ahmad@santriq.com`
  - Password: `password123`
* **Ustadzah Aisyah Aminah** (Guru Kelas Jilid 2-B):
  - Email: `ustadzah.aisyah@santriq.com`
  - Password: `password123`
* **Pak Ahmad** (Wali Santri dari Muhammad Ali & Fatima):
  - Email: `wali.ahmad@santriq.com`
  - Password: `password123`
* **Ibu Aisyah** (Wali Santri dari Aisha & Hassan):
  - Email: `wali.aisyah@santriq.com`
  - Password: `password123`
* **Muhammad Ali** / **Fatima Az-Zahra** (Santri):
  - Email: `ali@santriq.com` / `fatima@santriq.com`
  - Password: `password123`

---

## 📂 Struktur Direktori Utama

```text
santriQ/
├── src/
│   ├── modules/
│   │   ├── auth/              # JWT Autentikasi & RBAC
│   │   ├── users/             # CRUD User & Hubungan Wali-Anak
│   │   ├── classes/           # Manajemen Kelas & Enrolment
│   │   ├── materials/         # Manajemen File Materi Ajar
│   │   ├── assignments/       # Tugas & Nilai Pengumpulan
│   │   ├── attendance/        # Absensi Kelas Harian
│   │   └── ummi-progress/     # Log Buku Perkembangan Jilid Ummi
│   ├── app.controller.ts      # Expose endpoint /api/seed-demo
│   └── app.service.ts         # Logic seeding data demo & admin
├── frontend/
│   └── index.html             # Single-Page App (Dashboard & Theme Switcher)
├── ecosystem.config.js        # Konfigurasi manajemen proses PM2
└── README.md                  # Dokumentasi ini
```

---

## ⚙️ Perintah Manajemen Proses (PM2)

Backend dijalankan secara permanen oleh PM2. Gunakan perintah berikut di direktori root aplikasi:

* **Melihat Status Layanan**:
  ```bash
  pm2 list
  ```
* **Melihat Log Real-time**:
  ```bash
  pm2 logs santriq-backend
  ```
* **Melakukan Restart Backend (Setelah Update Kode)**:
  ```bash
  npm run build && pm2 restart santriq-backend
  ```
* **Menyimpan Daftar Proses saat Reboot VPS**:
  ```bash
  pm2 save
  ```

---

## 💾 Pencadangan Harian (Daily Backup)

Sistem melakukan pencadangan otomatis (PostgreSQL `pg_dump` yang dikompresi) setiap hari pada pukul **02:00 pagi** ke folder `/home/akuncilik/backups`.
* Cadangan yang berumur lebih dari 7 hari akan dihapus secara otomatis demi menghemat kapasitas disk.
* File backup tersimpan secara aman dalam format `db_backup_YYYY-MM-DD_HHMMSS.sql.gz`.
* Script backup: `/home/akuncilik/backup_db.sh`
