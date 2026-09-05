"use client";

import { useState } from "react";
import { Sparkles, Loader2, Wand2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ExtractedData } from "@/lib/ai/extractor";
import { useAssessment } from "@/store/assessment-store";

interface Props {
  onFilled: (filled: number) => void;
}

/** 提取字段中属于 LabValue 的路径（值需写入 .value 并标记 available） */
const LAB_VALUE_PATHS = new Set([
  "metabolic.hba1c",
  "metabolic.ldl",
  "metabolic.fastingGlucose",
]);

/** 将提取结果扁平化为 path -> value（对 LabValue 字段特殊处理） */
function flattenData(data: ExtractedData): Record<string, number> {
  const flat: Record<string, number> = {};
  const groups: (keyof ExtractedData)[] = [
    "bio",
    "functional",
    "metabolic",
    "lifestyle",
    "psychosocial",
    "digital",
  ];
  for (const g of groups) {
    for (const [key, val] of Object.entries(data[g])) {
      if (val === null || val === undefined) continue;
      const path = `${g}.${key}`;
      if (LAB_VALUE_PATHS.has(path)) {
        // 检验数据：写入 .value 并标记 available
        flat[`${path}.value`] = val;
        flat[`${path}.available`] = 1;
      } else {
        flat[path] = val;
      }
    }
  }
  return flat;
}

export function AIFillPanel({ onFilled }: Props) {
  const { setBulk } = useAssessment();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExtract = async () => {
    if (!text.trim()) {
      setMessage({ type: "error", text: "请先输入您的健康描述" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "提取失败" });
        return;
      }
      const flat = flattenData(data.data as ExtractedData);
      const count = Object.keys(flat).length;
      setBulk(flat);
      setMessage({
        type: "success",
        text: `已从您的描述中提取 ${count} 项健康数据并自动填充问卷`,
      });
      onFilled(count);
    } catch {
      setMessage({ type: "error", text: "网络错误，请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-brand-100 bg-brand-50/60 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink-900">AI 智能填写</h3>
            <p className="text-xs text-ink-600">
              粘贴一段健康描述，AI 自动提取并填充问卷
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={'例如：\n"我今年45岁，身高175，体重75公斤。血压120/80，空腹血糖5.5。平时每周运动3次，晚上睡眠7小时，睡眠质量不错。不吸烟，偶尔喝点酒。工作压力一般，经常和朋友聚会，情绪还可以。每年都体检。"'}
          className="input-base resize-none leading-relaxed"
        />

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleExtract}
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                AI 正在提取...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                智能提取并填充
              </>
            )}
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="mt-4 rounded-xl bg-brand-50/60 p-4 text-xs leading-relaxed text-ink-600">
          <span className="font-semibold text-brand-700">填写提示：</span>
          建议包含年龄、身高体重、血压血糖、生活方式（饮食/睡眠/运动/烟酒）、
          心理状态与体检习惯等信息，AI 将自动识别并填充对应问卷项，您可后续手动调整。
        </div>
      </div>
    </div>
  );
}
