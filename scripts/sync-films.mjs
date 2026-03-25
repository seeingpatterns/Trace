/**
 * sync-films.mjs
 *
 * Copies the canonical films_embedded.json (project root) to public/films_embedded.json.
 * Validates the source file before writing.
 *
 * Usage:
 *   node scripts/sync-films.mjs          # sync root → public
 *   npm run sync:films                   # same via package.json
 *
 * Runs automatically before builds via the "prebuild" hook.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SOURCE = resolve(ROOT, 'films_embedded.json');
const TARGET = resolve(ROOT, 'public', 'films_embedded.json');

const REQUIRED_FIELDS = ['title', 'title_en', 'year', 'director', 'recommender', 'note', 'description', 'x', 'y', 'cluster'];

// --- Validation ---

function fail(message) {
  console.error(`\n[sync-films] ERROR: ${message}\n`);
  process.exit(1);
}

// 1. Source file exists
if (!existsSync(SOURCE)) {
  fail(`Canonical source not found: ${SOURCE}`);
}

// 2. Valid JSON
let data;
try {
  const raw = readFileSync(SOURCE, 'utf-8');
  data = JSON.parse(raw);
} catch (e) {
  fail(`Invalid JSON in ${SOURCE}: ${e.message}`);
}

// 3. Top-level shape: must be a non-empty array
if (!Array.isArray(data)) {
  fail(`Expected top-level array, got ${typeof data}`);
}

if (data.length === 0) {
  fail('Film array is empty');
}

// 4. Each film has required fields (check first 3 + last as sample)
const sampled = [data[0], data[1], data[2], data[data.length - 1]].filter(Boolean);

for (const film of sampled) {
  const missing = REQUIRED_FIELDS.filter(f => !(f in film));
  if (missing.length > 0) {
    fail(`Film "${film.title_en || film.title || '(unknown)'}" missing fields: ${missing.join(', ')}`);
  }

  if (typeof film.x !== 'number' || typeof film.y !== 'number') {
    fail(`Film "${film.title_en}" has non-numeric coordinates (x: ${typeof film.x}, y: ${typeof film.y})`);
  }

  if (typeof film.cluster !== 'number') {
    fail(`Film "${film.title_en}" has non-numeric cluster: ${typeof film.cluster}`);
  }
}

// --- Sync ---

// 5. Check if target directory exists
const targetDir = resolve(ROOT, 'public');
if (!existsSync(targetDir)) {
  fail(`Target directory not found: ${targetDir}`);
}

// 6. Read source raw (preserve formatting) and write
const sourceRaw = readFileSync(SOURCE, 'utf-8');
writeFileSync(TARGET, sourceRaw, 'utf-8');

console.log(`[sync-films] OK: ${SOURCE} → ${TARGET} (${data.length} films)`);
