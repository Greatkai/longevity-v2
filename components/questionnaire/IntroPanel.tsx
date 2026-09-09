"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Save,
  Clock,
  FlaskConical,
  Zap,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DIMENSIONS } from "@/lib/questionnaire-data";
import {
  SIMPLE_PRESET,
  DETAILED_PRESET,
  estimateAssessment,
  type AssessmentConfig,
} from "@/lib/functional-survey/config";

export type IntroPreset = "simple" | "detailed" | "custom";

interface Props {
  loggedIn: boolean;
  /** 当前配置（自定义时由配置页管理） */
  config: AssessmentConfig;
  /** 当前选中的预设 */
  selected: IntroPreset;
  onSelect: (preset: IntroPreset) => void;
  /** 继续：simple/detailed 直接开始填写，custom 进入配置页 */
  onContinue: (preset: IntroPreset) => void;
}

/** 评估说明页：介绍长寿指数构成，并三选一选择评估模式 */
export function IntroPanel({ loggedIn, config, selected, onSelect, onContinue }: Props) {
  const stats = useMemo(() => estimateAssessment(config), [config]);

  return (
    <div className="space-y-6">
      {/* 什么是长寿指数 */}
      <div className="card card-accent overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-white p-6">
          <h2 className="text-xl font-bold text-ink-900">长寿指数由什么组成？</h2>
          <p className="mt-1 text-sm text-ink-600">
            综合长寿指数（CHLI）基于《百岁白皮书》长寿评估体系，由六大维度加权计算，满分 100 分。
          </p>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {DIMENSIONS.map((d) => {
            return (
              <div
                key={d.key}
                className="rounded-xl border border-brand-100 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                        d.color
                      )}
                    >
                      <d.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold text-ink-900">
                      {d.key} · {d.title}
                    </span>
                  </div>
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
                    {d.weight}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-500">{d.description}</p>
              </div>
            );
          })}
        </div>
        <div className="mx-6 mb-6 rounded-xl bg-brand-50/70 px-4 py-3 text-xs leading-relaxed text-brand-700">
          此外还有附加模块 <strong>FSHI 功能与感觉健康指数</strong>；若选择「功能失衡评估」详查版，
          七大功能医学失衡负荷还会作为独立指标计入生活方式维度（L6），让评估覆盖「结构 → 功能」两个层面。
        </div>
      </div>

      {/* 三选一：评估模式 */}
      <div className="card overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-r from-teal-50/80 to-white p-6">
          <h2 className="text-xl font-bold text-ink-900">选择评估模式</h2>
          <p className="mt-1 text-sm text-ink-600">
            运动、睡眠、饮食、烟酒等主题，简单版填 1~2 道题即可；详查版采用标准量表，更准但耗时更长。点击卡片即可切换，随时可改。
          </p>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3">
          {/* 快速版 */}
          <button
            type="button"
            onClick={() => onSelect("simple")}
            className={cn(
              "relative rounded-2xl border-2 p-5 text-left transition-all active:scale-[0.99]",
              selected === "simple"
                ? "border-brand-500 bg-brand-50/60 shadow-md"
                : "border-brand-100 bg-white hover:border-brand-300"
            )}
          >
            {selected === "simple" && (
              <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-bold text-ink-900">快速版</p>
                <p className="text-[11px] text-ink-400">简单版 · 每主题 1~2 题</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-600">
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                快速了解整体健康状况
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                自评打分，反映主观感受
              </li>
            </ul>
            <p className="mt-3 flex items-center gap-1 text-xs font-bold text-brand-700">
              <Clock className="h-3.5 w-3.5" />
              约 {estimateAssessment(SIMPLE_PRESET).minutes} 分钟
            </p>
          </button>

          {/* 专业版 */}
          <button
            type="button"
            onClick={() => onSelect("detailed")}
            className={cn(
              "relative rounded-2xl border-2 p-5 text-left transition-all active:scale-[0.99]",
              selected === "detailed"
                ? "border-teal-500 bg-teal-50/60 shadow-md"
                : "border-brand-100 bg-white hover:border-brand-300"
            )}
          >
            {selected === "detailed" && (
              <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white shadow-sm">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
                <FlaskConical className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-bold text-ink-900">
                  专业版
                  <span className="ml-1.5 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
                    标准量表 · 更准
                  </span>
                </p>
                <p className="text-[11px] text-ink-400">详查版 · 全量表评估</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-600">
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                《功能医学思路》标准量表，客观量化
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                额外获得失衡评分、干预建议与可下载明细
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                用时较长，可分多次填写（支持暂存）
              </li>
            </ul>
            <p className="mt-3 flex items-center gap-1 text-xs font-bold text-teal-700">
              <Clock className="h-3.5 w-3.5" />
              约 {estimateAssessment(DETAILED_PRESET).minutes} 分钟
            </p>
          </button>

          {/* 自定义 */}
          <button
            type="button"
            onClick={() => onSelect("custom")}
            className={cn(
              "relative rounded-2xl border-2 p-5 text-left transition-all active:scale-[0.99]",
              selected === "custom"
                ? "border-amber-500 bg-amber-50/60 shadow-md"
                : "border-brand-100 bg-white hover:border-brand-300"
            )}
          >
            {selected === "custom" && (
              <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <SlidersHorizontal className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-bold text-ink-900">自定义配置</p>
                <p className="text-[11px] text-ink-400">逐主题自由搭配</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-600">
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                每个主题独立选择简单版/详查版/跳过
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                适合只深入关心某几个主题（如饮食）
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                维度与用时自由平衡
              </li>
            </ul>
            <p className="mt-3 text-xs font-bold text-amber-700">下一步进入详细配置</p>
          </button>
        </div>
      </div>

      {/* 流程与暂存 */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
          <Save className="h-5 w-5 text-brand-600" />
          填写流程与暂存
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "配置模块", d: "选择维度与各主题的评估深度" },
            { n: "2", t: "分步填写", d: "按模块逐页填写，进度实时显示" },
            { n: "3", t: "生成报告", d: "获得长寿指数、失衡分析与建议" },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-brand-100 bg-brand-soft/50 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {s.n}
              </span>
              <p className="mt-2 text-sm font-bold text-ink-900">{s.t}</p>
              <p className="mt-1 text-xs text-ink-500">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-700">
          {loggedIn ? (
            <>
              ✅ 您已登录：填写进度<strong>每分钟自动暂存</strong>，也可随时点「暂存退出」。下次进入评估时会询问是否续填，
              「我的报告」页也能看到未完成的评估。
            </>
          ) : (
            <>
              💡 <strong>登录后可暂存进度</strong>
              ：详查版用时较长，建议先登录再填写——进度会自动保存在账号中，可分多次完成；未登录则需一次填完。
            </>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center pb-4">
        <button
          onClick={() => onContinue(selected)}
          className="btn-primary px-10 py-3.5 text-base"
        >
          {selected === "custom" ? (
            <>
              下一步：自定义配置
              <ArrowRight className="h-5 w-5" />
            </>
          ) : (
            <>
              开始评估（约 {stats.minutes} 分钟）
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
