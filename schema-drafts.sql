-- ============================================================
-- 问卷暂存（草稿）- 数据库升级脚本
-- 在 Supabase SQL Editor 中执行本脚本
-- ============================================================

-- 每个用户一份暂存（user_id 主键，重复保存即覆盖）
CREATE TABLE IF NOT EXISTS survey_drafts (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  -- 暂存内容：{ config, chli_data, fm_answers, fm_stage1 }
  payload JSONB NOT NULL,
  -- 暂存时所在的步骤索引
  step INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
