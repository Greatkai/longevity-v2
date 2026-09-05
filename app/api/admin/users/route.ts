import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listAllUsers,
  getStats,
  getReportTrend,
  getUserTrend,
  getScoreDistribution,
  getLevelDistribution,
  getDimensionAverages,
  listRecentReports,
  ensureAdmin,
} from "@/lib/db";

export const runtime = "nodejs";

/** 管理员：获取用户列表与统计 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  await ensureAdmin();
  const users = (await listAllUsers()).map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
  }));
  return NextResponse.json({
    users,
    stats: await getStats(),
    trend: {
      reports: await getReportTrend(30),
      users: await getUserTrend(30),
    },
    scoreDistribution: await getScoreDistribution(),
    levelDistribution: await getLevelDistribution(),
    dimensionAverages: await getDimensionAverages(),
    recentReports: await listRecentReports(10),
  });
}
