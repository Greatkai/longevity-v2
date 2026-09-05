import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listAllFMSurveys } from "@/lib/db/functional-survey";

export const runtime = "nodejs";

/** 管理端：全部问卷提交列表（健康管理师/管理员） */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "health_coach")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  try {
    const records = await listAllFMSurveys(200);
    return NextResponse.json({ records });
  } catch (e) {
    console.error("查询问卷列表失败:", e);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
