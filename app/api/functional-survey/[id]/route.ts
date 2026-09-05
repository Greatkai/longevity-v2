import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getFMSurveyById } from "@/lib/db/functional-survey";
import { computeDiff } from "@/lib/functional-survey/scoring";
import type { FMAnswers } from "@/lib/functional-survey/types";

export const runtime = "nodejs";

function parseJsonField<T>(v: unknown, fallback: T): T {
  try {
    if (typeof v === "string") return JSON.parse(v) as T;
    return (v as T) ?? fallback;
  } catch {
    return fallback;
  }
}

/** 管理端：单条问卷提交详情（含复测对比） */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "无效的 id" }, { status: 400 });
    }
    const row = await getFMSurveyById(id);
    if (!row) {
      return NextResponse.json({ error: "未找到该记录" }, { status: 404 });
    }
    // 权限：管理员/健康管理师可看全部；普通用户只能看自己的
    const isManager = user.role === "admin" || user.role === "health_coach";
    if (!isManager && row.user_id !== user.id) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const answers = parseJsonField<FMAnswers>(row.answers, {});
    const scores = parseJsonField(row.scores, null);

    // 若为复测，重新计算逐题 diff
    let diff = null;
    if (row.prev_response_id) {
      const prevRow = await getFMSurveyById(row.prev_response_id);
      if (prevRow) {
        diff = computeDiff(
          { answers: parseJsonField<FMAnswers>(prevRow.answers, {}) },
          { answers }
        );
      }
    }

    return NextResponse.json({
      record: {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        phone: row.phone,
        reportCode: row.report_code,
        prevResponseId: row.prev_response_id,
        createdAt: row.created_at,
        answers,
        scores,
        diff,
      },
    });
  } catch (e) {
    console.error("查询问卷详情失败:", e);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
