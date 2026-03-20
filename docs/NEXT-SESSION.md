# NEXT-SESSION.md
> AI가 다음 세션에서 바로 이어서 작업할 수 있도록 정리한 핸드오프 문서.
> 마지막 업데이트: 2026-03-21

---

## 현재 상태

| 항목 | 값 |
|------|-----|
| 브랜치 | `rescue/current-state` (리모트 동기화 완료) |
| 워킹 트리 | 깨끗 (변경사항 없음) |
| Phase 1 | ✅ 완료 |
| Phase 2 | ✅ 완료 |
| Phase 3 | 🔲 시작 전 |

## 프로젝트 구조

```
dev/trace/
├── backend/
│   ├── Dockerfile
│   ├── server.js          # Express API (health, reviews CRUD, comments, status, films)
│   ├── logger.js          # pino 로거
│   └── package.json
├── db/init/
│   ├── 01-schema.sql      # users 테이블
│   ├── 02-add-recommender-fields.sql
│   ├── 03-reviews-comments.sql  # reviews, comments 테이블
│   └── 04-add-status.sql  # status 컬럼 추가
├── src/
│   ├── main.js            # 앱 진입점
│   ├── data.js            # 영화/리뷰 데이터 로딩
│   ├── scene.js           # Three.js 성좌도
│   └── ui.js              # UI (카드, 검색, 모달, DNA카드)
├── docker-compose.yml     # db (postgres:16-alpine) + backend
├── films_embedded.json    # 106편 영화 + 임베딩 데이터
├── index.html
├── style.css
└── vite.config.js
```

## 실행 방법

```bash
cd /Users/jungeunkim/dev/trace
docker compose up -d        # DB(5433) + Backend(3001)
npm run dev                 # Frontend (Vite, 5174)
```

## DB 현재 스키마

- **users**: id, thread_id, created_at (+ recommender 관련 필드)
- **reviews**: id, film_title_en (UNIQUE), content (nullable), status, created_at, updated_at
- **comments**: id, review_id (FK), author_thread_id, body, created_at

## 완료된 기능

1. 영화 임베딩 성좌도 (Three.js) — 106편
2. "내 별 찾기" 추천인 검색
3. 감상평 CRUD (관리자 비밀번호 인증, bcrypt)
4. 추천인 댓글 (thread_id 기반)
5. 보안: helmet, rate limiting, XSS 방지, pino audit 로깅
6. 영화 진행 상태 (unwatched/watching/watched 토글 + 진행 바)
7. 클러스터 감성 이름, 추천인 프로필 집계, 취향 DNA 카드 (이미지 저장)
8. API 기반 영화 로딩 + films_embedded.json 폴백

## 인증 방식

- 관리자: `.env`의 `ADMIN_PASSWORD_HASH` (bcrypt)
- 추천인: thread_id 입력만으로 댓글 가능 (로그인 없음)

---

## Phase 3: 다음에 할 작업

### 목표
추천인이 자기만의 프로필 페이지를 갖고, "먼저 감상평을 쓴 뒤에 다른 사람 감상평을 볼 수 있는" 흐름을 만든다.

### Task 3-1: User 프로필 스키마 확장
- `users` 테이블에 컬럼 추가: `slug`, `display_name`, `bio`, `is_public`
- 새 마이그레이션 SQL: `db/init/05-user-profile.sql`
- 기존 볼륨이 있으면 수동 ALTER 필요

### Task 3-2: User 프로필 API
- `GET /api/users/:slug` — 공개 프로필 조회
- `PUT /api/users/:slug` — 프로필 수정 (본인만)
- `GET /api/users/:slug/reviews` — 해당 유저의 감상평 목록

### Task 3-3: "먼저 쓰고 그 다음에 본다" 흐름
- 영화 카드에서 감상평 영역: 본인이 먼저 감상평을 써야 다른 사람 감상평이 보임
- 프론트 로직: `_reviewsMap`에서 현재 유저의 리뷰 존재 여부 체크
- 미작성 → "먼저 감상평을 남겨보세요" 메시지 + 작성 버튼
- 작성 완료 → 다른 사람 감상평 + 댓글 표시

### Task 3-4: 추천인 링크 (프로필 페이지)
- `/profile/:slug` 라우트 (프론트)
- thread_id → slug 매핑
- 프로필 페이지: display_name, bio, 추천 영화 목록, 감상평 모아보기

### 의존성
```
Task 3-1 → Task 3-2 → Task 3-3
                    → Task 3-4
```
Task 3-3과 3-4는 병렬 가능.

---

## 주의사항

- `films_embedded.json`은 DB에 넣지 않음 (정적 데이터, 설계 결정)
- `ADMIN_PASSWORD_HASH`는 `.env`에만 있음 — 절대 코드/커밋에 포함 금지
- Docker 볼륨 리셋 시: `docker compose down -v && docker compose up -d`
- 기존 볼륨이 있으면 init SQL이 자동 실행되지 않음 → 수동 ALTER 필요
- verbatimModuleSyntax: true — type import 시 `import type` 사용 필수
