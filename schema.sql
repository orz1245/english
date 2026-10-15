-- Cloudflare D1 数据库初始化脚本 (schema.sql)
-- 本地初始化命令: npx wrangler d1 execute linguaforge-db --local --file=./schema.sql
-- 线上初始化命令: npx wrangler d1 execute linguaforge-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  ai_config_json TEXT NOT NULL DEFAULT '{}',
  progress_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS practice_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  module TEXT NOT NULL,          -- 'grammar' | 'translation' | 'ielts_listening' | 'ielts_reading' | 'ielts_writing' | 'ielts_speaking'
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  user_input TEXT NOT NULL,
  score REAL,
  feedback_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_practice_user_module ON practice_records(user_id, module, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_sentences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sentence TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_sentences_user ON saved_sentences(user_id, created_at DESC);
