/**
 * 로컬 개발용 Express 서버
 * DB(PostgreSQL) 연결 예시 포함
 */
import express from 'express';
import pg from 'pg';

const app = express();
const port = process.env.PORT || 3000;

// 로컬 프론트엔드(Vite)에서 API 호출 허용
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5174');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// DB 연결 (선택: 나중에 API 만들 때 사용)
const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;

app.use(express.json());

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'trace-backend' });
});

// Spec.me: DB client confirms schema is present (tables exist)
app.get('/api/schema-check', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ ok: false, error: 'DB not configured' });
  }
  try {
    const { rows } = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('users', 'reviews', 'comments')
      ORDER BY table_name
    `);
    const tables = rows.map((r) => r.table_name);
    const ok = tables.length === 3;
    res.json({ ok, tables });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Spec.me: insert one User row for validation; returns the row
app.post('/api/dev/seed-one-user', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'DB not configured' });
  }
  try {
    const identifier = req.body?.identifier ?? `dev-${Date.now()}@trace.local`;
    const { rows } = await pool.query(
      'INSERT INTO users (identifier) VALUES ($1) RETURNING id, identifier, created_at',
      [identifier]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening on http://0.0.0.0:${port}`);
});
