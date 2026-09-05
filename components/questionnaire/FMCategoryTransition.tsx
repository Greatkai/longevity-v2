"use client";

import { ArrowRight, Microscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { FM_IMBALANCES } from "@/lib/functional-survey/questions";
import type { FMStage1Score, FMSelection } from "@/lib/functional-survey/types";

interface Props {
  stage1: Record<string, FMStage1Score>;
  selection: FMSelection;
  onContinue: () => void;
}

/** Stage1 → Stage2 过渡页：揭晓七大失衡类别阳性率与入选类别 */
export function FMCategoryTransition({ stage1, selection, onContinue }: Props) {
  const selectedSet = new Set(selection.selected);
  return (
    <div className="space-y-5 animate-fade-up">
      <div className="card card-accent p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 text-white shadow-lg">
            <Microscope className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">七大失衡类别评估结果</h2>
            <p className="text-sm text-ink-600">
              根据您的总体评估，以下 {selection.selected.length} 个类别将进入专项详查（阳性率 ≥ {selection.threshold}%）
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {selection.ranked.map((item) => {
            const im = FM_IMBALANCES[item.cat];
            const selected = selectedSet.has(item.cat);
            const rate = Math.min(100, Math.max(0, item.rate));
            const high = item.rate >= 30;
            return (
              <div
                key={item.cat}
                className={cn(
                  "rounded-xl border-2 p-4 transition-all",
                  selected
                    ? "border-teal-400 bg-teal-50/60 shadow-sm"
                    : "border-brand-100 bg-white"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{im.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-ink-900">
                        {im.name}
                        {selected && (
                          <span className="ml-2 rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            专项详查
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-400">{im.description}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-lg font-bold tabular-nums",
                      high ? "text-orange-600" : "text-ink-400"
                    )}
                  >
                    {item.rate}%
                  </span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-brand-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      high
                        ? "bg-gradient-to-r from-orange-400 to-red-400"
                        : "bg-gradient-to-r from-brand-400 to-brand-300"
                    )}
                    style={{ width: `${Math.max(3, rate)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={onContinue} className="btn-primary px-8 py-3">
          开始专项详查
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
