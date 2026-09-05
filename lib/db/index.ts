import { Pool } from "pg";
import bcrypt from "bcryptjs";

/**
 * PostgreSQL 数据层
 * 部署于 Vercel / Supabase 等 serverless 环境，使用连接池。
 * 连接串通过环境变量 DATABASE_URL 提供（如 Supabase 的 Postgres 连接串）。
 */

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/chi_longevity";

// 全局单例连接池（serverless 冷启动复用）
const globalForPg = globalThis as unknown as { __chiPgPool?: Pool };

// Supabase（以及大多数云数据库）要求 SSL。
// 若连接串包含 supabase.co 或显式开启 DATABASE_SSL，则启用 SSL。
const useSsl =
  process.env.DATABASE_SSL === "true" ||
  connectionString.includes("supabase.co");

export const pool =
  globalForPg.__chiPgPool ??
  new Pool({
    connectionString,
    max: Number(process.env.PGPOOL_MAX || 5),
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.__chiPgPool = pool;
}

export const db = pool;

/* ------------------------- 类型 ------------------------- */

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: "user" | "admin" | "health_coach";
  status: "active" | "disabled";
  created_at: string;
  last_login_at: string | null;
}

export interface ReportRow {
  id: number;
  user_id: number;
  chli_score: number;
  level: string;
  payload: string;
  /** 报告唯一编码 */
  report_code: string;
  /** 健康管理师人工解读（Markdown） */
  coach_interpretation: string | null;
  created_at: string;
}

/* ------------------------- 用户操作 ------------------------- */

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  return rows[0] as UserRow | undefined;
}

export async function findUserById(id: number): Promise<UserRow | undefined> {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] as UserRow | undefined;
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: "user" | "admin" | "health_coach" = "user"
): Promise<UserRow> {
  const passwordHash = bcrypt.hashSync(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email.toLowerCase(), passwordHash, name, role]
  );
  return rows[0] as UserRow;
}

export function verifyPassword(user: UserRow, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

export async function updateLastLogin(userId: number): Promise<void> {
  await pool.query("UPDATE users SET last_login_at = now() WHERE id = $1", [userId]);
}

/** 初始化管理员账号（幂等） */
export async function ensureAdmin(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || "admin@chi.cn").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const existing = await findUserByEmail(email);
  if (!existing) {
    await createUser(email, password, "系统管理员", "admin");
  }
}

/* ------------------------- 报告操作 ------------------------- */

export async function saveReport(
  userId: number,
  chliScore: number,
  level: string,
  payload: unknown,
  reportCode: string
): Promise<ReportRow> {
  // 使用 report_code 做 upsert：已存在则更新，避免重复保存产生多条记录
  const { rows } = await pool.query(
    `INSERT INTO reports (user_id, chli_score, level, payload, report_code)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (report_code)
     DO UPDATE SET
       user_id = EXCLUDED.user_id,
       chli_score = EXCLUDED.chli_score,
       level = EXCLUDED.level,
       payload = EXCLUDED.payload
     RETURNING *`,
    [userId, chliScore, level, JSON.stringify(payload), reportCode]
  );
  return rows[0] as ReportRow;
}

export async function getReportById(id: number): Promise<ReportRow | undefined> {
  const { rows } = await pool.query("SELECT * FROM reports WHERE id = $1", [id]);
  return rows[0] as ReportRow | undefined;
}

/** 通过报告编码查询报告（健康管理师用） */
export async function getReportByCode(code: string): Promise<
  | (ReportRow & { userName: string; userEmail: string })
  | undefined
> {
  const { rows } = await pool.query(
    `SELECT r.*, u.name as "userName", u.email as "userEmail"
     FROM reports r
     JOIN users u ON u.id = r.user_id
     WHERE LOWER(r.report_code) = LOWER($1)
     LIMIT 1`,
    [code]
  );
  return rows[0] as (ReportRow & { userName: string; userEmail: string }) | undefined;
}

