import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getReportByCode } from "@/lib/db";

export const runtime = "nodejs";

/** 健康管理师：按报告编码搜索客户报告 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "health_coach" && user.role !== "admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const code = String(body.code || "").trim();
    if (!code) {
      return NextResponse.json({ error: "请输入报告编码" }, { status: 400 });
    }
    const report = await getReportByCode(code);
    if (!report) {
      return NextResponse.json({ error: "未找到该编码对应的报告" }, { status: 404 });
    }
    // 解析 payload
    let result = null;
    try {
      result = JSON.parse(report.payload);
    } catch {
      // ignore
    }
    return NextResponse.json({
      report: {
        id: report.id,
        reportCode: report.report_code,
        chliScore: report.chli_score,
        level: report.level,
        createdAt: report.created_at,
        userName: report.userName,
        userEmail: report.userEmail,
        coachInterpretation: report.coach_interpretation,
        result,
      },
    });
  } catch (e) {
    console.error("搜索报告失败:", e);
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}
