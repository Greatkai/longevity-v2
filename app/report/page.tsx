"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  ClipboardList,
  Save,
  Download,
  ArrowLeft,
  TrendingUp,
  BrainCircuit,
  Activity,
  Sparkles,
} from "lucide-react";
import { useAssessment } from "@/store/assessment-store";
import { useAuth } from "@/store/auth-store";
import { RISK_META } from "@/lib/chli-model";
import { ScoreDonut } from "@/components/report/ScoreDonut";
import { DimensionRadar } from "@/components/report/DimensionRadar";
import { DimensionBars } from "@/components/report/DimensionBars";
import { InsightsCard } from "@/components/report/InsightsCard";
import { ExportPanel } from "@/components/report/ExportPanel";
import { CalcDetails } from "@/components/report/CalcDetails";
import { CoachInterpretation } from "@/components/report/CoachInterpretation";
import { FunctionalImbalance } from "@/components/report/FunctionalImbalance";

export default function ReportPage() {
  const router = useRouter();
  const { result, data, reset } = useAssessment();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  // 是否有人工解读（有则隐藏 AI 解读）
  const [hasCoach, setHasCoach] = useState(false);
  // 记录是否已自动保存，避免重复保存
  const autoSavedRef = useRef(false);

  useEffect(() => {
    if (!result) {
      router.replace("/questionnaire");
    }
  }, [result, router]);

  // 登录用户：生成报告后默认自动保存（避免重复保存已存在的报告）
  useEffect(() => {
    if (!result || !user || !result.reportCode || autoSavedRef.current) return;
    if (user.role === "user" || user.role === "admin" || user.role === "health_coach") {
      // 检查该报告是否已在本地记录为已保存
      const savedCodes = JSON.parse(localStorage.getItem("chi_saved_reports") || "[]");
      if (savedCodes.includes(result.reportCode)) {
        autoSavedRef.current = true;
        setSaveMsg("报告已自动保存到「我的报告」");
        return;
      }
      autoSavedRef.current = true;
      setSaveMsg(null);
      (async () => {
        try {
          const res = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chliScore: result.chliScore,
              level: result.level,
              payload: { ...result, sourceData: data },
            }),
          });
          const saveData = await res.json();
          if (res.ok) {
            // 记录已保存的报告编码
            const updated = [...savedCodes, result.reportCode].slice(-100);
            localStorage.setItem("chi_saved_reports", JSON.stringify(updated));
            setSaveMsg("报告已自动保存到「我的报告」");
          } else {
            autoSavedRef.current = false;
            setSaveMsg(saveData.error || "自动保存失败，可手动保存");
          }
        } catch {
          autoSavedRef.current = false;
          setSaveMsg("自动保存失败，可手动保存");
        }
      })();
    }
  }, [result, user]);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft pt-16">
        <div className="text-center">
          <p className="text-lg text-ink-600">暂无评估数据</p>
          <Link href="/questionnaire" className="btn-primary mt-4 inline-flex">
            <ClipboardList className="h-5 w-5" />
            去完成评估
          </Link>
        </div>
      </div>
    );
  }

  const meta = RISK_META[result.level];
  const dims = [...result.dimensions].sort((a, b) => a.score - b.score);
  const weakest = dims[0];
  const strongest = dims[dims.length - 1];

  const handleSave = async () => {
    if (!user) {
      router.push("/login?next=/report");
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chliScore: result.chliScore,
          level: result.level,
          payload: result,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg("报告已保存到「我的报告」");
      } else {
        setSaveMsg(data.error || "保存失败");
      }
    } catch {
      setSaveMsg("网络错误，保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-soft pt-16">
      <div className="container-page py-10">
        {/* 顶部操作栏 */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/questionnaire")}
              className="btn-secondary"
            >
              <ArrowLeft className="h-5 w-5" />
              重新评估
            </button>
            <button onClick={reset} className="btn-secondary">
              <RotateCcw className="h-5 w-5" />
              重置
            </button>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <Save className="h-4 w-4" />
                {autoSavedRef.current ? "已自动保存" : "保存中..."}
              </span>
            ) : (
              <button
                onClick={() => router.push("/login?next=/report")}
                className="btn-secondary"
              >
                <Save className="h-5 w-5" />
                登录后自动保存
              </button>
            )}
            <a href="#export" className="btn-primary">
              <Download className="h-5 w-5" />
              导出报告
            </a>
          </div>
        </div>

        {saveMsg && (
          <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMsg}
          </div>
        )}

        {/* 可导出报告主体 */}
        <div id="report-export" className="space-y-8">
        {/* 综合得分区 */}
        <div className="card overflow-hidden">
          {/* 报告封面头部 */}
          <div className="flex items-center justify-between border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-white px-6 py-5 md:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-ink-900">百岁白皮书 · 长寿指数评估报告</div>
                <div className="text-xs text-ink-400">中国百岁健康标准指数（CHLI）</div>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              {result.reportCode && (
                <>
                  <div className="text-xs text-ink-400">报告编码</div>
                  <div className="font-mono text-xs font-semibold text-brand-600">
                    {result.reportCode}
                  </div>
                </>
              )}
              <div className="mt-1 text-xs text-ink-400">报告生成时间</div>
              <div className="text-sm font-semibold text-brand-700">
                {new Date(result.createdAt || Date.now()).toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            {/* 左侧：综合指数 */}
            <div className="relative flex flex-col items-center justify-center overflow-hidden border-b border-brand-100 bg-brand-gradient p-10 md:border-b-0 md:border-r">
              {/* 网格纹理 */}
              <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
              {/* 光晕 */}
              <div className="glow-ring left-[-40px] top-[-40px] h-48 w-48 bg-white/15" />
              <div className="relative">
                <ScoreDonut score={result.chliScore} level={result.level} label={result.label} />
              </div>
              <p className="relative mt-4 max-w-xs text-center text-sm leading-relaxed text-white/85">
                {meta.description}
              </p>
            </div>

            {/* 右侧：生物年龄对比 */}
            <div className="flex flex-col justify-center p-8 md:p-10">
              <h3 className="mb-6 text-lg font-bold text-ink-900">生物年龄对比</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5 text-center shadow-soft">
                  <div className="text-xs font-medium text-ink-600">实际年龄</div>
                  <div className="mt-2 text-4xl font-bold text-ink-900">
                    {result.bioAge.actualAge}
                    <span className="text-base font-normal text-ink-400">岁</span>
                  </div>
                </div>
                <div
                  className="rounded-2xl border p-5 text-center shadow-soft"
                  style={{
                    backgroundColor: `${meta.color}12`,
                    borderColor: `${meta.color}40`,
                  }}
                >
                  <div className="text-xs font-medium text-ink-600">生物年龄</div>
                  <div
                    className="mt-2 text-4xl font-bold"
                    style={{ color: meta.color }}
                  >
                    {result.bioAge.biologicalAge}
                    <span className="text-base font-normal text-ink-400">岁</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5">
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <TrendingUp className="h-4 w-4 text-brand-600" />
                  <span>
                    年龄差：{" "}
                    <strong className="text-brand-700">
                      {result.bioAge.ageGap >= 0 ? "+" : ""}
                      {result.bioAge.ageGap} 岁
                    </strong>
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {result.bioAge.ageGap < 0
                    ? `您的生物年龄比实际年龄年轻 ${Math.abs(result.bioAge.ageGap)} 岁，衰老速度较慢，健康寿命潜力良好。`
                    : result.bioAge.ageGap > 2
                    ? `您的生物年龄比实际年龄大 ${result.bioAge.ageGap} 岁，提示衰老速度偏快，建议加强健康干预。`
                    : `您的生物年龄与实际年龄相当，处于正常衰老轨道。`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 雷达图 + 柱状图 */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="card card-accent p-6 md:p-8">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="h-8 w-1.5 rounded-full bg-brand-gradient" />
              <div>
                <h3 className="text-lg font-bold text-ink-900">六大维度分布</h3>
                <p className="text-sm text-ink-400">各维度得分可视化对比</p>
              </div>
            </div>
            <DimensionRadar result={result} />
          </div>
          <div className="card card-accent p-6 md:p-8">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="h-8 w-1.5 rounded-full bg-brand-gradient" />
              <div>
                <h3 className="text-lg font-bold text-ink-900">维度得分明细</h3>
                <p className="text-sm text-ink-400">满分 100 分，按权重加权计算</p>
              </div>
            </div>
            <DimensionBars result={result} />
          </div>
        </div>

        {/* 健康管理师人工解读（关键解读，紧跟在综合得分下方） */}
        {result.reportCode && (
          <div className="mt-8">
            <CoachInterpretation
              reportCode={result.reportCode}
              onHasContent={setHasCoach}
            />
          </div>
        )}

        {/* 风险卡片 */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.dimensions.map((d) => {
            const dMeta = RISK_META[d.level];
            return (
              <div
                key={d.key}
                className="card card-accent card-hover relative overflow-hidden p-5"
              >
                {/* 左侧色条 */}
                <div
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: dMeta.color }}
                />
                <div className="pl-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-ink-900">
                      {d.key} · {d.name}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
                      style={{ backgroundColor: dMeta.color }}
                    >
                      {dMeta.label}
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-4xl font-bold text-ink-900">
                      {Math.round(d.score)}
                      <span className="text-sm font-normal text-ink-400">/100</span>
                    </span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                      权重 {d.weight * 100}%
                    </span>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-brand-100 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${d.score}%`,
                        backgroundColor: dMeta.color,
                        boxShadow: `0 0 8px ${dMeta.color}60`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 维度小结 */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card card-accent relative overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-6">
            <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-emerald-100/60" />
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                <TrendingUp className="h-5 w-5" />
              </span>
              <h4 className="text-base font-bold text-emerald-700">优势维度</h4>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              <strong className="text-emerald-700">{strongest.name}</strong>{" "}
              得分最高（{Math.round(strongest.score)} 分），是您健康寿命的重要支撑。
            </p>
          </div>
          <div className="card card-accent relative overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50/70 to-white p-6">
            <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-amber-100/60" />
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                <Activity className="h-5 w-5" />
              </span>
              <h4 className="text-base font-bold text-amber-700">重点关注</h4>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              <strong className="text-amber-700">{weakest.name}</strong>{" "}
              得分相对较低（{Math.round(weakest.score)} 分），建议优先改善以提升整体指数。
            </p>
          </div>
        </div>

        {/* AI 解读 */}
        <div className="mt-8">
          {/* 有人工解读时不再展示 AI 智能解读与建议 */}
          {!hasCoach && <InsightsCard result={result} />}
        </div>

        {/* FSHI 附加模块 */}
        {result.fshi && (
          <div className="mt-8 card card-accent p-6 md:p-8">
            <div className="mb-5 flex items-center gap-2.5">
              <span className="h-8 w-1.5 rounded-full bg-brand-gradient" />
              <div>
                <h3 className="text-lg font-bold text-ink-900">
                  FSHI 功能与感觉健康指数
                </h3>
                <p className="text-sm text-ink-400">
                  附加评估模块，综合功能健康、生活方式与心理状态
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full text-white shadow-lg"
                style={{
                  backgroundColor: RISK_META[result.fshi.level].color,
                  boxShadow: `0 8px 20px ${RISK_META[result.fshi.level].color}40`,
                }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold">{Math.round(result.fshi.score)}</div>
                  <div className="text-xs opacity-90">/100</div>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <span
                  className="rounded-full px-3.5 py-1 text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: RISK_META[result.fshi.level].color }}
                >
                  {RISK_META[result.fshi.level].label}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {RISK_META[result.fshi.level].description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 功能医学失衡评估（完成功能医学问卷时展示） */}
        {result.functional && result.functional.included && (
          <FunctionalImbalance functional={result.functional} />
        )}
        </div>

        {/* 详细计算逻辑 */}
        <div className="mt-8">
          <CalcDetails result={result} />
        </div>

        {/* 导出区 */}
        <div id="export" className="mt-8">
          <ExportPanel result={result} />
        </div>
      </div>
    </div>
  );
}
