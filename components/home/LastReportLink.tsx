"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

interface LastReportInfo {
  score: number;
  code: string;
  date: string;
}

/** 首页「查看最近的评估报告」入口（本地保存，未登录也可用） */
export function LastReportLink() {
  const [info, setInfo] = useState<LastReportInfo | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("chi_last_report");
      if (!raw) return;
      const r = JSON.parse(raw);
      if (r && typeof r.chliScore === "number") {
        setInfo({
          score: Math.round(r.chliScore),
          code: typeof r.reportCode === "string" ? r.reportCode : "",
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("zh-CN") : "",
        });
      }
    } catch {
      // 忽略
    }
  }, []);

  if (!info) return null;

  return (
    <Link
      href="/report"
      className="group inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm backdrop-blur transition-all hover:border-brand-400 hover:shadow-md"
    >
      <FileText className="h-4 w-4" />
      查看最近的评估报告（{info.score} 分
      {info.date ? ` · ${info.date}` : ""}）
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
