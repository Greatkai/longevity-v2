import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { saveCoachInterpretation, getReportByCode } from "@/lib/db";

export const runtime = "nodejs";

/** 获取某报告的人工解读（客户查看，用 reportCode 作为访问凭证） */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  if (!code) {
    return NextResponse.json({ error: "缺少报告编码" }, { status: 400 });
  }
  const report = await getReportByCode(code);
  if (!report) {
    return NextResponse.json({ error: "未找到报告" }, { status: 404 });
  }
  return NextResponse.json({
    reportCode: report.report_code,
    coachInterpretation: report.coach_interpretation,
    coachName: report.userName,
  });
}

/** 健康管理师：保存/更新人工解读（Markdown） */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "health_coach" && user.role !== "admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const code = String(body.code || "").trim();
    const markdown = String(body.markdown || "");
    if (!code) {
      return NextResponse.json({ error: "请输入报告编码" }, { status: 400 });
    }
    if (!markdown) {
      return NextResponse.json({ error: "解读内容不能为空" }, { status: 400 });
    }
    const ok = await saveCoachInterpretation(code, markdown);
    if (!ok) {
      return NextResponse.json({ error: "未找到该编码对应的报告" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("保存解读失败:", e);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
