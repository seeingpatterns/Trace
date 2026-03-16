-- 이미 DB가 떠 있는 경우 수동 실행용 (DBeaver 등에서 이 파일 실행)
-- 새로 docker compose up 하는 경우엔 01-schema.sql에 이미 포함됨

ALTER TABLE articles ADD COLUMN IF NOT EXISTS source_thread_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS recommendations (
  id                   SERIAL PRIMARY KEY,
  recommender_thread_id VARCHAR(255) NOT NULL,
  film_id              VARCHAR(100)  NOT NULL,
  user_id              INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);
