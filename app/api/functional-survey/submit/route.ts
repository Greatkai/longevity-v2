import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  computeImbalances,
  buildMainProblems,
  computeDiff,
} from "@/lib/functional-survey/scoring";
import type { FMAnswers, FMDiff } from "@/lib/functional-survey/types";
import {
  saveFMSurveyResponse,
  getLatestFMSurveyByUser,
  getLatestFMSurveyByPhone,
} from "@/lib/db/functional-survey";
import type { FMSurveyResponseRow } from "@/lib/db/functional-survey";

export const runtime = "nodejs";

/** 解析行中的 answers JSONB */
function parseAnswers(row: FMSurveyResponseRow): FMAnswers {
  try {
    const v = typeof row.answers === "string" ? JSON.parse(row.answers) : row.answers;
    return (v ?? {}) as FMAnswers;
  } catch {
    return {};
  }
}

/**
 * 提交功能医学问卷
 * - 游客可提交；登录用户自动关联 user_id
 * - 按登录用户或手机号匹配最近一次提交作为复测基线，服务端计算 diff
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const answers = (body.answers ?? {}) as FMAnswers;
    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: "问卷答案为空" }, { status: 400 });
    }
    const name = body.name ? String(body.name).slice(0, 50) : null;
    const phone = body.phone ? String(body.phone).slice(0, 20) : null;
    const reportCode = body.reportCode ? String(body.reportCode).slice(0, 30) : null;

    const user = await getCurrentUser();

    // 评分
    const imbalances = computeImbalances(answers);
    const mainProblems = buildMainProblems(answers);

    // 复测基线：优先按登录用户，其次按手机号
    let prev: FMSurveyResponseRow | undefined;
    if (user) prev = await getLatestFMSurveyByUser(user.id);
    if (!prev && phone) prev = await getLatestFMSurveyByPhone(phone);

    let diff: FMDiff | null = null;
    if (prev) {
      diff = computeDiff({ answers: parseAnswers(prev) }, { answers });
    }

    // 存储
    const row = await saveFMSurveyResponse({
      userId: user?.id ?? null,
      phone,
      name,
      reportCode,
      answers,
      scores: {
        imbalances,
        mainProblems: mainProblems.lines,
        createdAt: new Date().toISOString(),
      },
      prevResponseId: prev?.id ?? null,
    });

    return NextResponse.json({
      id: row.id,
      createdAt: row.created_at,
      isRetest: !!prev,
      prevResponseId: prev?.id ?? null,
      imbalances,
      mainProblems: mainProblems.lines,
      diff,
    });
  } catch (e) {
    console.error("问卷提交失败:", e);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
