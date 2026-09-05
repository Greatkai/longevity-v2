import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getReportById, deleteReport } from "@/lib/db";

export const runtime = "nodejs";

interface Params {
  params: { id: string };
}

/** 获取报告详情（仅本人或管理员） */
export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "参数错误" }, { status: 400 });

  const report = await getReportById(id);
  if (!report) {
    return NextResponse.json({ error: "报告不存在" }, { status: 404 });
  }
  // 权限校验：仅本人或管理员
  if (report.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  return NextResponse.json({
    report: {
      id: report.id,
      chliScore: report.chli_score,
      level: report.level,
      createdAt: report.created_at,
      payload: JSON.parse(report.payload),
    },
  });
}

/** 删除报告 */
export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "参数错误" }, { status: 400 });

  const ok = await deleteReport(id, user.role === "admin" ? undefined : user.id);
  if (!ok) {
    return NextResponse.json({ error: "报告不存在或无权删除" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
