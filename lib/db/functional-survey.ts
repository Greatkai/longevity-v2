import { pool } from "./index";
import type { FMAnswers, FMScoreResult } from "@/lib/functional-survey/types";

/**
 * 功能医学问卷数据层
 * 表：functional_survey_responses（见 schema-fm-upgrade.sql）
 */

export interface FMSurveyResponseRow {
  id: number;
  user_id: number | null;
  phone: string | null;
  name: string | null;
  report_code: string | null;
  answers: string | FMAnswers;
  scores: string | FMScoreResult;
  prev_response_id: number | null;
  created_at: string;
}

/** 提交评分结果的存储结构 */
export interface FMScoreSnapshot {
  imbalances: FMScoreResult;
  mainProblems: string[];
  createdAt: string;
}

/** 保存问卷提交（评分结果作为快照存入 scores） */
export async function saveFMSurveyResponse(params: {
  userId: number | null;
  phone: string | null;
  name: string | null;
  reportCode: string | null;
  answers: FMAnswers;
  scores: FMScoreSnapshot;
  prevResponseId: number | null;
}): Promise<FMSurveyResponseRow> {
  const { rows } = await pool.query(
    `INSERT INTO functional_survey_responses
       (user_id, phone, name, report_code, answers, scores, prev_response_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      params.userId,
      params.phone,
      params.name,
      params.reportCode,
      JSON.stringify(params.answers),
      JSON.stringify(params.scores),
      params.prevResponseId,
    ]
  );
  return rows[0] as FMSurveyResponseRow;
}

/** 按手机号查最近一次提交（复测对比用） */
export async function getLatestFMSurveyByPhone(
  phone: string
): Promise<FMSurveyResponseRow | undefined> {
  const { rows } = await pool.query(
    `SELECT * FROM functional_survey_responses
     WHERE phone = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone]
  );
  return rows[0] as FMSurveyResponseRow | undefined;
}

/** 按登录用户查最近一次提交 */
export async function getLatestFMSurveyByUser(
  userId: number
): Promise<FMSurveyResponseRow | undefined> {
  const { rows } = await pool.query(
    `SELECT * FROM functional_survey_responses
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] as FMSurveyResponseRow | undefined;
}

/** 按用户/手机号查全部历史（时间正序，供趋势展示） */
export async function listFMSurveyHistory(params: {
  userId?: number;
  phone?: string;
}): Promise<FMSurveyResponseRow[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (params.userId) {
    conditions.push(`user_id = $${values.length + 1}`);
    values.push(params.userId);
  }
  if (params.phone) {
    conditions.push(`phone = $${values.length + 1}`);
    values.push(params.phone);
  }
  if (conditions.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT * FROM functional_survey_responses
     WHERE ${conditions.join(" OR ")}
     ORDER BY created_at ASC`,
    values
  );
  return rows as FMSurveyResponseRow[];
}

/** 管理端：全部提交列表（不含 answers 大字段） */
export async function listAllFMSurveys(limit = 100): Promise<
  {
    id: number;
    userId: number | null;
    name: string | null;
    phone: string | null;
    reportCode: string | null;
    userName: string | null;
    userEmail: string | null;
    prevResponseId: number | null;
    createdAt: string;
  }[]
> {
  const { rows } = await pool.query(
    `SELECT f.id, f.user_id as "userId", f.name, f.phone,
            f.report_code as "reportCode", f.prev_response_id as "prevResponseId",
            f.created_at as "createdAt",
            u.name as "userName", u.email as "userEmail"
     FROM functional_survey_responses f
     LEFT JOIN users u ON u.id = f.user_id
     ORDER BY f.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows as {
    id: number;
    userId: number | null;
    name: string | null;
    phone: string | null;
    reportCode: string | null;
    userName: string | null;
    userEmail: string | null;
    prevResponseId: number | null;
    createdAt: string;
  }[];
}

/** 管理端：单条提交详情 */
export async function getFMSurveyById(
  id: number
): Promise<FMSurveyResponseRow | undefined> {
  const { rows } = await pool.query(
    "SELECT * FROM functional_survey_responses WHERE id = $1",
    [id]
  );
  return rows[0] as FMSurveyResponseRow | undefined;
}
