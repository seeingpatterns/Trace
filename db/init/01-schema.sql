-- Spec.me: users, articles, comments (Phase 1 minimal)
-- Run on first container start via docker-entrypoint-initdb.d

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            VARCHAR(500),
  body             TEXT,
  source_thread_id VARCHAR(255),  -- 추천인 쓰레드 아이디 (이 사람이 추천해줘서 봤음)
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 추천인 쓰레드별 "이 사람이 추천한 영화" 목록 조회용
CREATE TABLE IF NOT EXISTS recommendations (
  id                   SERIAL PRIMARY KEY,
  recommender_thread_id VARCHAR(255) NOT NULL,  -- 추천인 고유 쓰레드 아이디
  film_id              VARCHAR(100)  NOT NULL,    -- 영화 식별자 (외부 ID 등)
  user_id              INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 추천 받은 사람(나)
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  article_id INTEGER      NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
