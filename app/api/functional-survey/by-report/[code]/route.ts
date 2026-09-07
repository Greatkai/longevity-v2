import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLatestFMSurveyByReportCode } from "@/lib/db/functional-survey";

export const runtime = "nodejs";

function parseJsonField<T>(v: unknown, fallback: T): T {
  try {
    if (typeof v === "string") return JSON.parse(v) as T;
    return (v as T) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * 按报告编码获取问卷提交（下载问卷明细用）
 * 权限：本人 / 健康管理师 / 管理员
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const code = String(params.code || "").trim();
    if (!code) {
      return NextResponse.json({ error: "缺少报告编码" }, { status: 400 });
    }
    const row = await getLatestFMSurveyByReportCode(code);
    if (!row) {
      return NextResponse.json({ error: "未找到该报告关联的问卷" }, { status: 404 });
    }
    const isManager = user.role === "admin" || user.role === "health_coach";
    if (!isManager && row.user_id !== user.id) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    return NextResponse.json({
      record: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        reportCode: row.report_code,
        createdAt: row.created_at,
        answers: parseJsonField(row.answers, {}),
        scores: parseJsonField(row.scores, null),
      },
    });
  } catch (e) {
    console.error("查询问卷失败:", e);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
