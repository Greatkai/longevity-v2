import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    // 输入校验
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少 6 位" },
        { status: 400 }
      );
    }

    // 邮箱查重
    if (await findUserByEmail(email)) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
    }

    const user = await createUser(email, password, name || email.split("@")[0], "user");
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (e) {
    console.error("注册失败:", (e as Error).message || e);
    const msg = (e as Error).message || "";
    // 将数据库连接错误返回给前端，便于诊断
    const detail = msg.includes("connect") || msg.includes("ECONNREFUSED")
      ? "数据库连接失败，请检查配置"
      : msg.includes("password") || msg.includes("authenticat")
      ? "数据库密码错误"
      : msg.includes("SSL") || msg.includes("ssl")
      ? "数据库 SSL 配置错误"
      : "注册失败，请稍后重试";
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
