"use client";

import { cn } from "@/lib/utils";
import type { Question } from "@/lib/questionnaire-data";

interface Props {
  question: Question;
  value: number | null;
  onChange: (value: number | null) => void;
  /** lab 类型：是否有该检查 */
  available?: boolean;
  onAvailableChange?: (available: boolean) => void;
}

export function QuestionField({
  question,
  value,
  onChange,
  available,
  onAvailableChange,
}: Props) {
  // lab 类型：先选择是否有检查，有则输入数值
  if (question.type === "lab") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onAvailableChange?.(true)}
            className={cn(
              "rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all",
              available
                ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                : "border-brand-100 bg-white text-ink-600 hover:border-brand-300"
            )}
          >
            我有该检查报告
          </button>
          <button
            type="button"
            onClick={() => {
              onAvailableChange?.(false);
              onChange(null);
            }}
            className={cn(
              "rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all",
              !available
                ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                : "border-brand-100 bg-white text-ink-600 hover:border-brand-300"
            )}
          >
            我没有 / 不清楚
          </button>
        </div>

        {available && (
          <div className="relative animate-fade-up">
            <input
              type="number"
              min={question.min}
              max={question.max}
              step={question.step || 1}
              value={value ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onChange(v === "" ? null : parseFloat(v));
              }}
              placeholder="请输入检查结果数值"
              className="input-base pr-20"
            />
            {question.suffix && (
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400">
                {question.suffix}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (question.type === "radio") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {question.options?.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                  : "border-brand-100 bg-white text-ink-600 hover:border-brand-300"
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  active ? "border-brand-500 bg-brand-500" : "border-brand-200"
                )}
              >
                {active && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "range") {
    return (
      <div className="space-y-3">
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={question.step || 1}
          value={value ?? question.min ?? 0}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-brand-100 accent-brand-600"
        />
        <div className="flex justify-between text-xs text-ink-400">
          <span>{question.min}</span>
          <span className="text-lg font-bold text-brand-700">
            {value ?? question.min ?? 0}
          </span>
          <span>{question.max}</span>
        </div>
      </div>
    );
  }

  // number
  return (
    <div className="relative">
      <input
        type="number"
        min={question.min}
        max={question.max}
        step={question.step || 1}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : parseFloat(v));
        }}
        placeholder={question.min !== undefined ? `${question.min} - ${question.max}` : "请输入"}
        className="input-base pr-16"
      />
      {question.suffix && (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400">
          {question.suffix}
        </span>
      )}
    </div>
  );
}
