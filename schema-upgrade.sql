-- ============================================================
-- 健康管理师人工解读功能 - 数据库升级脚本
-- 在 Supabase SQL Editor 中执行本脚本
-- ============================================================

-- 1. reports 表新增报告唯一编码（用于健康管理师检索）
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_code TEXT;

-- 2. reports 表新增健康管理师人工解读字段（Markdown）
ALTER TABLE reports ADD COLUMN IF NOT EXISTS coach_interpretation TEXT;

-- 3. 为 report_code 建立唯一索引（加速按编码检索）
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_code ON reports(report_code);

-- 4. 为历史报告回填编码（仅对尚无编码的报告生成）
UPDATE reports
SET report_code = 'CHLI-' || to_char(created_at, 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6))
WHERE report_code IS NULL OR report_code = '';
