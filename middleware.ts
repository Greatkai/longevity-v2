import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);
const COOKIE_NAME = "chi_session";

interface SessionPayload {
  userId: number;
  email: string;
  role: "user" | "admin" | "health_coach";
}

async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** 需要登录的路由（游客可评估，保存报告/看历史需登录） */
const PROTECTED = ["/history"];
/** 需要 admin 角色的路由 */
const ADMIN_ONLY = ["/admin"];
/** 需要 admin 或健康管理师角色的路由 */
const COACH_ONLY = ["/coach"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAdminOnly = ADMIN_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isCoachOnly = COACH_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isAdminOnly) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?next=/admin", req.url));
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } else if (isCoachOnly) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?next=/coach", req.url));
    }
    if (session.role !== "health_coach" && session.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } else if (isProtected) {
    if (!session) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/history",
    "/history/:path*",
    "/admin",
    "/admin/:path*",
    "/coach",
    "/coach/:path*",
  ],
};
