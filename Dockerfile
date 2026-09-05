# ============================================================
# 百岁白皮书 · 中国百岁健康标准指数评估网站
# Docker 多阶段构建
# better-sqlite3 为原生模块，需在构建阶段编译，故用 alpine 基础镜像
# ============================================================

# ---- 依赖安装阶段 ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# 安装所有依赖（含开发依赖，以便编译原生模块）
RUN npm install

# ---- 构建阶段 ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 构建项目
RUN npm run build

# ---- 生产运行阶段 ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# 复制 standalone 输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 数据卷（持久化 SQLite）
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
VOLUME ["/app/data"]

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
