"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { AssessmentResult } from "@/lib/chli-model";

interface Props {
  result: AssessmentResult;
}

/** 渲染行内 markdown（粗体 / 斜体），移除 ** 和 * 符号 */
function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  // 匹配 **bold** 或 *italic*
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-ink-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <em key={key++} className="text-ink-900">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function InsightsCard({ result }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"ai" | "rule">("rule");
  const [error, setError] = useState<string | null>(null);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败");
        return;
      }
      setContent(data.content);
      setSource(data.source);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-brand-100 bg-brand-50/60 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink-900">AI 智能解读与建议</h3>
            <p className="text-xs text-ink-600">
              基于您的评估结果生成的个性化健康解读
            </p>
          </div>
        </div>
        {!loading && (
          <button
            onClick={loadInsights}
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            重新生成
          </button>
        )}
      </div>

      <div className="p-6 md:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            <p className="mt-3 text-sm text-ink-600">正在为您生成个性化健康解读...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <button onClick={loadInsights} className="btn-secondary mt-4 text-sm">
              <RefreshCw className="h-4 w-4" />
              重试
            </button>
          </div>
        ) : content ? (
          <div>
            {source === "rule" && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-600">
                <AlertCircle className="h-3.5 w-3.5" />
                当前为系统智能解读（基于评估规则生成）
              </div>
            )}
            <div className="prose prose-brand max-w-none space-y-4">
              {content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) {
                  return (
                    <h4 key={i} className="flex items-center gap-2 pt-2 text-lg font-bold text-brand-700">
                      <span className="h-5 w-1.5 rounded-full bg-brand-gradient" />
                      {renderInline(line.replace("## ", ""))}
                    </h4>
                  );
                }
                if (line.startsWith("> ")) {
                  return (
                    <blockquote
                      key={i}
                      className="rounded-xl border-l-4 border-brand-300 bg-brand-50 px-4 py-3 text-sm text-ink-600"
                    >
                      {renderInline(line.replace("> ", ""))}
                    </blockquote>
                  );
                }
                if (/^\d+\.\s/.test(line)) {
                  return (
                    <div key={i} className="flex gap-2.5 pl-2 text-sm leading-relaxed text-ink-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                        {line.split(".")[0]}
                      </span>
                      <span>{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
                    </div>
                  );
                }
                if (/^[-•]\s/.test(line)) {
                  return (
                    <div key={i} className="flex gap-2 pl-2 text-sm leading-relaxed text-ink-700">
                      <span className="text-brand-500">•</span>
                      <span>{renderInline(line.replace(/^[-•]\s/, ""))}</span>
                    </div>
                  );
                }
                if (line.trim() === "") return <div key={i} className="h-2" />;
                return (
                  <p key={i} className="text-sm leading-relaxed text-ink-700">
                    {renderInline(line)}
                  </p>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-ink-400">暂无解读内容</p>
        )}
      </div>
    </div>
  );
}
