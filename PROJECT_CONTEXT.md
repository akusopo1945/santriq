# PROJECT_CONTEXT.md

# Project Context

## Project Name

SantriQ (Working Title)

---

## Project Type

Lightweight Web-Based LMS (Low Resource Production System)

---

## Organization

Yayasan Sosial dan Pendidikan Nurul Muttaqin

---

# Vision

Membangun platform pembelajaran Madrasah Diniyah berbasis Metode Ummi yang:

* Ringan
* Stabil di VPS 2GB RAM
* Mudah di-maintain
* Tetap fungsional untuk operasional sekolah
* Siap dikembangkan ke SaaS di masa depan

---

# Core Objective

Sistem ini harus:

1. Bisa berjalan stabil di VPS minimal (2GB RAM)
2. Tidak bergantung pada banyak service tambahan
3. Menggunakan PM2 untuk process management backend
4. Menghindari arsitektur over-engineered
5. Fokus pada kebutuhan nyata madrasah

---

# Non-Goals (Sangat Penting)

Sistem ini TIDAK menargetkan:

* Microservices
* High-scale distributed system
* AI features di awal
* Redis / cache layer
* Object storage seperti MinIO
* Kubernetes
* Multi-server architecture

---

# Core Philosophy

## 1. Simplicity First

Lebih baik sedikit fitur tapi stabil, daripada banyak fitur tapi crash.

---

## 2. Low Resource First

Semua desain harus mempertimbangkan:

* RAM 2GB
* CPU 2 core
* Single server deployment

---

## 3. Teacher-Centric

Guru tetap pusat proses pembelajaran.

Sistem hanya membantu administrasi.

---

## 4. Production Early

Semua fitur harus langsung bisa dipakai di lingkungan nyata (bukan sekadar demo).

---

# System Constraints

## Infrastructure Limit

* RAM: 2GB minimum target
* Storage: local disk only
* No distributed systems

---

## Runtime Constraints

* Single NestJS instance (PM2)
* PostgreSQL single node
* Static Flutter Web build

---

# Target Users

## Primary

* Guru / Ustadz
* Santri

## Secondary

* Wali Santri
* Admin Yayasan

---

# Key Outcome

Jika sukses, sistem harus:

* Dipakai harian oleh guru
* Menggantikan pencatatan manual
* Menjadi pusat data santri
* Memberikan transparansi ke wali santri

---

# Future Expansion (Not Now)

Setelah stabil:

* Gamifikasi
* AI tutor
* Quiz generator
* SaaS multi tenant

---

# Deployment Target

* Ubuntu VPS (2GB RAM)
* Nginx
* PM2
* PostgreSQL native install
* Flutter static hosting
