"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Loader2,
  UserCircle2,
  Save,
  FileDown,
  Eye,
  PenLine,
  Stethoscope,
  Sparkles,
  ClipboardList,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth-store";
import { Markdown } from "@/components/Markdown";
import { SourceDataView } from "@/components/coach/SourceDataView";

interface SearchResult {
  id: number;
  reportCode: string;
  chliScore: number;
  level: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  coachInterpretation: string | null;
  result: {
    chliScore: number;
    level: string;
    label: string;
    dimensions: { key: string; name: string; score: number; weight: number; level: string; details?: Record<string, number> }[];
    bioAge: { actualAge: number; biologicalAge: number; ageGap: number };
    /** 客户原始填写数据 */
    sourceData?: Record<string, any>;
  } | null;
}

const LEVEL_LABELS: Record<string, string> = {
  excellent: "优",
  good: "良",
  moderate: "中",
  risk: "风险",
  highRisk: "高风险",
};
const LEVEL_COLORS: Record<string, string> = {
  excellent: "#10B981",
  good: "#3186D8",
  moderate: "#F59E0B",
  risk: "#F97316",
  highRisk: "#EF4444",
};

export default function CoachPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [report, setReport] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== "health_coach" && user.role !== "admin")) {
        router.replace("/");
      }
    }
  }, [authLoading, user, router]);

  const handleSearch = useCallback(async () => {
    if (!code.trim()) {
      setError("请输入报告编码");
      return;
    }
    setSearching(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/coach/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "搜索失败");
        return;
      }
      setReport(json.report);
      setMarkdown(json.report.coachInterpretation || "");
      setPreview(false);
    } catch {
      setError("网络错误");
    } finally {
      setSearching(false);
    }
  }, [code]);

  /** 生成 AI 解读作为参考 */
  const generateAI = async () => {
    if (!report?.result) return;
    setLoadingAI(true);
    setShowAI(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: report.result }),
      });
      const json = await res.json();
      if (res.ok && json.content) {
        setAiInsight(json.content);
      } else {
        setAiInsight("AI 解读生成失败，请稍后重试。");
      }
    } catch {
      setAiInsight("AI 解读生成失败，请稍后重试。");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;
    if (!markdown.trim()) {
      setError("解读内容不能为空");
      return;
    }
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/coach/interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: report.reportCode, markdown }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "保存失败");
        return;
      }
      setSavedMsg("解读已保存，客户可在报告中查看");
      setTimeout(() => setSavedMsg(null), 3000);
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  /** 导入 .md 文件 */
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMarkdown(String(reader.result || ""));
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const levelColor = report ? LEVEL_COLORS[report.level] || "#3186D8" : "#3186D8";

  /** 下载客户完整 PDF 报告（主报告 + 问卷填写明细附页），供线下解读参考 */
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const downloadCustomerPDF = async () => {
    if (!report?.result) return;
    setDownloadingPdf(true);
    try {
      // 获取客户功能医学问卷答案（健管师权限）
      let fmAnswers = null;
      let name = report.userName;
      let phone: string | null = null;
      try {
        const res = await fetch(
          `/api/functional-survey/by-report/${encodeURIComponent(report.reportCode)}`
        );
        if (res.ok) {
          const json = await res.json();
          fmAnswers = json.record?.answers ?? null;
          name = json.record?.name || report.userName;
          phone = json.record?.phone ?? null;
        }
      } catch {
        // 无 FM 问卷数据时仅导出主报告 + CHLI 明细
      }
      const { generateFullReportPDF } = await import("@/lib/export/full-report");
      await generateFullReportPDF({
        result: report.result as unknown as import("@/lib/chli-model").AssessmentResult,
        coachInterpretation: report.coachInterpretation || "",
        fmAnswers,
        name,
        phone,
        siteUrl: window.location.origin,
        fileName: `长寿评估报告-${report.reportCode}`,
      });
    } catch (e) {
      console.error("客户 PDF 报告生成失败:", e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft pt-16">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-brand-soft pt-16">
      <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-50" />
      <div className="container-page relative py-10">
        {/* 页头 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">健康管理师工作台</h1>
              <p className="text-sm text-ink-600">
                通过报告编码检索客户报告，撰写个性化人工解读（支持 Markdown）
              </p>
            </div>
          </div>
          <Link
            href="/coach/surveys"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 transition-all hover:border-teal-300 hover:bg-teal-100"
          >
            <ClipboardList className="h-4 w-4" />
            功能问卷记录
          </Link>
        </div>

        {/* 搜索区 */}
        <div className="card mt-8 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="输入报告编码，如 CHLI-250805-XXXXXX"
                className="input-base pl-12"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="btn-primary shrink-0"
            >
              {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              搜索报告
            </button>
          </div>
          {error && (
            <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {report && (
          <div className="mt-8 grid gap-8 lg:grid-cols-5">
            {/* 左：客户报告概览 */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink-900">
                  <UserCircle2 className="h-5 w-5 text-brand-600" />
                  客户报告概览
                </h2>
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={{ backgroundColor: levelColor }}
                  >
                    <span className="text-3xl font-bold">{Math.round(report.chliScore)}</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-ink-900">{report.userName || "未命名用户"}</div>
                    <div className="text-xs text-ink-400">{report.userEmail}</div>
                    <span
                      className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: levelColor }}
                    >
                      {LEVEL_LABELS[report.level] || report.level} · {Math.round(report.chliScore)} 分
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1 rounded-xl bg-brand-50/60 p-4 text-xs text-ink-600">
                  <div className="flex justify-between">
                    <span>报告编码</span>
                    <span className="font-mono font-semibold text-brand-700">{report.reportCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>生成时间</span>
                    <span>{new Date(report.createdAt).toLocaleString("zh-CN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>报告 ID</span>
                    <span>#{report.id}</span>
                  </div>
                </div>

                {/* 客户 PDF 报告下载 */}
                <button
                  onClick={downloadCustomerPDF}
                  disabled={downloadingPdf}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 transition-all hover:border-teal-400 hover:bg-teal-100 disabled:opacity-50"
                >
                  {downloadingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {downloadingPdf ? "正在生成 PDF…" : "下载客户 PDF 报告"}
                </button>
                <p className="mt-1.5 text-center text-[11px] text-ink-400">
                  含主报告与全部问卷填写明细，可对照撰写解读
                </p>

                {/* 生物年龄对比 */}
                {report.result?.bioAge && report.result.bioAge.actualAge != null && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-xs font-semibold text-ink-500">生物年龄对比</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-brand-100 bg-white p-3 text-center">
                        <div className="text-[11px] text-ink-500">实际年龄</div>
                        <div className="text-xl font-bold text-ink-900">
                          {report.result.bioAge.actualAge}
                          <span className="text-xs text-ink-400"> 岁</span>
                        </div>
                      </div>
                      <div
                        className="rounded-xl border p-3 text-center"
                        style={{ backgroundColor: `${levelColor}10`, borderColor: `${levelColor}40` }}
                      >
                        <div className="text-[11px] text-ink-500">生物年龄</div>
                        <div className="text-xl font-bold" style={{ color: levelColor }}>
                          {report.result.bioAge.biologicalAge}
                          <span className="text-xs text-ink-400"> 岁</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="mt-2 rounded-lg px-3 py-2 text-xs font-medium"
                      style={{ backgroundColor: `${levelColor}12`, color: levelColor }}
                    >
                      {report.result.bioAge.ageGap < 0
                        ? `生物年龄比实际年龄年轻 ${Math.abs(report.result.bioAge.ageGap)} 岁`
                        : report.result.bioAge.ageGap > 2
                        ? `生物年龄比实际年龄大 ${report.result.bioAge.ageGap} 岁`
                        : "生物年龄与实际年龄基本相当"}
                    </div>
                  </div>
                )}

                {/* 维度得分 */}
                {report.result?.dimensions && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-xs font-semibold text-ink-500">六大维度得分</h3>
                    <div className="space-y-2.5">
                      {report.result.dimensions.map((d) => (
                        <div key={d.key}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-ink-800">
                              {d.key} · {d.name}
                            </span>
                            <span className="flex items-center gap-2">
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                style={{ backgroundColor: LEVEL_COLORS[d.level] || "#3186D8" }}
                              >
                                {LEVEL_LABELS[d.level] || d.level}
                              </span>
                              <span className="font-bold text-ink-900">{Math.round(d.score)}</span>
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-100">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.round(d.score)}%`, backgroundColor: LEVEL_COLORS[d.level] || "#3186D8" }}
                            />
                          </div>
                          {/* 二级指标明细 */}
                          {d.details && Object.keys(d.details).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {Object.entries(d.details).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] text-ink-500"
                                >
                                  {k} <strong className="text-brand-700">{Math.round(v as number)}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  客户可见报告页会展示您撰写的人工解读。
                </p>

                {/* 客户原始填写数据 */}
                {report.result?.sourceData && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-xs font-semibold text-ink-500">客户原始填写数据</h3>
                    <SourceDataView data={report.result.sourceData} />
                  </div>
                )}
              </div>
            </div>

            {/* 右：解读编辑器 */}
            <div className="lg:col-span-3 space-y-6">
              {/* AI 解读参考 */}
              <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-brand-50/50 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-600" />
                    <h2 className="font-bold text-ink-900">AI 解读参考</h2>
                    <span className="text-xs text-ink-400">供您参考，可复制后修改</span>
                  </div>
                  <button
                    onClick={generateAI}
                    disabled={loadingAI}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    {loadingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {loadingAI ? "生成中..." : showAI ? "重新生成" : "生成 AI 解读"}
                  </button>
                </div>
                {showAI && (
                  <div className="max-h-[400px] overflow-y-auto p-6">
                    <div className="mb-3 flex justify-end gap-2">
                      <button
                        onClick={() => setMarkdown(aiInsight)}
                        disabled={!aiInsight}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-300 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-40"
                      >
                        <PenLine className="h-3 w-3" />
                        导入到解读
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(aiInsight)}
                        disabled={!aiInsight}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-100 px-2.5 py-1 text-[11px] text-ink-500 transition-colors hover:bg-brand-50 disabled:opacity-40"
                      >
                        复制 Markdown
                      </button>
                    </div>
                    {aiInsight ? (
                      <Markdown content={aiInsight} />
                    ) : (
                      <div className="py-10 text-center text-sm text-ink-400">
                        点击「生成 AI 解读」获取参考内容
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-brand-50/50 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <PenLine className="h-5 w-5 text-brand-600" />
                    <h2 className="font-bold text-ink-900">撰写人工解读</h2>
                    <span className="text-xs text-ink-400">支持 Markdown 语法</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".md,.markdown,.txt"
                      className="hidden"
                      onChange={handleImportFile}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      导入 Markdown
                    </button>
                    <button
                      onClick={() => setPreview(!preview)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        preview
                          ? "bg-brand-600 text-white"
                          : "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {preview ? "编辑" : "预览"}
                    </button>
                  </div>
                </div>

                <div className="min-h-[420px] p-6">
                  {preview ? (
                    <div className="min-h-[380px]">
                      {markdown.trim() ? (
                        <Markdown content={markdown} />
                      ) : (
                        <div className="flex h-[380px] items-center justify-center text-sm text-ink-400">
                          暂无内容
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      placeholder={`## 客户健康解读\n\n在此撰写对客户报告的人工解读...\n\n- 支持 **粗体**、*斜体*\n- 支持列表、引用\n- 点击「预览」查看效果`}
                      className="h-[380px] w-full resize-none rounded-xl border border-brand-100 bg-white p-4 font-mono text-sm leading-relaxed text-ink-900 shadow-inner outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-brand-100 bg-brand-50/30 px-6 py-4">
                  {savedMsg && <span className="text-xs text-emerald-600">{savedMsg}</span>}
                  <button
                    onClick={handleSave}
                    disabled={saving || !markdown.trim()}
                    className="btn-primary disabled:opacity-40"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    保存解读
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
