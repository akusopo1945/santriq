---
version: alpha
name: santriq-theme
description: Theme tokens for SantriQ Madrasah Diniyah LMS
colors:
  primary: '#15803d'
  primary-light: '#dcfce7'
  primary-dark: '#14532d'
  secondary: '#0284c7'
  secondary-light: '#e0f2fe'
  background: '#f8fafc'
  surface: '#ffffff'
  text-primary: '#0f172a'
  text-secondary: '#475569'
  border: '#e2e8f0'
  success: '#16a34a'
  warning: '#eab308'
  danger: '#dc2626'
typography:
  font-family: 'Outfit, Inter, sans-serif'
  h1:
    fontFamily: 'Outfit'
    fontSize: '32px'
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: 'Outfit'
    fontSize: '24px'
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: 'Inter'
    fontSize: '16px'
    fontWeight: '400'
    lineHeight: '1.5'
  caption:
    fontFamily: 'Inter'
    fontSize: '14px'
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: '4px'
  md: '8px'
  lg: '12px'
  xl: '16px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '32px'
components:
  card:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.md}'
    padding: '{spacing.md}'
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
    rounded: '{rounded.md}'
    padding: '{spacing.sm} {spacing.md}'
---

# Brand & Style

Sistem desain **SantriQ** mengusung estetika islami modern yang bersih dan ramah pengguna. Mengingat target audiens adalah guru (ustadz/ustadzah), santri, dan wali santri, visual identity dirancang untuk fokus pada keterbacaan yang tinggi, navigasi yang intuitif, serta load time yang cepat di Flutter Web.

---

# Colors

Tabel di bawah ini mendefinisikan palet warna resmi untuk SantriQ:

| Token | Nilai | Kegunaan |
|---|---|---|
| `colors.primary` | `#16a34a` | Warna utama identitas islami/madrasah (Hijau) |
| `colors.primary-light` | `#dcfce7` | Latar belakang tint hijau untuk alert/highlight positif |
| `colors.primary-dark` | `#14532d` | Warna teks berlatar belakang terang atau button hover |
| `colors.secondary` | `#0284c7` | Warna aksen akademik dan administrasi (Biru) |
| `colors.secondary-light` | `#e0f2fe` | Latar belakang tint biru untuk penanda informasi |
| `colors.background` | `#f8fafc` | Latar belakang halaman aplikasi (Slate 50) |
| `colors.surface` | `#ffffff` | Latar belakang card, dialog, dan sidebar |
| `colors.text-primary` | `#0f172a` | Teks utama dengan tingkat kontras tinggi (Slate 900) |
| `colors.text-secondary` | `#475569` | Teks deskripsi atau meta-informasi (Slate 600) |
| `colors.border` | `#e2e8f0` | Garis pembatas komponen dan tabel (Slate 200) |
| `colors.success` | `#16a34a` | Penanda status lulus/selesai |
| `colors.warning` | `#eab308` | Penanda status perbaikan/proses |
| `colors.danger` | `#dc2626` | Penanda status belum lulus/error |

---

# Typography

Sistem tipografi menggunakan kombinasi **Outfit** untuk heading (kesan modern & bersahabat) dan **Inter** untuk body copy (kesan clean & sangat terbaca).

- **Heading 1 (H1)**: `Outfit`, `32px`, `Bold` (700) - Judul Halaman Utama.
- **Heading 2 (H2)**: `Outfit`, `24px`, `Semi-Bold` (600) - Sub-judul Section / Card Title.
- **Body**: `Inter`, `16px`, `Regular` (400) - Teks utama, konten tugas, deskripsi materi.
- **Caption**: `Inter`, `14px`, `Medium` (500) - Detail kecil, teks absen, info tanggal.

---

# Layout & Spacing

Sistem spacing menggunakan kelipatan linear untuk konsistensi jarak antar elemen:

- **Extra Small (xs - 4px)**: Jarak antara ikon dan teks kecil.
- **Small (sm - 8px)**: Padding internal tombol, jarak antar input form.
- **Medium (md - 16px)**: Padding default card, jarak antar elemen sebaris.
- **Large (lg - 24px)**: Padding halaman, jarak vertikal antar card utama.
- **Extra Large (xl - 32px)**: Jarak antar section besar.

---

# Elevation

Menggunakan bayangan tipis (soft shadows) untuk memberikan hierarki kedalaman tanpa memperlambat rendering Flutter Web di device low-end:

- **Flat**: `border: 1px solid {colors.border}` (Default untuk card & tabel).
- **Elevated (Dropdown/Modal)**: `box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)`.

---

# Shapes

Menerapkan sudut membulat (border-radius) yang halus untuk memberikan kesan ramah dan modern:

- **Small (sm - 4px)**: Digunakan pada checkbox, input, badge.
- **Medium (md - 8px)**: Digunakan pada card materi, button utama.
- **Large (lg - 12px)**: Digunakan pada dialog popup, panel sidebar.
- **Extra Large (xl - 16px)**: Digunakan pada layout dashboard container.

---

# Components

### 1. Card Container
- **Latar Belakang**: `{colors.surface}`
- **Sudut**: `{rounded.md}` (8px)
- **Border**: `1px solid {colors.border}`
- **Padding**: `{spacing.md}` (16px)

### 2. Primary Button
- **Latar Belakang**: `{colors.primary}`
- **Teks**: `{colors.surface}` (Putih, Bold)
- **Sudut**: `{rounded.md}` (8px)
- **Padding**: `{spacing.sm} {spacing.md}` (8px vertikal, 16px horizontal)

### 3. Badge Status Ummi
- **Lulus**: Latar belakang `{colors.primary-light}`, Teks `{colors.primary-dark}`
- **Belum**: Latar belakang `#fee2e2` (red-100), Teks `{colors.danger}`
- **Perbaikan**: Latar belakang `#fef9c3` (yellow-100), Teks `{colors.warning}`

---

# Do's and Don'ts

### Do's:
1. Gunakan `{colors.primary}` (Hijau) sebagai warna aksi utama aplikasi.
2. Gunakan font `Outfit` khusus untuk Heading. Jangan gunakan untuk teks paragraf/body.
3. Selalu beri padding minimal `{spacing.md}` pada layout card agar konten tidak menempel ke border.

### Don'ts:
1. Jangan gunakan efek bayangan (shadow) yang terlalu tebal atau berlebihan karena dapat memperlambat performa render Flutter Web di perangkat murah.
2. Jangan menggunakan warna murni hitam (`#000000`) untuk teks. Selalu gunakan `{colors.text-primary}` (`#0f172a`) agar mata pengguna tidak cepat lelah.
3. Jangan menaruh terlalu banyak elemen dalam satu baris tanpa spacing memadai.
