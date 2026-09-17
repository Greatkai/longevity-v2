"use client";

import { useMemo } from "react";
import { Check, Clock, Sparkles, Info, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIMENSIONS, QUESTIONS } from "@/lib/questionnaire-data";
import {
  TOPIC_META,
  estimateAssessment,
  isDetailed,
  type TopicId,
  type TopicMode,
} from "@/lib/functional-survey/config";
import type { AssessmentConfig } from "@/store/assessment-store";

interface Props {
  config: AssessmentConfig;
  onChange: (config: AssessmentConfig) => void;
  onStart: () => void;
}

/** CHLI 每维度题数与预估用时 */
const DIM_STATS = DIMENSIONS.map((d) => {
  const count = QUESTIONS.filter((q) => q.dimension === d.key).length;
  return { ...d, count, minutes: Math.max(1, Math.ceil(count * 0.25)) };
});

/** 三态选择器的选项文案 */
const MODE_LABEL: Record<TopicMode, string> = {
  simple: "简单版",
  detailed: "详查版",
  skip: "跳过",
};

/** 评估配置面板：按主题选择简单版/详查版/跳过 */
export function SetupPanel({ config, onChange, onStart }: Props) {
  const toggleDim = (key: string) => {
    const dims = config.chliDimensions.includes(key)
      ? config.chliDimensions.filter((k) => k !== key)
      : [...config.chliDimensions, key];
    if (dims.length === 0 && !isDetailed(config, "imbalance")) {
      // 全不选时至少要求保留一项评估
      const anyDetailed = TOPIC_META.some(
        (t) => t.id !== "imbalance" && isDetailed(config, t.id)
      );
      if (!anyDetailed) return;
    }
    onChange({ ...config, chliDimensions: dims });
  };

  const setTopic = (id: TopicId, mode: TopicMode) => {
    onChange({ ...config, topics: { ...config.topics, [id]: mode } });
  };

  const stats = useMemo(() => estimateAssessment(config), [config]);

  /** 简单版是否可用（依赖维度需被勾选） */
  const simpleAvailable = (requiresDims: string[]) =>
    requiresDims.some((d) => config.chliDimensions.includes(d));

  return (
    <div className="space-y-6">
      {/* 汇总条 */}
      <div className="card card-accent flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-brand-400 p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 opacity-90" />
          <div>
            <p className="text-sm opacity-80">本次评估配置</p>
            <p className="text-xl font-bold">
              {stats.moduleCount} 个模块 · 约 {stats.minutes} 分钟
            </p>
          </div>
        </div>
        <div className="text-right text-xs opacity-75">
          <p>共约 {stats.questions} 题</p>
          <p>详查版结果自动计入长寿指数，无需重复作答</p>
        </div>
      </div>

      {/* CHLI 六维 */}
      <div className="card overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-white p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-ink-900">第一步：选择评估维度</h2>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            CHLI 长寿指数的六大维度，可按需选择参与；未选维度不计入总分。
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {DIM_STATS.map((d) => {
            const active = config.chliDimensions.includes(d.key);
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDim(d.key)}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-[0.99]",
                  active
                    ? "border-brand-500 bg-brand-50 shadow-sm"
                    : "border-brand-100 bg-white hover:border-brand-300"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                    active ? "border-brand-500 bg-brand-500" : "border-brand-200"
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <d.icon className={cn("h-4 w-4", active ? "text-brand-600" : "text-ink-400")} />
                    <span className="text-sm font-semibold text-ink-900">
                      {d.key} · {d.title}
                    </span>
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                      {d.weight}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-500">{d.description}</span>
                  <span className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-400">
                    <Clock className="h-3 w-3" />
                    {d.count} 题 · 约 {d.minutes} 分钟
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 评估深度（主题式） */}
      <div className="card overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-r from-teal-50/80 to-white p-5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h2 className="text-lg font-bold text-ink-900">第二步：选择每个主题的评估深度</h2>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            运动睡眠饮食等主题在长寿问卷中已有简单题目；若想更深入，可切换为
            <strong className="text-teal-700">「功能医学详查版」</strong>
            ——填完后自动替代简单版结果，无需重复作答。
          </p>
        </div>

        <div className="space-y-3 p-5">
          {TOPIC_META.map((t) => {
            const mode: TopicMode = config.topics[t.id];
            const detailed = mode === "detailed";
            const simpleOk = t.simple ? simpleAvailable(t.simple.requiresDims) : false;
            return (
              <div
                key={t.id}
                className={cn(
                  "rounded-xl border-2 p-4 transition-all",
                  detailed
                    ? "border-teal-400 bg-teal-50/50 shadow-sm"
                    : mode === "skip"
                    ? "border-brand-100 bg-white"
                    : "border-brand-200 bg-brand-50/30"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* 左：主题介绍 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-sm font-bold text-ink-900">{t.title}</span>
                      {detailed && (
                        <span className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          详查版
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{t.description}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
                      {detailed ? (
                        <>
                          <Clock className="mr-1 inline h-3 w-3" />
                          {t.detailed.questionCount} · 约 {t.detailed.minutes} 分钟 · {t.detailed.desc}
                        </>
                      ) : mode === "simple" && t.simple ? (
                        <>
                          <Clock className="mr-1 inline h-3 w-3" />
                          {t.simple.questionCount} 题 · 约 {t.simple.minutes} 分钟 · {t.simple.desc}
                        </>
                      ) : (
                        "不提问，按默认中性值计分"
                      )}
                    </p>
                  </div>

                  {/* 右：三态切换 */}
                  <div className="flex shrink-0 gap-1 rounded-xl bg-brand-100/70 p-1">
                    {t.simple && (
                      <button
                        type="button"
                        disabled={!simpleOk}
                        onClick={() => setTopic(t.id, "simple")}
                        title={simpleOk ? "使用长寿问卷内置的简单题目" : "需先勾选对应维度"}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95",
                          mode === "simple"
                            ? "bg-white text-brand-700 shadow-sm"
                            : "text-ink-500 hover:text-ink-700",
                          !simpleOk && "cursor-not-allowed opacity-40"
                        )}
                      >
                        简单版
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setTopic(t.id, "detailed")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95",
                        detailed
                          ? "bg-teal-500 text-white shadow-sm"
                          : "text-ink-500 hover:text-ink-700"
                      )}
                    >
                      详查版
                    </button>
                    {t.skippable && (
                      <button
                        type="button"
                        onClick={() => setTopic(t.id, "skip")}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95",
                          mode === "skip"
                            ? "bg-white text-ink-600 shadow-sm"
                            : "text-ink-400 hover:text-ink-600"
                        )}
                      >
                        跳过
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-5 mb-5 space-y-2">
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              「基本信息」固定为评估的<strong>最后一步</strong>（不可跳过）。如需
              <strong>到线下就诊</strong>，请务必完整填写姓名、性别、年龄、身高体重与联系电话。
            </span>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            简单版题目在对应维度的问卷中出现；详查版为主题专项问卷，完成功能失衡评估后将获得个性化干预建议（饮食/营养/生活方式/检测）。
          </div>
        </div>
      </div>

      {/* 开始按钮 */}
      <div className="flex justify-center pb-4">
        <button
          onClick={onStart}
          disabled={config.chliDimensions.length === 0 && !TOPIC_META.some((t) => isDetailed(config, t.id))}
          className="btn-primary px-10 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkles className="h-5 w-5" />
          开始评估（约 {stats.minutes} 分钟）
        </button>
      </div>
    </div>
  );
}
