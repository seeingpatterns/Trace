# 보안 강화 (Security Hardening) 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 즉시 조치가 필요한 4개 보안 취약점을 수정하여 프로덕션 배포 가능한 최소 보안 수준 확보

**Architecture:** Express 백엔드에 bcrypt 해싱, helmet 보안 헤더, 환경별 엔드포인트 가드 적용. 프론트엔드는 환경변수 기반 API_BASE로 전환.

**Tech Stack:** bcrypt, helmet.js, Express middleware, Vite env vars

---

## Task 1: .env 보호 + API 키 재발급 안내

**Files:**
- Create: `.env.example`
- Verify: `.gitignore` (이미 `.env` 포함 확인 완료)

**Step 1: .env.example 생성**

```bash
# .env.example — 실제 값은 넣지 마세요!
GEMINI_API_KEY=your-gemini-api-key-here
ADMIN_PASSWORD=your-admin-password-here
```

**Step 2: Git 히스토리 확인**

Run: `git log --oneline -- .env`
Expected: 출력 없음 (커밋된 적 없음 ✅ — 이미 확인 완료)

**Step 3: 사용자에게 API 키 재발급 안내**

- Google AI Studio → API Keys → 현재 키 삭제 → 새 키 발급
- 새 키를 `.env`에 입력

**Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example for safe credential sharing"
```

---

## Task 2: 개발 엔드포인트 제거/보호

**Files:**
- Modify: `backend/server.js:33-66` (schema-check, seed-one-user)

**Step 1: NODE_ENV 가드 미들웨어 추가**

`backend/server.js` 25번째 줄 뒤에 추가:

```javascript
// 개발 전용 엔드포인트 가드
function devOnly(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}
```

**Step 2: 개발 엔드포인트에 가드 적용**

```javascript
// 변경 전:
app.get('/api/schema-check', async (req, res) => {
app.post('/api/dev/seed-one-user', async (req, res) => {

// 변경 후:
app.get('/api/schema-check', devOnly, async (req, res) => {
app.post('/api/dev/seed-one-user', devOnly, async (req, res) => {
```

**Step 3: 에러 메시지 일반화 (DB 정보 노출 방지)**

모든 catch 블록에서 `e.message` 대신 일반 메시지 반환:

```javascript
// 변경 전:
res.status(500).json({ error: e.message });

// 변경 후 (프로덕션):
res.status(500).json({ error: '서버 오류가 발생했어요' });
// 개발 환경에서만 상세 에러:
res.status(500).json({
  error: '서버 오류가 발생했어요',
  ...(process.env.NODE_ENV !== 'production' && { detail: e.message }),
});
```

**Step 4: Commit**

```bash
git add backend/server.js
git commit -m "security: guard dev endpoints and sanitize error messages"
```

---

## Task 3: bcrypt 해싱 + 타이밍 안전 비교

**Files:**
- Modify: `backend/server.js:107, 131` (비밀번호 비교 로직)
- Modify: `backend/package.json` (bcrypt 의존성 추가)
- Modify: `docker-compose.yml:36` (ADMIN_PASSWORD → ADMIN_PASSWORD_HASH)

**Step 1: bcrypt 설치**

```bash
cd backend && npm install bcrypt
```

**Step 2: 해시 생성 스크립트**

```bash
# 비밀번호 해시 생성 (1회성)
node -e "import('bcrypt').then(b => b.default.hash('trace-admin-dev', 12).then(h => console.log(h)))"
```

**Step 3: server.js에 bcrypt import 추가**

```javascript
// 라인 6 뒤에 추가:
import bcrypt from 'bcrypt';
```

**Step 4: 비밀번호 비교를 bcrypt.compare로 변경**

```javascript
// 라인 107 변경 전:
if (password !== process.env.ADMIN_PASSWORD) {

// 변경 후:
const match = await bcrypt.compare(password || '', process.env.ADMIN_PASSWORD_HASH || '');
if (!match) {
```

라인 131도 동일하게 변경.

**Step 5: docker-compose.yml 환경변수 변경**

```yaml
# 변경 전:
ADMIN_PASSWORD: ${ADMIN_PASSWORD:-trace-admin-dev}

# 변경 후:
ADMIN_PASSWORD_HASH: ${ADMIN_PASSWORD_HASH}
```

**Step 6: .env.example 업데이트**

```bash
ADMIN_PASSWORD_HASH=$2b$12$... (bcrypt hash of your password)
```

**Step 7: Commit**

```bash
git add backend/server.js backend/package.json docker-compose.yml .env.example
git commit -m "security: replace plaintext password with bcrypt hash comparison"
```

---

## Task 4: HTTPS + 보안 헤더 적용

**Files:**
- Modify: `backend/server.js:12-18` (CORS + helmet)
- Modify: `backend/package.json` (helmet 의존성 추가)
- Modify: `src/ui.js:32` (API_BASE 환경변수화)
- Modify: `src/data.js:113` (API_BASE 환경변수화)

**Step 1: helmet 설치**

```bash
cd backend && npm install helmet
```

**Step 2: server.js에 helmet 적용**

```javascript
// 라인 6 뒤에 추가:
import helmet from 'helmet';

// app.use(express.json()); 앞에 추가:
app.use(helmet());
```

**Step 3: CORS 환경변수화**

```javascript
// 변경 전 (라인 13):
res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5174');

// 변경 후:
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5174';
res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
```

**Step 4: 프론트엔드 API_BASE 환경변수화**

```javascript
// src/ui.js 라인 32, src/data.js 라인 113:
// 변경 전:
const API_BASE = 'http://localhost:3001';

// 변경 후:
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
```

**Step 5: .env.example에 프론트엔드 변수 추가**

```bash
# Frontend (Vite)
VITE_API_BASE=https://your-backend-url.com
```

**Step 6: docker-compose.yml에 CORS_ORIGIN 추가**

```yaml
CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:5174}
```

**Step 7: Commit**

```bash
git add backend/server.js backend/package.json src/ui.js src/data.js docker-compose.yml .env.example
git commit -m "security: add helmet headers, env-based CORS and API_BASE"
```

---

## 진행 체크리스트

| # | Task | 상태 |
|---|------|------|
| 1 | .env 보호 + API 키 재발급 안내 | ✅ 완료 (`3d1ffab`) |
| 2 | 개발 엔드포인트 제거/보호 | ✅ 완료 (`78cd2cb`) |
| 3 | bcrypt 해싱 + 타이밍 안전 비교 | ✅ 완료 + 핫픽스 (`bc5ae48`) |
| 4 | HTTPS + 보안 헤더 적용 | ✅ 완료 (`e7e736f`) |
