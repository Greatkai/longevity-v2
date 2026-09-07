"use client";

import {
  ArrowRight,
  Save,
  Clock,
  FlaskConical,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DIMENSIONS } from "@/lib/questionnaire-data";

interface Props {
  onStart: () => void;
  /** 是否已登录（决定暂存提示文案） */
  loggedIn: boolean;
}

/** 评估说明页：介绍长寿指数构成、评估深度差异与暂存功能 */
export function IntroPanel({ onStart, loggedIn }: Props) {
  return (
    <div className="space-y-6">
      {/* 什么是长寿指数 */}
      <div className="card card-accent overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-white p-6">
          <h2 className="text-xl font-bold text-ink-900">
            长寿指数由什么组成？
          </h2>
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

      {/* 简单版 vs 详查版 */}
      <div className="card overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-r from-teal-50/80 to-white p-6">
          <h2 className="text-xl font-bold text-ink-900">简单版 vs 详查版，怎么选？</h2>
          <p className="mt-1 text-sm text-ink-600">
            运动、睡眠、饮食、烟酒等主题，长寿问卷中已有简单题目；想更深入了解，可切换为功能医学详查版。
          </p>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-brand-100 bg-white p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-bold text-ink-900">简单版</p>
                <p className="text-[11px] text-ink-400">快速筛查 · 每主题 1~2 题</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-600">
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                适合快速了解整体健康状况，用时短
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                采用自评打分，结果反映主观感受
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                全部简单版约 <strong className="text-brand-700">7 分钟</strong> 完成
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-teal-300 bg-gradient-to-br from-teal-50/60 to-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
                <FlaskConical className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-bold text-ink-900">
                  详查版
                  <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                    标准量表 · 更准
                  </span>
                </p>
                <p className="text-[11px] text-ink-400">专业评估 · 每主题 3~27 题</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-600">
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                题目来自<strong className="text-teal-700">《功能医学思路》标准量表</strong>
                ，覆盖更全面、定位更精确
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                饮食为 27 项食物频率调查，客观量化而非主观打分
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                额外获得：失衡评分 + 个性化干预建议 + 可下载的问卷明细（供专业人员参考）
              </li>
              <li className="flex gap-1.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                用时更长：全部详查约 <strong className="text-teal-700">40~50 分钟</strong>
                ，可分多次填写（支持暂存）
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-6 mb-6 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          评估深度按主题独立选择——可以只对最关心的主题（如饮食）用详查版，其余保持简单版，在准确度与用时之间自由平衡。
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

      {/* 开始按钮 */}
      <div className="flex justify-center pb-4">
        <button onClick={onStart} className="btn-primary px-10 py-3.5 text-base">
          我了解了，开始配置评估
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
