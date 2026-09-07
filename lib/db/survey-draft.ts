import { pool } from "./index";

/**
 * 问卷暂存（草稿）数据层
 * 每个登录用户一份草稿，重复保存即覆盖（upsert）。
 */

export interface SurveyDraftRow {
  user_id: number;
  payload: string | Record<string, unknown>;
  step: number;
  updated_at: string;
}

/** 读取用户草稿 */
export async function getSurveyDraft(userId: number): Promise<SurveyDraftRow | undefined> {
  const { rows } = await pool.query(
    "SELECT * FROM survey_drafts WHERE user_id = $1",
    [userId]
  );
  return rows[0] as SurveyDraftRow | undefined;
}

/** 保存/覆盖用户草稿 */
export async function saveSurveyDraft(
  userId: number,
  payload: unknown,
  step: number
): Promise<void> {
  await pool.query(
    `INSERT INTO survey_drafts (user_id, payload, step, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id)
     DO UPDATE SET payload = EXCLUDED.payload, step = EXCLUDED.step, updated_at = now()`,
    [userId, JSON.stringify(payload), step]
  );
}

/** 删除用户草稿（续填完成或放弃时） */
export async function deleteSurveyDraft(userId: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM survey_drafts WHERE user_id = $1",
    [userId]
  );
  return (rowCount ?? 0) > 0;
}
