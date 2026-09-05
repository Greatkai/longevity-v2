"use client";

import { cn } from "@/lib/utils";
import type { FMQuestion } from "@/lib/functional-survey/types";

interface Props {
  question: FMQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}

const FOOD_FREQS = ["每天", "每周", "每月", "不吃"];
const DISEASE_STATUS = ["无", "有", "不详"];

/** 功能医学问卷单题渲染器（移动优先触控设计） */
export function FMQuestionField({ question, value, onChange }: Props) {
  /* ---------- radio ---------- */
  if (question.type === "radio") {
    const options = question.options ?? [];
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex min-h-11 items-center justify-between rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98]",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                  : "border-brand-100 bg-white text-ink-600 hover:border-brand-300"
              )}
            >
              {opt}
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  active ? "border-brand-500 bg-brand-500" : "border-brand-200"
                )}
              >
                {active && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ---------- checkbox ---------- */
  if (question.type === "checkbox") {
    const options = question.options ?? [];
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt];
      onChange(next);
    };
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                "flex min-h-11 items-center justify-between rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98]",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                  : "border-brand-100 bg-white text-ink-600 hover:border-brand-300"
              )}
            >
              {opt}
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                  active ? "border-brand-500 bg-brand-500" : "border-brand-200"
                )}
              >
                {active && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none">
                    <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ---------- foodfreq：频率 × 次数 × 份量 ---------- */
  if (question.type === "foodfreq") {
    const v = (value ?? {}) as { freq?: string; count?: number | string; amount?: string };
    const amounts = question.bowl ? ["大碗", "中碗", "小碗"] : ["大份", "中份", "小份"];
    const hasFreq = !!v.freq && v.freq !== "不吃";
    const set = (patch: Partial<typeof v>) => onChange({ ...v, ...patch });
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-1.5">
          {FOOD_FREQS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => set({ freq: f, ...(f === "不吃" ? { count: "", amount: "" } : {}) })}
              className={cn(
                "min-h-10 rounded-xl border-2 px-1 py-2 text-xs font-semibold transition-all active:scale-95",
                v.freq === f
                  ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                  : "border-brand-100 bg-white text-ink-600 hover:border-brand-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        {hasFreq && (
          <div className="flex flex-wrap items-center gap-2 animate-fade-up">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-500">次数</span>
              <input
                type="number"
                min={1}
                max={30}
                value={v.count ?? ""}
                onChange={(e) => set({ count: e.target.value === "" ? "" : Number(e.target.value) })}
                placeholder="次"
                className="h-10 w-16 rounded-lg border-2 border-brand-100 bg-white px-2 text-center text-sm text-ink-900 outline-none transition-colors focus:border-brand-400"
              />
              <span className="text-xs text-ink-400">
                /{v.freq === "每天" ? "天" : v.freq === "每周" ? "周" : "月"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-ink-500">份量</span>
              <div className="flex gap-1">
                {amounts.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => set({ amount: a })}
                    className={cn(
                      "min-h-9 rounded-lg border-2 px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95",
                      v.amount === a
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-brand-100 bg-white text-ink-500 hover:border-brand-300"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- diseasehist：无/有/不详 + 年份与详情 ---------- */
  if (question.type === "diseasehist") {
    const v = (value ?? {}) as { status?: string; detail?: string };
    const set = (patch: Partial<typeof v>) => onChange({ ...v, ...patch });
    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-1.5">
          {DISEASE_STATUS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set({ status: s, ...(s !== "有" ? { detail: "" } : {}) })}
              className={cn(
                "min-h-10 rounded-xl border-2 px-2 py-2 text-sm font-semibold transition-all active:scale-95",
                v.status === s
                  ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                  : "border-brand-100 bg-white text-ink-600 hover:border-brand-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {v.status === "有" && (
          <input
            type="text"
            value={v.detail ?? ""}
            onChange={(e) => set({ detail: e.target.value })}
            placeholder="年份与情况说明（如：2019 年确诊，已控制）"
            className="input-base text-sm animate-fade-up"
          />
        )}
      </div>
    );
  }

  /* ---------- number ---------- */
  if (question.type === "number") {
    return (
      <input
        type="number"
        value={typeof value === "number" || typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        placeholder={question.placeholder || "请输入"}
        className="input-base"
      />
    );
  }

  /* ---------- textarea ---------- */
  if (question.type === "textarea") {
    return (
      <textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || "请输入"}
        rows={3}
        className="input-base resize-none text-sm"
      />
    );
  }

  /* ---------- text ---------- */
  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder || "请输入"}
      className="input-base"
    />
  );
}
