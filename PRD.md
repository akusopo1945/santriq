# PRD.md

# Product Requirements Document

## Product Name

SantriQ (Working Title)

---

## Version

Phase 2 v2.0 (Gamified & Teacher Productivity Upgrade)

---

# Product Overview

SantriQ adalah sistem LMS ringan untuk Madrasah Diniyah berbasis Metode Ummi yang dirancang khusus agar dapat berjalan stabil di VPS dengan resource terbatas (2GB RAM).

---

# Business Goal

## Short Term

* Digitalisasi proses pembelajaran Madrasah Nurul Muttaqin
* Menggantikan pencatatan manual guru

## Mid Term

* Menjadi sistem internal yayasan yang stabil dan digunakan harian

## Long Term

* Siap dikembangkan menjadi SaaS ringan multi lembaga

---

# System Principle

## 1. Minimal Infrastructure

Tidak menggunakan:

* Redis
* MinIO
* Docker stack kompleks
* AI services

Semua fitur harus berjalan di:

* NestJS + PM2
* PostgreSQL
* Flutter Web static

---

## 2. PM2 First Architecture

Backend wajib:

* Dijalankan oleh PM2
* Single instance mode
* Memory capped process

---

## 3. Simple Data Flow

```text
Flutter Web → Nginx → NestJS (PM2) → PostgreSQL
```

---

# User Roles

## Admin

* Manage users
* Manage classes
* Manage system data

---

## Guru

* Manage kelas
* Upload materi
* Input tugas
* Input absensi
* Input progress Ummi

---

## Santri

* View materi
* Submit tugas
* View progress

---

## Wali Santri

* View progress anak
* View nilai
* View absensi

---

# MVP Features (STRICT SCOPE)

## 1. Authentication

* Email & Password login
* Role-based access control

---

## 2. User Management

* CRUD user
* Assign role

---

## 3. Class Management

* Create class
* Assign students
* Assign teachers

---

## 4. Learning Materials

* Upload file (local storage)
* View materials

---

## 5. Assignments

* Create assignment
* Submit assignment
* Grade assignment

---

## 6. Attendance

* Mark attendance
* Attendance report

---

## 7. Ummi Progress Tracking

* Jilid tracking
* Page tracking
* Teacher notes
* Status (Lulus / Belum / Perbaikan)
* **[Phase 2]** Detail Kesalahan (Tajwid / Makhraj)
* **[Phase 2]** Rekomendasi Latihan Mandiri
* **[Phase 2]** Target Halaman Sesi Berikutnya

---

## 8. Parent Dashboard

* View child progress (Jilid, Page, Status, Mistakes, Recommendations, Target)
* View attendance
* View assignments
* **[Phase 2]** View Gamification Stats (XP, Level, Streak, Badges)
* **[Phase 2]** View Laporan Pekanan (Weekly Performance report card)

---

## 9. Learning Materials (Smart Material System)

* Upload file (local storage)
* View materials
* **[Phase 2]** Folder Hierarchy (select folders on upload, filter by folders in browser)
* **[Phase 2]** Tags Categorization (comma-separated tags on upload, tag badge labels, search by tags)
* **[Phase 2]** Real-time text search and filter by folders

---

## 10. Assignments & Teacher Productivity

* Create assignment
* Submit assignment
* Grade assignment
* **[Phase 2]** Assignment Templates (pre-defined title and instructions to fast-track creation)
* **[Phase 2]** Bulk Progress Editor (spreadsheet-like interface to evaluate whole class simultaneously)
* **[Phase 2]** Copy Previous Progress (duplicate progress from last session to current day)

---

## 11. Gamification & Student Engagement

* **[Phase 2]** XP rewards (presensi = +10 XP, submit tugas = +50 XP, lulus jilid = +100 XP)
* **[Phase 2]** Level Progression (level 1-5, e.g. Pemula, Pembelajar, Rajin, Teladan, Inspirasi)
* **[Phase 2]** Daily Learning Streak counter
* **[Phase 2]** Badge Milestones (Lulusan Jilid 1-6, Absen Rajin, dll.)

---

# Technical Constraints

## Backend

* Must run on PM2
* Single instance only
* Memory optimized (<300MB target)

---

## Database

* PostgreSQL only
* No external DB service
* No caching layer

---

## Storage

* Local filesystem only
* No MinIO / S3

---

# Non Functional Requirements

## Performance

* API response < 500ms
* Page load < 3s (Flutter Web optimized build)

---

## Reliability

* Must survive VPS restart via PM2
* No manual restart required

---

## Maintainability

* Simple modular NestJS structure
* No over-engineering

---

# Out of Scope

NOT included in Phase 2:

* AI features
* Multi tenant SaaS
* Payment system
* Microservices
* Real-time chat system

---

# Success Criteria

MVP dianggap sukses jika:

* Sistem berjalan stabil di VPS 2GB RAM
* Guru aktif menggunakan sistem setiap hari
* Data santri tersimpan digital
* Wali santri bisa melihat progress anak
* Tidak ada ketergantungan service eksternal