/** 保存/更新健康管理师人工解读 */
export async function saveCoachInterpretation(
  code: string,
  markdown: string
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE reports SET coach_interpretation = $1
     WHERE LOWER(report_code) = LOWER($2)`,
    [markdown, code]
  );
  return (rowCount ?? 0) > 0;
}

export async function listReportsByUser(userId: number): Promise<ReportRow[]> {
  const { rows } = await pool.query(
    "SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return rows as ReportRow[];
}

export async function deleteReport(id: number, userId?: number): Promise<boolean> {
  const params = userId ? [id, userId] : [id];
  const whereClause = userId
    ? "DELETE FROM reports WHERE id = $1 AND user_id = $2"
    : "DELETE FROM reports WHERE id = $1";
  const { rowCount } = await pool.query(whereClause, params);
  return (rowCount ?? 0) > 0;
}

/* ------------------------- 管理员操作 ------------------------- */

export async function listAllUsers(): Promise<UserRow[]> {
  const { rows } = await pool.query(
    "SELECT * FROM users ORDER BY created_at DESC"
  );
  return rows as UserRow[];
}

export async function updateUserStatus(userId: number, status: string): Promise<boolean> {
  const { rowCount } = await pool.query("UPDATE users SET status = $1 WHERE id = $2", [
    status,
    userId,
  ]);
  return (rowCount ?? 0) > 0;
}

export async function updateUserRole(userId: number, role: string): Promise<boolean> {
  const { rowCount } = await pool.query("UPDATE users SET role = $1 WHERE id = $2", [
    role,
    userId,
  ]);
  return (rowCount ?? 0) > 0;
}

export async function deleteUser(userId: number): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  return (rowCount ?? 0) > 0;
}

/* ------------------------- 统计 ------------------------- */

export async function getStats(): Promise<{
  users: number;
  reports: number;
  activeUsers: number;
  admins: number;
}> {
  const [u, r, a, ad] = await Promise.all([
    pool.query("SELECT COUNT(*)::int as c FROM users"),
    pool.query("SELECT COUNT(*)::int as c FROM reports"),
    pool.query("SELECT COUNT(*)::int as c FROM users WHERE status = 'active'"),
    pool.query("SELECT COUNT(*)::int as c FROM users WHERE role = 'admin'"),
  ]);
  return {
    users: u.rows[0].c,
    reports: r.rows[0].c,
    activeUsers: a.rows[0].c,
    admins: ad.rows[0].c,
  };
}

/** 近 N 天每天的报告数量（用于趋势图） */
export async function getReportTrend(days = 30): Promise<{ date: string; count: number }[]> {
  const { rows } = await pool.query(
    `SELECT to_char(created_at, 'MM-DD') as date, COUNT(*)::int as count
     FROM reports
     WHERE created_at >= now() - ($1::int * interval '1 day')
     GROUP BY date
     ORDER BY date ASC`,
    [days]
  );
  return fillTrend(rows, days);
}

/** 近 N 天的用户注册趋势 */
export async function getUserTrend(days = 30): Promise<{ date: string; count: number }[]> {
  const { rows } = await pool.query(
    `SELECT to_char(created_at, 'MM-DD') as date, COUNT(*)::int as count
     FROM users
     WHERE created_at >= now() - ($1::int * interval '1 day')
     GROUP BY date
     ORDER BY date ASC`,
    [days]
  );
  return fillTrend(rows, days);
}

/** 补齐缺失日期，返回最近 N 天 */
function fillTrend(
  rows: { date: string; count: number }[],
  days: number
): { date: string; count: number }[] {
  const map = new Map(rows.map((r) => [r.date, r.count]));
  const out: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    out.push({ date: key, count: map.get(key) ?? 0 });
  }
  return out;
}

/** CHLI 得分分布（分数段 -> 报告数） */
export async function getScoreDistribution(): Promise<
  { range: string; count: number }[]
> {
  const { rows } = await pool.query(
    `SELECT
       CASE
         WHEN chli_score >= 0 AND chli_score < 40 THEN '0-40'
         WHEN chli_score >= 40 AND chli_score < 60 THEN '40-60'
         WHEN chli_score >= 60 AND chli_score < 75 THEN '60-75'
         WHEN chli_score >= 75 AND chli_score < 90 THEN '75-90'
         ELSE '90-100'
       END as range,
       COUNT(*)::int as count
     FROM reports
     GROUP BY range`
  );
  const order = ["0-40", "40-60", "60-75", "75-90", "90-100"];
  const map = new Map(rows.map((r) => [r.range, r.count]));
  return order.map((range) => ({ range, count: map.get(range) ?? 0 }));
}

/** 综合风险等级分布 */
export async function getLevelDistribution(): Promise<
  { level: string; count: number }[]
> {
  const { rows } = await pool.query(
    "SELECT level, COUNT(*)::int as count FROM reports GROUP BY level"
  );
  return rows as { level: string; count: number }[];
}

/** 六大维度平均得分（从报告 payload 聚合） */
export async function getDimensionAverages(): Promise<
  { name: string; avg: number }[]
> {
  const { rows } = await pool.query("SELECT payload FROM reports");
  const sums = new Map<string, { name: string; total: number; n: number }>();
  for (const row of rows) {
    try {
      const parsed = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
      const dims = parsed?.dimensions;
      if (Array.isArray(dims)) {
        for (const d of dims) {
          if (typeof d?.score === "number" && typeof d?.key === "string") {
            const cur = sums.get(d.key) ?? { name: d.name || d.key, total: 0, n: 0 };
            cur.total += d.score;
            cur.n += 1;
            sums.set(d.key, cur);
          }
        }
      }
    } catch {
      // 忽略解析失败的报告
    }
  }
  return Array.from(sums.values())
    .map((v) => ({ name: v.name, avg: v.n ? Math.round(v.total / v.n) : 0 }))
    .sort((a, b) => b.avg - a.avg);
}

/** 最近报告列表（含用户邮箱/姓名） */
export async function listRecentReports(limit = 10): Promise<
  {
    id: number;
    chliScore: number;
    level: string;
    createdAt: string;
    userEmail: string;
    userName: string;
  }[]
> {
  const { rows } = await pool.query(
    `SELECT r.id, r.chli_score, r.level, r.created_at,
            u.email as "userEmail", u.name as "userName"
     FROM reports r
     JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows as {
    id: number;
    chliScore: number;
    level: string;
    createdAt: string;
    userEmail: string;
    userName: string;
  }[];
}
