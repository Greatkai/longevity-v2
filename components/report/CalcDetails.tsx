"use client";

import { useState } from "react";
import {
  ChevronDown,
  Calculator,
  FunctionSquare,
  TestTube,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssessmentResult } from "@/lib/chli-model";
import { SUB_BY_DIMENSION } from "@/lib/chli-model/sub-indicators";
import { LAB_CHECKLIST } from "@/lib/chli-model/sub-indicators";
import { useAssessment } from "@/store/assessment-store";

interface Props {
  result: AssessmentResult;
}

const DIM_LABELS: Record<string, string> = {
  B: "生物年龄指数",
  F: "功能健康指数",
  M: "代谢与慢病风险指数",
  L: "生活方式与行为指数",
  P: "心理认知与社交参与指数",
  D: "数字健康轨迹指数",
};

/** 检验项到 available 路径的映射 */
const LAB_AVAILABLE_PATHS: Record<string, string> = {
  B2: "bio.epigeneticAge.available",
  B3: "bio.inflammation.available",
  M1: "metabolic.hba1c.available",
  M2: "metabolic.ldl.available",
  M5: "metabolic.liverKidney.available",
  F2: "functional.gaitSpeed.available",
  F3: "functional.gripStrength.available",
  F4: "functional.balance.available",
  F5: "functional.cognitiveTest.available",
  D3: "digital.improvingTrend.available",
};

