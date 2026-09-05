-- ============================================================
-- 功能医学问卷 - 数据库升级脚本
-- 在 Supabase SQL Editor 中执行本脚本
-- ============================================================

-- 功能医学问卷提交记录表
CREATE TABLE IF NOT EXISTS functional_survey_responses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  -- 手机号用于识别老客户（复测对比）
  phone TEXT,
  name TEXT,
  -- 关联的 CHLI 报告编码（可空，问卷可独立填写）
  report_code TEXT,
  -- 全部答案（qid -> 值）
  answers JSONB NOT NULL,
  -- 评分结果快照（stage1/selection/stage2/combined/ranked/mainProblems）
  scores JSONB NOT NULL,
  -- 复测时关联的上一次提交 id
  prev_response_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_fm_responses_user ON functional_survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_fm_responses_phone ON functional_survey_responses(phone);
CREATE INDEX IF NOT EXISTS idx_fm_responses_created ON functional_survey_responses(created_at);
