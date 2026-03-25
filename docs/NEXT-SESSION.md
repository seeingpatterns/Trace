# NEXT-SESSION.md
> AI가 다음 세션에서 바로 이어서 작업할 수 있도록 정리한 핸드오프 문서.
> 마지막 업데이트: 2026-03-25

---

## 현재 상태

| 항목 | 값 |
|------|-----|
| 브랜치 | `rescue/current-state` |
| 워킹 트리 | **커밋 필요** — Phase 1 + Phase 2 변경사항 있음 |
| 도메인 정리 Phase 1 | ✅ Source-of-truth 선언 + 동기 메커니즘 |
| 도메인 정리 Phase 2 | ✅ 로컬 변수/내부 상태/CSS 리네임 (user → recommender) |
| 도메인 정리 Phase 3 | 🔲 export 함수/인터페이스 리네임 (다음 작업) |
| 도메인 정리 Phase 4 | 🔲 백엔드/DB 정리 (선택) |

## 이번 세션에서 한 일

### Phase 1: Source-of-Truth 선언 (완료)
- `films_embedded.json` (루트)을 canonical source로 선언
- `public/films_embedded.json`은 파생 복사본으로 명확화
- `scripts/sync-films.mjs` 생성 — 검증 포함 동기 스크립트
  - 파일 존재, JSON 유효, 배열 셰이프, 필수 필드 10개, 좌표/클러스터 타입 검증
- `package.json`에 `sync:films` (수동) + `prebuild` (자동) 추가
- `docs/DATA-SOURCES.md` 생성 — 데이터 흐름도, 런타임 Film 셰이프, 환경별 동작
- `public/README.md` 생성 — 편집 금지 안내

### Phase 2: 도메인 네이밍 수정 (완료)
- "user"가 "recommender"를 뜻하는 모든 로컬 변수/내부 상태 리네임
- 리네임 목록:
  - `highlightUser` → `highlightRecommender` (main.js)
  - `userFilmIndices` → `recommenderFilmIndices` (main.js, ui.js)
  - `_userFilmIndices` → `_recommenderFilmIndices` (scene.js)
  - `isUserFilm` → `isHighlighted` (scene.js, ui.js)
  - `userId` → `recommenderId` (ui.js 내부 함수)
  - `.user-name` → `.recommender-name` (style.css, main.js, ui.js)
  - `@username` → `@recommender` (index.html)
- URL: `?recommender=` 우선, `?user=` 폴백 유지
- export 함수명은 의도적으로 유지 (Phase 3에서 처리):
  - `setUserFilmIndices` (ui.js export)
  - `buildConstellation(films, highlightUser, userFilmIndices)` (scene.js 시그니처)

## 미커밋 변경사항

```
Modified:
  films_embedded.json        # sync로 trailing newline 통일
  index.html                 # @username → @recommender
  package.json               # sync:films, prebuild 스크립트 추가
  public/films_embedded.json # sync로 trailing newline 통일
  src/main.js                # 로컬 변수 리네임, URL 파라미터 로직
  src/scene.js               # 내부 상태 리네임
  src/ui.js                  # 모듈 스코프 변수, 내부 함수 파라미터 리네임
  style.css                  # .user-name → .recommender-name

New:
  docs/DATA-SOURCES.md       # 데이터 소스 문서
  public/README.md           # 편집 금지 안내
  scripts/sync-films.mjs     # 동기 스크립트
```

## 프로젝트 구조

```
Dev/Trace/
├── backend/
│   ├── server.js          # Express API (health, reviews CRUD, comments, status, films)
│   ├── logger.js          # pino 로거
│   └── package.json
├── db/init/
│   ├── 01-schema.sql      # users 테이블 (미사용 — Phase 4에서 DROP 예정)
│   ├── 02-add-recommender-fields.sql
│   ├── 03-reviews-comments.sql
│   └── 04-add-status.sql
├── docs/
│   ├── DATA-SOURCES.md    # ★ 데이터 소스 문서 (이번 세션 생성)
│   ├── NEXT-SESSION.md
│   └── plans/
├── scripts/
│   └── sync-films.mjs     # ★ 영화 데이터 동기 스크립트 (이번 세션 생성)
├── src/
│   ├── main.js
│   ├── data.js
│   ├── scene.js
│   └── ui.js
├── public/
│   ├── films_embedded.json # 파생 복사본 (직접 편집 금지)
│   └── README.md           # ★ 편집 금지 안내 (이번 세션 생성)
├── films_embedded.json     # ★ CANONICAL SOURCE
├── docker-compose.yml
├── index.html
├── style.css
└── vite.config.js
```

## 실행 방법

```bash
cd /Users/jungeunkim/Dev/Trace
docker compose up -d        # DB(5433) + Backend(3001)
npm run dev                 # Frontend (Vite, 5174)
```

## DB 현재 스키마

- **users**: id, identifier, created_at — **미사용**, Phase 4에서 DROP 예정
- **reviews**: id, film_title_en (UNIQUE), content (nullable), status, created_at, updated_at
- **comments**: id, review_id (FK), author_thread_id, body, created_at

## 도메인 모델 (현재 진실)

| 엔티티 | 저장 위치 | 설명 |
|--------|----------|------|
| Film | `films_embedded.json` (정적) | 106편, 임베딩 좌표 포함 |
| Recommender | `films_embedded.json`의 `recommender` 필드 | Threads handle, ~40명 |
| Reflection | DB `reviews` 테이블 | 나의 감상평 + 시청 상태 |
| Comment | DB `comments` 테이블 | 추천자 댓글 |
| Admin | `.env` ADMIN_PASSWORD_HASH | 감상평 쓰기 권한 |

## 다음 세션 작업 순서

### Phase 3: Export 함수/인터페이스 리네임
- `setUserFilmIndices` → `setRecommenderFilmIndices` (ui.js export + main.js import)
- `buildConstellation(films, highlightUser, userFilmIndices)` → 파라미터명 변경 (scene.js)
- 런타임 변경 없음, 인터페이스만 정리

### Phase 4: 백엔드/DB 정리 (선택)
- `users` 테이블 DROP (`db/init/05-drop-unused-users.sql`)
- `seed-one-user` 엔드포인트 제거
- `schema-check`에서 `'users'` 제거
- `NEXT-SESSION.md` Phase 3 계획 재작성 (더 이상 "User 프로필" 아님)

### 그 이후 (미정)
- 추천자 프로필 페이지 (이전 Phase 3 Task 3-4를 도메인 모델에 맞게 재설계)
- "먼저 쓰고 그 다음에 본다" 흐름 (이전 Phase 3 Task 3-3)

## 핵심 규칙

- **Big-bang 마이그레이션 금지** — 한 Phase씩 순차 실행
- **Phase 승인 후 다음 Phase 진행** — 독단적 진행 금지
- **"user" = recommender 혼동 주의** — 아직 export 함수명에 `User` 남아있음
- `films_embedded.json` 수정 후 반드시 `npm run sync:films` 실행
- `public/films_embedded.json` 직접 편집 금지
- `ADMIN_PASSWORD_HASH`는 `.env`에만 — 절대 코드/커밋에 포함 금지

## 주의사항

- Docker 볼륨 리셋 시: `docker compose down -v && docker compose up -d`
- 기존 볼륨이 있으면 init SQL이 자동 실행되지 않음 → 수동 ALTER 필요
- Python 3.14에서 google-genai 안 됨 → 반드시 3.12 사용
- `npm run build` 시 `prebuild` 훅이 자동으로 `sync-films.mjs` 실행
