import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listFMSurveyHistory } from "@/lib/db/functional-survey";

export const runtime = "nodejs";

/**
 * 问卷历史记录
 * - 登录用户：返回自己的历史
 * - 健康管理师/管理员：可通过 ?phone= 查询任意客户历史
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const isManager = user.role === "admin" || user.role === "health_coach";
    const phone = req.nextUrl.searchParams.get("phone");

    if (isManager && phone) {
      const rows = await listFMSurveyHistory({ phone });
      return NextResponse.json({ records: rows });
    }

    const rows = await listFMSurveyHistory({ userId: user.id });
    return NextResponse.json({ records: rows });
  } catch (e) {
    console.error("查询问卷历史失败:", e);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
