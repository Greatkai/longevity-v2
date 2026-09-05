import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listReportsByUser, saveReport } from "@/lib/db";
import { generateReportCode } from "@/lib/chli-model";

export const runtime = "nodejs";

/** 保存报告 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { chliScore, level, payload } = body;
    if (typeof chliScore !== "number" || !level || !payload) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }
    // 报告编码：payload 中有则用，否则兜底生成
    let reportCode = String(payload?.reportCode || "").trim();
    if (!reportCode) {
      reportCode = generateReportCode();
    }
    // 回写编码到 payload，保证前端可读取
    const fullPayload = { ...payload, reportCode };
    const report = await saveReport(user.id, chliScore, String(level), fullPayload, reportCode);
    return NextResponse.json({ report });
  } catch (e) {
    console.error("保存报告失败:", e);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

/** 获取当前用户的报告列表 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const reports = await listReportsByUser(user.id);
  return NextResponse.json({
    reports: reports.map((r) => ({
      id: r.id,
      chliScore: r.chli_score,
      level: r.level,
      createdAt: r.created_at,
      reportCode: r.report_code || "",
    })),
  });
}
