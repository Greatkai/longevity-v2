import Link from "next/link";
import {
  Dna,
  HeartPulse,
  Activity,
  UtensilsCrossed,
  Brain,
  LineChart,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ClipboardList,
  FileText,
  TrendingUp,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

const dimensions = [
  {
    icon: Dna,
    key: "B",
    title: "生物年龄",
    name: "生物学年龄指数",
    desc: "基于生物标志物测算生物年龄与实际年龄的差值，评估身体衰老速度与生命活力。",
    color: "from-brand-600 to-brand-400",
    bg: "bg-brand-50",
    iconColor: "text-brand-600",
  },
  {
    icon: HeartPulse,
    key: "F",
    title: "功能健康",
    name: "功能健康指数",
    desc: "评估躯体功能、认知功能、生活自理能力与运动能力，反映身体的日常运转质量。",
    color: "from-teal-500 to-emerald-400",
    bg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    icon: Activity,
    key: "M",
    title: "代谢慢病",
    name: "代谢与慢病风险指数",
    desc: "综合 BMI、血压、血糖、血脂与慢病数量及控制情况，评估代谢健康与慢病风险。",
    color: "from-orange-500 to-amber-400",
    bg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    icon: UtensilsCrossed,
    key: "L",
    title: "生活方式",
    name: "生活方式与行为指数",
    desc: "从饮食结构、睡眠质量、运动习惯、烟酒摄入与压力管理评估健康行为模式。",
    color: "from-sky-500 to-cyan-400",
    bg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    icon: Brain,
    key: "P",
    title: "心理认知",
    name: "心理认知与社交参与指数",
    desc: "评估情绪状态、认知水平、社会参与度与孤独感，守护心理健康与社交活力。",
    color: "from-violet-500 to-purple-400",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    icon: LineChart,
    key: "D",
    title: "数字健康",
    name: "数字健康轨迹指数",
    desc: "基于纵向健康监测数据的连续性与规律性，评估科学化健康管理意识。",
    color: "from-rose-500 to-pink-400",
    bg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
];

const steps = [
  {
    icon: ClipboardList,
    title: "填写健康信息",
    desc: "通过结构化问卷或 AI 智能填写，输入您的健康数据。",
  },
  {
    icon: Sparkles,
    title: "AI 智能评分",
    desc: "系统基于 CHLI 模型自动计算六大维度得分与综合长寿指数。",
  },
  {
    icon: FileText,
    title: "获取分析报告",
    desc: "生成可视化长寿报告，包含风险评估、AI 解读与个性化建议。",
  },
];

const stats = [
  { num: "6", label: "大核心维度" },
  { num: "25-105", label: "适用年龄范围" },
  { num: "CHLI", label: "科学评估模型" },
  { num: "24h", label: "随时随地评估" },
];

export default function HomePage() {
  return (
    <div className="pt-16">
      {/* ===================== 首屏 Banner ===================== */}
      <section className="relative overflow-hidden bg-brand-gradient">
        {/* 网格纹理 */}
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
        {/* 光晕装饰 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="glow-ring -left-32 top-10 h-80 w-80 bg-brand-400/25 animate-float-slow" />
          <div className="glow-ring right-[-40px] top-48 h-96 w-96 bg-brand-300/20 animate-float" />
          <div className="glow-ring bottom-[-60px] left-1/3 h-72 w-72 bg-cyan-300/15" />
        </div>
        {/* 顶部细微高光线 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="container-page relative py-24 md:py-32">
          <div className="max-w-3xl animate-fade-up">
            <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-inner-glow">
              <TrendingUp className="h-4 w-4 text-amber-300" />
              基于「中国百岁健康标准指数」CHLI 评估体系
            </div>
            <h1 className="mt-7 text-4xl font-bold leading-[1.15] text-white md:text-6xl">
              科学评估您的
              <span className="mx-2 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                健康寿命
              </span>
              <br />
              让百岁愿景有据可依
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/85 md:text-xl">
              从生物年龄、功能健康、代谢慢病、生活方式、心理社交与数字健康六大维度，
              结合前沿健康科学研究，为您生成一份专属的长寿指数分析报告与个性化改善方案。
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/questionnaire"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:scale-95"
              >
                <ClipboardList className="h-5 w-5" />
                立即开始评估
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#dimensions"
                className="glass inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-white/20"
              >
                了解评估体系
              </a>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 md:mt-20">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="glass animate-fade-up rounded-2xl p-5 text-center shadow-inner-glow transition-all duration-300 hover:bg-white/20 hover:shadow-lg"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <div className="text-2xl font-bold text-white md:text-3xl">
                  {stat.num}
                </div>
                <div className="mt-1 text-xs text-white/75 md:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部过渡波浪 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60 C 360 100, 720 20, 1440 60 L1440 90 L0 90 Z"
              fill="#F0F6FC"
            />
          </svg>
        </div>
      </section>

      {/* ===================== 六大维度 ===================== */}
      <section id="dimensions" className="relative bg-brand-soft py-20 md:py-28">
        {/* 点阵背景 */}
        <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-60" />
        <div className="container-page relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-tag">
              <BarChart3 className="h-3.5 w-3.5" />
              评估体系
            </span>
            <h2 className="mt-4 text-3xl font-bold text-ink-900 md:text-4xl">
              六大维度，全面评估
              <span className="text-gradient">健康寿命</span>
            </h2>
            <p className="mt-4 rounded-xl border border-brand-100 bg-white/70 p-4 text-sm text-ink-600 shadow-soft backdrop-blur">
              CHLI 综合指数 = 0.20×生物年龄 + 0.20×功能健康 + 0.20×代谢慢病
              + 0.15×生活方式 + 0.10×心理认知 + 0.15×数字健康
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dimensions.map((dim, i) => (
              <div
                key={dim.key}
                className="card card-accent card-hover group animate-fade-up p-7"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${dim.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <dim.icon className="h-7 w-7" />
                  </div>
                  <span className="text-4xl font-black text-brand-100 transition-colors duration-300 group-hover:text-brand-200">
                    {dim.key}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-ink-900">{dim.title}</h3>
                <p className={`mt-1 text-sm font-semibold ${dim.iconColor}`}>
                  {dim.name}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {dim.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== 评估流程 ===================== */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28">
        {/* 背景光晕 */}
        <div className="pointer-events-none absolute inset-0">
          <div className="glow-ring left-[-80px] top-20 h-72 w-72 bg-brand-100/60" />
          <div className="glow-ring right-[-80px] bottom-10 h-80 w-80 bg-brand-100/50" />
        </div>

        <div className="container-page relative">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-tag">
              <Sparkles className="h-3.5 w-3.5" />
              评估流程
            </span>
            <h2 className="mt-4 text-3xl font-bold text-ink-900 md:text-4xl">
              三步生成专属长寿报告
            </h2>
          </div>

          <div className="relative mt-14">
            {/* 连接虚线（仅大屏显示） */}
            <div className="absolute left-0 right-0 top-10 hidden h-0.5 bg-gradient-to-r from-transparent via-brand-200 to-transparent md:block" />

            <div className="relative grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.title} className="relative">
                  <div className="card card-hover flex h-full flex-col items-center p-8 text-center">
                    <div className="relative">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-brand-500/25">
                        <step.icon className="h-9 w-9" />
                      </div>
                      <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white shadow-md ring-4 ring-white">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-6 text-lg font-bold text-ink-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/questionnaire"
              className="btn-primary group inline-flex text-lg shadow-lg"
            >
              开始我的长寿评估
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <p className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-400">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              您的健康数据将加密存储，仅您本人可见
            </p>
          </div>
        </div>
      </section>

      {/* ===================== 信任背书 ===================== */}
      <section className="border-t border-brand-100 bg-brand-50/50 py-14">
        <div className="container-page">
          <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
            {[
              "基于前沿健康科学研究",
              "六大维度全面评估",
              "AI 智能个性化建议",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-ink-700">
                <CheckCircle2 className="h-5 w-5 text-brand-500" />
                <span className="text-sm font-medium md:text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
