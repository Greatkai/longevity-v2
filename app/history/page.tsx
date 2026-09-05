"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Trash2,
  Eye,
  Loader2,
  Clock,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { RISK_META } from "@/lib/chli-model";
import { useAssessment } from "@/store/assessment-store";
import type { AssessmentResult } from "@/lib/chli-model";

interface ReportItem {
  id: number;
  chliScore: number;
  level: keyof typeof RISK_META;
  createdAt: string;
  payload: AssessmentResult;
}

export default function HistoryPage() {
  const router = useRouter();
  const { setResult } = useAssessment();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const viewReport = async (id: number) => {
    try {
      const res = await fetch(`/api/reports/${id}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data.report.payload as AssessmentResult);
        router.push("/report");
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-brand-soft pt-16">
      <div className="container-page py-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-brand-500/30">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">我的报告</h1>
              <p className="text-sm text-ink-600">
                查看和管理您保存的长寿评估报告
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-12 flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              <p className="mt-3 text-sm text-ink-600">加载中...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="card card-accent mt-8 flex flex-col items-center justify-center p-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
                <ClipboardList className="h-10 w-10 text-brand-300" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-ink-900">
                还没有保存的报告
              </h3>
              <p className="mt-2 max-w-sm text-sm text-ink-600">
                完成一次长寿评估后，点击「保存报告」即可在此查看历史记录。
              </p>
              <Link href="/questionnaire" className="btn-primary mt-6">
                <ClipboardList className="h-5 w-5" />
                开始评估
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {reports.map((report) => {
                const meta = RISK_META[report.level] || RISK_META.moderate;
                return (
                  <div
                    key={report.id}
                    className="card card-hover relative flex flex-col gap-4 overflow-hidden p-6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* 左侧色条 */}
                    <div
                      className="absolute left-0 top-0 h-full w-1.5"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div className="flex items-center gap-4 pl-1">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                        style={{ backgroundColor: meta.color }}
                      >
                        <span className="text-lg font-bold">
                          {Math.round(report.chliScore)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink-900">
                            综合长寿指数 {Math.round(report.chliScore)} 分
                          </span>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                            style={{ backgroundColor: meta.color }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(report.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewReport(report.id)}
                        className="btn-secondary !px-4 !py-2 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        查看
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        disabled={deleting === report.id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            您的评估报告仅您本人可见，数据安全加密存储。
          </div>
        </div>
      </div>
    </div>
  );
}
