"use client";

import { useState } from "react";
import {
  Loader2,
  Download,
  Share2,
  Smartphone,
  FileText,
} from "lucide-react";
import { exportShareImage } from "@/lib/export/report-export";
import type { AssessmentResult } from "@/lib/chli-model";

interface Props {
  /** 评估结果（用于生成分享图和 PDF） */
  result: AssessmentResult;
}

export function ExportPanel({ result }: Props) {
  const [loading, setLoading] = useState<"share" | "pdf" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleShare = async () => {
    setLoading("share");
    setMessage(null);
    try {
      const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
      await exportShareImage(result, siteUrl);
      setMessage({ type: "success", text: "手机分享图已生成，正在下载" });
    } catch (e) {
      console.error("分享图生成失败:", e);
      setMessage({ type: "error", text: "生成分享图失败，请重试" });
    } finally {
      setLoading(null);
    }
  };

  const handlePdf = async () => {
    setLoading("pdf");
    setMessage(null);
    try {
      const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
      // 获取健康管理师人工解读（如有），作为 PDF 总结页
      let coachInterpretation = "";
      if (result.reportCode) {
        try {
          const res = await fetch(`/api/coach/interpretation?code=${encodeURIComponent(result.reportCode)}`);
          const json = await res.json();
          coachInterpretation = json?.coachInterpretation || "";
        } catch {
          coachInterpretation = "";
        }
      }
      // 动态导入 jsPDF 和 PDF 生成函数（避免 SSR 问题）
      const { jsPDF } = await import("jspdf");
      const { generateA4Pages } = await import("@/lib/export/report-export");
      const pages = await generateA4Pages(result, siteUrl, coachInterpretation);
      const pdf = new jsPDF("p", "pt", "a4");
      // A4 纸张实际尺寸 595×842pt，图片缩放适配纸张
      pages.forEach((dataUrl, i) => {
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, 0, 595, 842);
      });
      pdf.save("长寿评估报告.pdf");
      setMessage({ type: "success", text: "PDF 报告已生成，正在下载" });
    } catch (e) {
      console.error("PDF 生成失败:", e);
      setMessage({ type: "error", text: "PDF 生成失败，请重试" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md">
          <Download className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-ink-900">导出报告</h3>
          <p className="text-xs text-ink-600">
            将您的长寿评估报告保存为手机分享图或 PDF 文档
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* 手机分享长图 */}
        <button
          onClick={handleShare}
          disabled={loading !== null}
          className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50/70 to-white p-6 text-left transition-all hover:border-brand-400 hover:shadow-card-hover active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex w-full items-center justify-between">
            {loading === "share" ? (
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md">
                <Smartphone className="h-5 w-5" />
              </div>
            )}
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white">
              推荐
            </span>
          </div>
          <div>
            <div className="text-base font-bold text-ink-900">手机分享长图</div>
            <div className="mt-1 text-xs text-ink-500">
              竖版分享图，含综合指数、维度得分与二维码
            </div>
          </div>
          {loading === "share" && (
            <div className="text-xs text-brand-600">正在生成...</div>
          )}
        </button>

        {/* PDF 文档 */}
        <button
          onClick={handlePdf}
          disabled={loading !== null}
          className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-brand-100 bg-white p-6 text-left transition-all hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-card-hover active:scale-[0.98] disabled:opacity-50"
        >
          <div className="flex w-full items-center justify-between">
            {loading === "pdf" ? (
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md">
                <FileText className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <div className="text-base font-bold text-ink-900">PDF 报告</div>
            <div className="mt-1 text-xs text-ink-500">
              A4 文档式排版，可打印归档与专业分享
            </div>
          </div>
          {loading === "pdf" && (
            <div className="text-xs text-brand-600">正在生成...</div>
          )}
        </button>
      </div>

      {message && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}