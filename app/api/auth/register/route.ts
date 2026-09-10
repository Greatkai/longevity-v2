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
    const err = e as Error & { code?: string; detail?: string };
    console.error("注册失败:", err.message || err, err.code || "");
    const msg = `${err.message || ""} ${err.detail || ""}`;
    // 将数据库错误归类返回，并附带原始信息便于诊断
    let detail: string;
    if (err.code === "42P01" || msg.includes("does not exist")) {
      detail = "数据库表尚未创建，请在 Supabase 执行 schema.sql 初始化脚本";
    } else if (err.code === "23505" || msg.includes("duplicate key")) {
      detail = "该邮箱已被注册";
    } else if (msg.includes("connect") || msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT")) {
      detail = "数据库连接失败，请检查连接串配置";
    } else if (msg.includes("password") || msg.includes("authenticat")) {
      detail = "数据库密码错误，请检查 DATABASE_URL";
    } else if (msg.includes("SSL") || msg.includes("ssl")) {
      detail = "数据库 SSL 配置错误，请设置 DATABASE_SSL=true";
    } else if (msg.includes("getaddrinfo") || msg.includes("ENOTFOUND")) {
      detail = "数据库主机名无法解析，请检查连接串";
    } else {
      detail = "注册失败，请稍后重试";
    }
    return NextResponse.json(
      { error: detail, hint: msg.trim().slice(0, 160) || undefined },
      { status: 500 }
    );
  }
}
