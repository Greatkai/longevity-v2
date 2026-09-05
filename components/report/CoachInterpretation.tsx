"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Loader2 } from "lucide-react";
import { Markdown } from "@/components/Markdown";

interface Props {
  reportCode: string;
  /** 回调：是否有人工解读（用于父组件隐藏 AI 解读） */
  onHasContent?: (has: boolean) => void;
}

/** 客户报告页展示健康管理师人工解读 */
export function CoachInterpretation({ reportCode, onHasContent }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/coach/interpretation?code=${encodeURIComponent(reportCode)}`);
        const json = await res.json();
        if (!cancelled) {
          const has = !!json?.coachInterpretation;
          setContent(has ? json.coachInterpretation : null);
          onHasContent?.(has);
        }
      } catch {
        if (!cancelled) {
          setContent(null);
          onHasContent?.(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportCode, onHasContent]);

  if (loading) {
    return (
      <div className="card p-8 text-center text-ink-400">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="card card-accent overflow-hidden">
      <div className="flex items-center gap-3 border-b border-brand-100 bg-gradient-to-r from-teal-50/70 to-white px-6 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-ink-900">健康管理师 · 人工解读</h3>
          <p className="text-xs text-ink-500">由专业健康管理师为您撰写的个性化解读与建议</p>
        </div>
      </div>
      <div className="p-6 md:p-8">
        <Markdown content={content} />
      </div>
    </div>
  );
}
