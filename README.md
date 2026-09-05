# 百岁白皮书 · 中国百岁健康标准指数（CHLI）评估网站

> **《2026 高质量健康长寿白皮书》**——21 世纪医学的目标不再只是延长寿命，而是延长健康寿命。未来医疗服务的核心，将从治疗疾病转变为管理健康风险，实现高质量健康长寿。
>
> 📖 **[阅读完整白皮书](https://txh5.binjiela.com.cn/baisui/index.html#p=1)**

基于「中国百岁健康标准指数（CHLI）」评估体系开发的长寿指数评估响应式网站。用户可通过结构化问卷或 AI 智能填写输入健康信息，系统自动按 CHLI 模型计算六大维度得分与综合长寿指数，生成包含可视化图表、风险等级、AI 智能解读与个性化建议、可导出（PDF + 手机分享长图）的长寿指数分析报告，并支持健康管理师人工解读。

## 项目背景

本项目**依据《2026 高质量健康长寿白皮书》**所倡导的健康长寿理念与「中国百岁健康标准指数（CHLI）」评估框架开发，将白皮书的理论体系落地为可交互的评估应用。**本项目为独立开发的技术实践，并非上述白皮书发布单位出品**。

白皮书相关信息（供参考）：
- **指导单位**：北京银发健康长寿研究院、上海交通大学医学遗传研究所
- **联合发布单位**：亚太长寿医学学会（APLMS）、平安健康互联网股份有限公司、中国抗衰老促进会
- **阅读地址**：[https://txh5.binjiela.com.cn/baisui/index.html#p=1](https://txh5.binjiela.com.cn/baisui/index.html#p=1)

百岁健康标准倡导：**从被动医疗转向主动健康优化范式**。本评估系统旨在帮助用户量化自身健康寿命，识别风险维度，并提供个性化改善路径。

## 核心功能

- **六大维度问卷评估**：生物年龄（B）、功能健康（F）、代谢慢病（M）、生活方式（L）、心理认知（P）、数字健康（D）
- **二级指标体系**：每个维度由 4-5 个二级指标构成（含检验数据维度），可按权重精准计算
- **检验检查可选**：问卷开始前可选填"我有哪些检验报告"，根据选择展示数据输入（无检验用估算替代）
- **AI 智能填写**：粘贴健康描述文本，自动提取并填充问卷
- **CHLI 综合评分**：`CHLI = 0.20×B + 0.20×F + 0.20×M + 0.15×L + 0.10×P + 0.15×D`
- **可视化报告**：综合指数环形图、六维雷达图、维度柱状图、风险等级卡片、生物年龄对比、详细计算逻辑（可展开二级指标评分规则）
- **AI 智能解读**：基于评分生成个性化风险解读与改善建议（AI 优先 + 规则兜底，含推荐完善检查）
- **报告导出**：PDF（A4 文档式排版 + 健康管理师总结）+ 手机分享长图（带二维码）
- **用户权限管理**：邮箱注册/登录（JWT）、普通用户/管理员/健康管理师三种角色、历史报告保存与查看
- **健康管理师人工解读**：健康管理师可通过报告编码检索客户报告，撰写 Markdown 人工解读，客户报告自动展示
- **报告唯一编码**：每份报告自动生成唯一编码 `CHLI-YYMMDD-XXXXXX`，方便健康管理与检索

## 技术栈

- **框架**：Next.js 14（App Router）+ TypeScript
- **样式**：Tailwind CSS + @tailwindcss/typography + Framer Motion，医疗蓝品牌风格
- **图表**：Recharts（雷达图/柱状图/环形图）+ Canvas 原生绘制
- **导出**：html-to-image + jsPDF + 原生 Canvas 绘制（手机分享长图）
- **认证与存储**：PostgreSQL（生产）/ SQLite（本地）+ bcryptjs + jose（JWT）
- **AI**：OpenAI 兼容接口（可选，未配置时使用规则兜底）
- **Markdown 渲染**：react-markdown（用于健康管理师人工解读展示）

## 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量并修改（**生产环境务必修改 JWT_SECRET、ADMIN_PASSWORD**）
cp .env.local.example .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

默认管理员账号（**首次部署后请立即修改**）：
- 邮箱：`admin@chi.cn`
- 密码：在 `.env.local` 的 `ADMIN_PASSWORD` 中设置

## 生产部署

### 方式一：Vercel + Supabase（推荐）

本项目支持部署到 Vercel，数据库使用 Supabase（PostgreSQL）。具体步骤：

1. 在 [Supabase](https://supabase.com) 创建项目
2. 在 Supabase SQL Editor 执行 `schema.sql` 建表，若需健康管理师解读功能再执行 `schema-upgrade.sql`
3. 在 Vercel 导入本仓库
4. 在 Vercel 项目配置环境变量：`DATABASE_URL`、`DATABASE_SSL=true`、`JWT_SECRET`、`ADMIN_EMAIL`、`ADMIN_PASSWORD`
5. Vercel 自动部署

### 方式二：Docker（自托管）

```bash
# 构建并启动
JWT_SECRET=$(openssl rand -hex 32) docker-compose up -d --build
```

### 方式三：直接运行 / 云主机

```bash
npm install
npm run build
npm start
```

## 环境变量

复制 `.env.local.example` 为 `.env.local` 并修改（**所有 `change-me` 与占位符必须替换**）：

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | JWT 签名密钥（**生产环境务必替换为 64+ 字符强随机字符串**） |
| `DATABASE_URL` | PostgreSQL 数据库连接串（Vercel+Supabase 部署必填） |
| `DATABASE_SSL` | 是否启用 SSL（Supabase 需设为 `true`） |
| `ADMIN_EMAIL` | 管理员初始邮箱 |
| `ADMIN_PASSWORD` | 管理员初始密码（**部署后立即修改**） |
| `OPENAI_API_KEY` | OpenAI 兼容接口密钥（可选；不配置使用规则兜底） |
| `OPENAI_BASE_URL` | OpenAI 接口地址（可选） |
| `OPENAI_MODEL` | AI 模型名称（可选） |

⚠️ **安全提示**：请勿将真实凭据提交到仓库。`.env.local` 已被 `.gitignore` 排除。

## 目录结构

```
chi-longevity-app/
├── app/                    # Next.js 路由（首页/问卷/报告/历史/登录/管理后台/工作台 + API）
│   ├── middleware.ts       # JWT 路由守卫与角色控制
│   └── api/                # auth/reports/admin/coach/extract/insights 接口
├── components/             # 布局、问卷、报告、认证、健管师工作台组件
├── lib/
│   ├── chli-model/         # CHLI 评分引擎（公式/二级指标/风险等级）
│   ├── db/                 # 数据库数据层（PostgreSQL/SQLite 兼容）
│   ├── auth/               # JWT 会话
│   ├── ai/                 # AI 提取与解读 + 规则兜底
│   └── export/             # 报告导出（PDF A4 + 手机分享长图）
├── store/                  # 认证与评估状态管理
└── public/                 # 静态资源
```

## 联系我们

- **邮箱**：bd-zhangkai976@pkucare.com
- **地址**：北京市丰台区丽泽平安金融中心 A 座 28F 北大医疗
- **白皮书阅读**：[https://txh5.binjiela.com.cn/baisui/index.html#p=1](https://txh5.binjiela.com.cn/baisui/index.html#p=1)

## 关于白皮书

本评估系统**依据**《2026 高质量健康长寿白皮书》开发，但**并非白皮书发布单位官方产品**。白皮书由以下单位发布，本项目仅为基于其理念的独立工程实践：

- **指导单位**：北京银发健康长寿研究院、上海交通大学医学遗传研究所
- **联合发布单位**：亚太长寿医学学会（APLMS）、平安健康互联网股份有限公司、中国抗衰老促进会

## 免责声明

本评估工具仅供健康管理参考，不构成医疗诊断建议。如有健康问题请及时就医。