export function CalcDetails({ result }: Props) {
  const [open, setOpen] = useState(false);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const { data } = useAssessment();

  /**
   * 读取用户是否勾选了某检验项。
   * 优先使用报告自身保存的 sourceData（查看既往报告时），
   * 其次使用当前会话 data（刚评估完的场景）。
   */
  const sourceData = (result as unknown as { sourceData?: Record<string, unknown> })
    ?.sourceData;
  const effectiveData =
    sourceData && Object.keys(sourceData).length > 0
      ? (sourceData as unknown as Record<string, unknown>)
      : (data as unknown as Record<string, unknown>);

  const hasLab = (subKey: string): boolean => {
    const p = LAB_AVAILABLE_PATHS[subKey];
    if (!p) return false;
    const keys = p.split(".");
    let cur: Record<string, unknown> = effectiveData;
    for (const k of keys) {
      if (cur == null) return false;
      cur = cur[k] as Record<string, unknown>;
    }
    const val = cur as unknown;
    return val === 1 || val === true;
  };

  /** 缺失的检验项（未勾选） */
  const missingLabs = LAB_CHECKLIST.filter((item) => !hasLab(item.subKey));
  const doneCount = LAB_CHECKLIST.length - missingLabs.length;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 transition-colors hover:bg-brand-50/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-md">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="font-bold text-ink-900">详细计算逻辑</div>
            <div className="text-xs text-ink-500">
              展开查看综合指数、各维度与检验项的计算方式
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-ink-400 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>

      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="space-y-6 border-t border-brand-100 px-6 py-6">
            {/* 综合公式 */}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-700">
                <FunctionSquare className="h-4 w-4" />
                综合指数公式
              </h4>
              <div className="rounded-xl bg-brand-50 p-4 font-mono text-sm leading-relaxed text-ink-700">
                CHLI = 0.20×B + 0.20×F + 0.20×M + 0.15×L + 0.10×P + 0.15×D
              </div>
              <div className="mt-2 text-xs text-ink-500">
                当前综合得分：<strong className="text-brand-700">{result.chliScore.toFixed(1)} 分</strong>
              </div>
            </div>

            {/* 各维度详细 */}
            {result.dimensions.map((dim) => {
              const subs = SUB_BY_DIMENSION[dim.key] || [];
              return (
                <div key={dim.key}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                      {dim.key}
                    </span>
                    <span className="text-sm font-bold text-ink-900">
                      {DIM_LABELS[dim.key] || dim.name}
                    </span>
                    <span className="text-xs text-ink-400">权重 {dim.weight * 100}%</span>
                    <span className="ml-auto text-lg font-bold text-brand-700">
                      {dim.score.toFixed(1)} 分
                    </span>
                  </div>

                  {subs.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-brand-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-brand-100 bg-brand-50/60 text-left text-xs text-ink-500">
                            <th className="px-4 py-2 font-semibold">二级指标</th>
                            <th className="px-4 py-2 text-center font-semibold">权重</th>
                            <th className="px-4 py-2 text-center font-semibold">得分</th>
                            <th className="px-4 py-2 text-center font-semibold">加权</th>
                            <th className="px-4 py-2 text-center font-semibold">评分规则</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subs.map((sub) => {
                            const subScore = dim.details[sub.key] ?? 0;
                            const weighted = subScore * sub.weight;
                            const expanded = expandedSub === sub.key;
                            return (
                              <>
                                <tr
                                  key={sub.key}
                                  className={cn(
                                    "border-b border-brand-50 last:border-0 cursor-pointer transition-colors hover:bg-brand-50/40",
                                    expanded && "bg-brand-50/60"
                                  )}
                                  onClick={() =>
                                    setExpandedSub(expanded ? null : sub.key)
                                  }
                                >
                                  <td className="px-4 py-2">
                                    <span className="text-xs font-semibold text-brand-600">
                                      {sub.key}
                                    </span>{" "}
                                    {sub.name}
                                    {sub.needsLab && (
                                      <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-700">
                                        需检查
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-center text-ink-500">
                                    {(sub.weight * 100).toFixed(0)}%
                                  </td>
                                  <td className="px-4 py-2 text-center font-semibold text-ink-900">
                                    {subScore.toFixed(0)}
                                  </td>
                                  <td className="px-4 py-2 text-center text-brand-700">
                                    {weighted.toFixed(1)}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <ChevronDown
                                      className={cn(
                                        "mx-auto h-4 w-4 text-ink-400 transition-transform duration-200",
                                        expanded && "rotate-180"
                                      )}
                                    />
                                  </td>
                                </tr>
                                {expanded && (
                                  <tr key={`${sub.key}-rule`} className="bg-brand-50/30">
                                    <td colSpan={5} className="px-4 py-3">
                                      <div className="flex items-start gap-2 text-xs leading-relaxed text-ink-600">
                                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                        <div>
                                          <span className="font-semibold text-ink-800">评分规则：</span>
                                          {sub.rule || sub.desc}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })}
                          <tr className="bg-brand-50/50">
                            <td className="px-4 py-2 font-semibold text-ink-900">加权合计</td>
                            <td className="px-4 py-2 text-center text-ink-500">100%</td>
                            <td className="px-4 py-2 text-center text-ink-400">—</td>
                            <td className="px-4 py-2 text-center font-bold text-brand-700">
                              {dim.score.toFixed(1)}
                            </td>
                            <td className="px-4 py-2" />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 推荐完善检查 */}
            <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/70 to-white p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-700">
                <TestTube className="h-4 w-4" />
                推荐完善检查
              </h4>
              <p className="mb-4 text-xs leading-relaxed text-ink-600">
                您已提供 <strong className="text-brand-700">{doneCount}/{LAB_CHECKLIST.length}</strong> 项检验检查数据。
                {missingLabs.length > 0
                  ? "以下项目补充检验数据，可让评估结果更精准："
                  : "所有检验项目已完善，评估结果已达最高精准度。"}
              </p>

              {missingLabs.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {missingLabs.map((item) => (
                    <div
                      key={item.subKey}
                      className="flex items-start gap-2.5 rounded-lg border border-brand-100 bg-white p-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                          {item.name}
                          <span className="rounded bg-brand-100 px-1 py-0.5 text-[10px] font-medium text-brand-700">
                            {item.dimension} 维度
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-ink-400">{item.tests}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  您的检验数据已齐全，评估结果精准可靠。
                </div>
              )}
            </div>

            {/* 说明 */}
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
              <strong>说明：</strong>各维度得分由若干二级指标按权重加权计算（二级指标满分 100 分）。
              需检验的二级指标若未提供检查数据，则采用科学估算替代值，因此与实际体检结果可能存在差异。
              点击每行右侧箭头可查看具体评分规则。本计算结果仅供参考，不构成医疗诊断建议。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
