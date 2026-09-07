import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getSurveyDraft,
  saveSurveyDraft,
  deleteSurveyDraft,
} from "@/lib/db/survey-draft";

export const runtime = "nodejs";

/** 读取当前用户的问卷草稿 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const row = await getSurveyDraft(user.id);
    return NextResponse.json({
      draft: row
        ? {
            payload: typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload,
            step: row.step,
            updatedAt: row.updated_at,
          }
        : null,
    });
  } catch (e) {
    console.error("读取草稿失败:", e);
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
}

/** 保存/覆盖当前用户的问卷草稿 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const body = await req.json();
    await saveSurveyDraft(user.id, body.payload ?? {}, Number(body.step) || 0);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("保存草稿失败:", e);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

/** 删除当前用户的问卷草稿 */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    await deleteSurveyDraft(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("删除草稿失败:", e);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
