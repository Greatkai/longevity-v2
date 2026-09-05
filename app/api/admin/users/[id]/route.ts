import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  updateUserStatus,
  updateUserRole,
  deleteUser,
  findUserById,
} from "@/lib/db";

export const runtime = "nodejs";

interface Params {
  params: { id: string };
}

/** 管理员：更新用户状态/角色 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const id = Number(params.id);
  const target = await findUserById(id);
  if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  // 不能操作自己
  if (target.id === admin.id) {
    return NextResponse.json({ error: "不能修改自己的状态" }, { status: 400 });
  }

  const body = await req.json();
  if (typeof body.status === "string") {
    await updateUserStatus(id, body.status);
  }
  if (typeof body.role === "string") {
    await updateUserRole(id, body.role);
  }
  return NextResponse.json({ success: true });
}

/** 管理员：删除用户 */
export async function DELETE(_req: Request, { params }: Params) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const id = Number(params.id);
  const target = await findUserById(id);
  if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  if (target.id === admin.id) {
    return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
  }
  await deleteUser(id);
  return NextResponse.json({ success: true });
}
