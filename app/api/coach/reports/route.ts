import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listCoachClients, listCoachReports } from "@/lib/db";

export const runtime = "nodejs";

/**
 * 健康管理师：客户与报告总览
 * GET /api/coach/reports?q=张三|CHLI-250805-XXXXXX
 * q 为空时返回全部客户与报告；非空时按姓名 / 邮箱 / 报告编码模糊匹配。
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "health_coach" && user.role !== "admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const [clients, reports] = await Promise.all([
      listCoachClients(q),
      listCoachReports(q),
    ]);
    return NextResponse.json({ clients, reports });
  } catch (e) {
    console.error("查询客户/报告列表失败:", e);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
