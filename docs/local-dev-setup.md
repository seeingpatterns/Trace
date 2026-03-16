# 로컬 개발 환경 구성

## 구조 요약

| 구분 | 기술 스택 | 실행 방식 |
|------|-----------|-----------|
| **frontend** | Vite, Three.js, GSAP (Node.js 기반) | 로컬 서버 (`npm run dev`) |
| **backend** | Node.js, Express | Docker 컨테이너 |
| **db** | PostgreSQL 16 | Docker 컨테이너 |

## 맞는지 확인 (요약)

- **frontend**: 로컬에서 Vite dev 서버로 접근 → ✅
- **backend + db**: Docker로 컨테이너에서 실행 → ✅
- **추천 스택**: 이전 계획 문서에는 백엔드가 없어서, Node.js + Express + PostgreSQL 조합을 사용했습니다. 나중에 GraphQL이나 다른 DB가 필요하면 그때 추가하면 됩니다.

## 실행 방법

### 1. DB + Backend (Docker)

```bash
# 프로젝트 루트에서
docker compose up -d

# 백엔드 API: http://localhost:3001
# DB: localhost:5433 (user: dev, password: dev, db: trace) — 호스트만 5433, 컨테이너 내부는 5432
```

DB 스키마는 **컨테이너 첫 실행 시** `db/init/01-schema.sql`이 자동 적용됩니다. 이미 volume이 있으면 적용되지 않으므로, 스키마를 다시 넣으려면 `docker compose down -v` 후 다시 `up` 하세요.

### 2. Frontend (로컬)

```bash
npm run dev
# 브라우저: http://localhost:5174 (Psychpaper이 5173 사용 중)
```

### 3. 프론트엔드에서 백엔드 호출

개발 시에는 프론트가 `http://localhost:5174`, 백엔드가 `http://localhost:3001`입니다. 백엔드 CORS는 5174 origin을 허용해 두었습니다 (필요 시 `backend/server.js`에서 수정).

## 중지

```bash
docker compose down
# DB 데이터 유지: volume trace_db_data 에 보관됨
# volume까지 지우려면: docker compose down -v
```

## 검증 (Spec.me)

- **스키마 확인:** `GET http://localhost:3001/api/schema-check` → `{ ok: true, tables: ["articles","comments","users"] }`
- **User 1행 넣기:** `POST http://localhost:3001/api/dev/seed-one-user` (body `{ "identifier": "test@trace.local" }` 선택). 응답에 방금 넣은 행(id, identifier, created_at)이 오면 성공.

## 파일 역할

- `docker-compose.yml`: backend + db 서비스 정의, db init 마운트
- `db/init/01-schema.sql`: users, articles, comments 테이블 생성 (첫 기동 시 적용)
- `backend/Dockerfile`: 백엔드 이미지 빌드
- `backend/server.js`: `/health`, `/api/schema-check`, `/api/dev/seed-one-user`
