# AI_GATEWAY_MODULE.md

## Overview

AI Gateway adalah satu-satunya pintu masuk seluruh interaksi AI pada sistem SantriQ.

### Tujuan
- Mengisolasi integrasi Gemini
- Mengontrol biaya API
- Menyediakan cache
- Menyediakan logging
- Menyediakan prompt management
- Memudahkan pergantian provider AI di masa depan

---

## Architecture

```text
Frontend
    │
    ▼
AI Controller
    │
    ▼
AI Service
    │
 ┌──┴─────────────┐
 ▼                ▼
Cache Service   Usage Service
 │                │
 ▼                ▼
Database       Database
 │
 ▼
Prompt Builder
 │
 ▼
Gemini Provider
 │
 ▼
Gemini API
```

---

## Module Structure

```text
src/modules/ai-gateway/

├── ai-gateway.module.ts

├── controllers/
│   └── ai.controller.ts

├── services/
│   ├── ai.service.ts
│   ├── gemini.service.ts
│   ├── ai-cache.service.ts
│   ├── ai-usage.service.ts
│   ├── prompt-builder.service.ts
│   └── prompt-template.service.ts

├── dto/
│   ├── generate-quiz.dto.ts
│   ├── generate-summary.dto.ts
│   └── ask-assistant.dto.ts

├── interfaces/
│   ├── ai-provider.interface.ts
│   └── ai-response.interface.ts

├── constants/
│   ├── ai-models.constant.ts
│   └── prompt-types.constant.ts

└── utils/
    ├── prompt-hash.util.ts
    └── token-estimator.util.ts
```

---

## Core Responsibilities

### AI Controller
- Menerima request
- Validasi DTO
- Delegasi ke service

**Tidak boleh:**
- Membuat prompt
- Memanggil Gemini langsung
- Mengakses database

### AI Service
Orchestrator utama.

**Flow:**
```
Validate
   ↓
Check Quota
   ↓
Check Cache
   ↓
Build Prompt
   ↓
Call Gemini
   ↓
Save Cache
   ↓
Save Usage Log
   ↓
Return Response
```

### Gemini Service
Wrapper resmi Gemini API.
- Autentikasi
- Pemilihan model
- Request API
- Error handling

**Tidak boleh:**
- Business logic
- Cache logic
- Quota logic

### Prompt Builder Service
Membuat prompt dinamis.

#### Contoh Quiz Prompt
```json
{
  "topic": "Tajwid",
  "difficulty": "easy"
}
```
Output:
```
Buat 5 soal pilihan ganda tentang Tajwid tingkat dasar.
Format JSON.
Sertakan jawaban benar.
```

### Prompt Template Service
Menyimpan template baku, contoh:
```
QUIZ_GENERATOR
LESSON_SUMMARY
TEACHER_ASSISTANT
PROGRESS_ANALYSIS
```

### AI Cache Service
Mengurangi biaya API.

**Flow:**
```
Prompt → Generate Hash → Cari di DB →
  Ya → Return Cache
  Tidak → Gemini
```

### AI Usage Service
Mencatat:
- user
- model
- prompt type
- estimasi token
- waktu request

### DTO Design
#### Generate Quiz
```ts
export class GenerateQuizDto {
  materialId: string;
  totalQuestions: number;
  difficulty: string;
}
```
#### Generate Summary
```ts
export class GenerateSummaryDto {
  materialId: string;
}
```
#### Ask Assistant
```ts
export class AskAssistantDto {
  question: string;
}
```

### Supported Prompt Types
```
QUIZ_GENERATOR
ASSIGNMENT_GENERATOR
LESSON_SUMMARY
MATERIAL_TAGGING
PROGRESS_ANALYSIS
TEACHER_ASSISTANT
```

### Gemini Models
#### Default
```
gemini-2.5-flash
```
Digunakan untuk quiz, summary, tagging.

#### Advanced
```
gemini-2.5-pro
```
Digunakan untuk progress analysis, teacher assistant kompleks.

---

## Rate Limiting
- Per user: **20 request / hari**
- Per sistem: **1000 request / hari**

## Cache Strategy
- Masa berlaku: **7 hari**
- Untuk: summary, quiz, tagging
- Tidak berlaku untuk: teacher assistant, progress analysis

## Error Handling
Semua error AI dikonversi menjadi:
```json
{
  "success": false,
  "message": "AI service unavailable"
}
```
Tidak pernah expose raw Gemini error ke frontend.

## Security Rules
### Forbidden
- API key di frontend
- Direct Gemini call dari Flutter
- Menyimpan API key di database

### Required
- API key hanya di ENV
- Semua request melalui backend
- Audit log aktif

## Environment Variables
```env
GEMINI_API_KEY=
AI_DEFAULT_MODEL=gemini-2.5-flash
AI_ADVANCED_MODEL=gemini-2.5-pro
AI_DAILY_LIMIT=1000
AI_USER_LIMIT=20
```

## Future Ready
Provider baru dapat ditambahkan tanpa mengubah controller:
- Gemini
- OpenAI
- Claude
- DeepSeek
- Mistral

## Success Criteria
- Seluruh fitur AI menggunakan gateway
- Tidak ada direct API call
- Ada cache
- Ada usage tracking
- Ada cost control
- Mudah mengganti provider AI
