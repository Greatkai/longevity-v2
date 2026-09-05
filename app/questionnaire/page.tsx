"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  ClipboardList,
  TestTube,
  FileSearch,
  User,
  Cigarette,
  UtensilsCrossed,
  Dumbbell,
  Moon,
  FileText,
  Thermometer,
  Compass,
  Microscope,
  Loader2,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DIMENSIONS,
  QUESTIONS,
  LAB_CHECKLIST,
} from "@/lib/questionnaire-data";
import { calculateCHLI } from "@/lib/chli-model";
import type { FunctionalSummary } from "@/lib/chli-model";
import { QuestionField } from "@/components/questionnaire/QuestionField";
import { AIFillPanel } from "@/components/questionnaire/AIFillPanel";
import { SetupPanel } from "@/components/questionnaire/SetupPanel";
import { FMQuestionField } from "@/components/questionnaire/FMQuestionField";
import { FMCategoryTransition } from "@/components/questionnaire/FMCategoryTransition";
import { useAssessment } from "@/store/assessment-store";
import {
  FM_SECTIONS,
  FM_STAGE1_SECTION,
  FM_IMBALANCES,
} from "@/lib/functional-survey/questions";
import {
  FM_LIFESTYLE_ORDER,
  FM_MODULE_SECTION,
  type FMModuleId,
} from "@/lib/functional-survey/config";
import {
  FM_OVERRIDDEN_L_QUESTIONS,
  deriveBasicsFromFM,
  deriveLifestyleFromFM,
  computeFunctionalLoad,
  summarizeCategories,
} from "@/lib/functional-survey/derive";
import { scoreStage1, selectCategories } from "@/lib/functional-survey/scoring";
import type { FMQuestion, FMCategories } from "@/lib/functional-survey/types";

/* ---------------- 步骤模型 ---------------- */

interface StepBase {
  key: string;
  label: string;
  icon: LucideIcon;
}
type Step =
  | (StepBase & { kind: "setup" })
  | (StepBase & { kind: "lab" })
  | (StepBase & { kind: "chli"; dimKey: string })
  | (StepBase & { kind: "fm-section"; sectionId: string })
  | (StepBase & { kind: "fm-stage1" })
  | (StepBase & { kind: "fm-transition" })
  | (StepBase & { kind: "fm-stage2"; category: FMCategories });

const FM_SECTION_META: Record<string, { label: string; icon: LucideIcon }> = {
  basic: { label: "基本信息", icon: User },
  habits: { label: "生活习惯", icon: Cigarette },
  diet: { label: "饮食调查", icon: UtensilsCrossed },
  exercise: { label: "运动", icon: Dumbbell },
  sleep: { label: "睡眠", icon: Moon },
  disease: { label: "既往史", icon: FileText },
  discomfort: { label: "症状", icon: Thermometer },
  overall: { label: "总体评估", icon: Compass },
};

export default function QuestionnairePage() {
  const router = useRouter();
  const {
    data,
    config,
    fmAnswers,
    fmStage1,
    setValue,
    setConfig,
    setFmAnswer,
    setFmStage1,
    setResult,
  } = useAssessment();
  const [step, setStep] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /** 由配置生成步骤序列（fmStage1 出结果后自动追加 Stage2 步骤） */
  const steps = useMemo<Step[]>(() => {
    const list: Step[] = [{ key: "setup", label: "配置", icon: Layers, kind: "setup" }];
    const dims = DIMENSIONS.filter((d) => config.chliDimensions.includes(d.key));
    if (dims.length > 0) {
      list.push({ key: "LAB", label: "检查", icon: FileSearch, kind: "lab" });
      dims.forEach((d) =>
        list.push({ key: d.key, label: d.key, icon: d.icon, kind: "chli", dimKey: d.key })
      );
    }
    for (const mid of FM_LIFESTYLE_ORDER) {
      if (config.fmModules.includes(mid)) {
        const sid = FM_MODULE_SECTION[mid];
        list.push({
          key: mid,
          label: FM_SECTION_META[sid]?.label ?? sid,
          icon: FM_SECTION_META[sid]?.icon ?? ClipboardList,
          kind: "fm-section",
          sectionId: sid,
        });
      }
    }
    if (config.fmModules.includes("fm_stage1")) {
      list.push({ key: "fm_stage1", label: "总体评估", icon: Compass, kind: "fm-stage1" });
      list.push({ key: "fm_transition", label: "评估结果", icon: Microscope, kind: "fm-transition" });
      const cats = fmStage1?.selection.selected ?? [];
      cats.forEach((cat) =>
        list.push({
          key: `fm_stage2_${cat}`,
          label: FM_IMBALANCES[cat].name,
          icon: Microscope,
          kind: "fm-stage2",
          category: cat,
        })
      );
    }
    return list;
  }, [config, fmStage1]);

  const current = steps[Math.min(step, steps.length - 1)];
  const progress = ((step + 1) / steps.length) * 100;
  const isLast = step >= steps.length - 1;
  const hasFm = config.fmModules.length > 0;

  /* ---------- CHLI 值读写 ---------- */
  const getRaw = (path: string): unknown => {
    const keys = path.split(".");
    let cur: Record<string, unknown> = data as unknown as Record<string, unknown>;
    for (const k of keys) {
      if (cur == null) return null;
      cur = cur[k] as Record<string, unknown>;
    }
    return cur;
  };
  const getValue = (path: string): number | null => {
    const v = getRaw(path);
    return typeof v === "number" ? v : null;
  };
  const getLabValue = (path: string) => {
    const labPath = path.replace(/\.value$/, "");
    const obj = getRaw(labPath) as { available?: boolean; value?: number | null } | null;
    return { available: !!obj?.available, value: obj?.value ?? null };
  };

  /** 检验项 available 路径映射 */
  const labAvailablePaths: Record<string, string> = {
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
  const checkActive = (subKey: string) => {
    const p = labAvailablePaths[subKey];
    return p ? getValue(p) === 1 : false;
  };
  const toggleLab = (subKey: string) => {
    const p = labAvailablePaths[subKey];
    if (!p) return;
    setValue(p, getValue(p) === 1 ? 0 : 1);
  };

  /** 当前 CHLI 维度题目（功能医学模块覆盖的题目自动跳过） */
  const getDimQuestions = (dimKey: string) => {
    const overridden = new Set<string>();
    if (dimKey === "L") {
      for (const mid of config.fmModules) {
        const sid = FM_MODULE_SECTION[mid];
        for (const qid of FM_OVERRIDDEN_L_QUESTIONS[sid] ?? []) overridden.add(qid);
      }
    }
    return QUESTIONS.filter((q) => q.dimension === dimKey && !overridden.has(q.id));
  };

  /* ---------- 导航 ---------- */
  const goNext = async () => {
    // Stage1 完成：先计算类别并追加 Stage2 步骤，不直接生成报告
    if (current.kind === "fm-stage1") {
      if (!fmStage1) {
        const stage1 = scoreStage1(fmAnswers);
        const selection = selectCategories(stage1);
        setFmStage1({ stage1, selection });
      }
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (isLast) {
      await handleGenerate();
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goPrev = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /** 离开过渡页后 Stage2 步骤已追加，需要按新 steps 索引推进 */
  const continueFromTransition = () => {
    // 当前过渡页之后的步骤会在 fmStage1 更新后自动出现
    window.scrollTo({ top: 0, behavior: "smooth" });
    goNextAfterRebuild();
  };
  const goNextAfterRebuild = () => {
    // steps 已通过 useMemo 依赖 fmStage1 更新；step+1 即第一个 Stage2 类别
    setStep((s) => s + 1);
  };

  /* ---------- 生成报告 ---------- */
  const handleGenerate = async () => {
    setSubmitting(true);
    try {
      // 1. 组装评估输入（功能医学数据反哺）
      const input = structuredClone(data) as typeof data;
      const fmSectionIds = config.fmModules
        .map((m) => FM_MODULE_SECTION[m])
        .filter((s) => s !== "overall" && s !== "stage2");

      if (config.fmModules.includes("fm_basic")) {
        const basics = deriveBasicsFromFM(fmAnswers);
        if (basics.gender) (input as unknown as Record<string, unknown>).gender = basics.gender;
        if (basics.actualAge) input.bio.actualAge = basics.actualAge;
        if (basics.bmi) input.metabolic.bmi = basics.bmi;
      }
      const lifestyleSections = ["habits", "diet", "exercise", "sleep"].filter((s) =>
        fmSectionIds.includes(s)
      );
      const derived = deriveLifestyleFromFM(fmAnswers, lifestyleSections);
      if (derived.weeklyExercise !== undefined) input.lifestyle.weeklyExercise = derived.weeklyExercise;
      if (derived.sleepHours !== undefined) input.lifestyle.sleepHours = derived.sleepHours;
      if (derived.sleepQuality !== undefined) input.lifestyle.sleepQuality = derived.sleepQuality;
      if (derived.diet !== undefined) input.lifestyle.diet = derived.diet;
      if (derived.smoking !== undefined) input.lifestyle.smoking = derived.smoking;
      if (derived.alcohol !== undefined) input.lifestyle.alcohol = derived.alcohol;

      // 2. 功能失衡负荷计入 L6
      let functional: FunctionalSummary | null = null;
      if (hasFm) {
        // 客户端先算一次负荷（服务端提交后再以服务端结果为准）
        const { computeImbalances } = await import("@/lib/functional-survey/scoring");
        const imbalances = computeImbalances(fmAnswers);
        const loadRate = computeFunctionalLoad(imbalances);
        input.lifestyle.functionalLoad = loadRate;

        // 3. 计算报告（先拿到 reportCode 用于关联保存）
        const result = calculateCHLI(input, {
          enabledDimensions: config.chliDimensions,
        });

        // 4. 提交问卷（服务端评分 + 复测关联 + 落库）
        const res = await fetch("/api/functional-survey/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: fmAnswers,
            name: typeof fmAnswers.basic_name === "string" ? fmAnswers.basic_name : null,
            phone: typeof fmAnswers.basic_phone === "string" ? fmAnswers.basic_phone : null,
            reportCode: result.reportCode,
          }),
        });
        const submitted = await res.json();

        if (res.ok) {
          const serverIm = submitted.imbalances;
          functional = {
            included: true,
            loadRate: computeFunctionalLoad(serverIm),
            categories: summarizeCategories(serverIm),
            mainProblems: submitted.mainProblems ?? [],
            interventions: summarizeCategories(serverIm)
              .filter((c) => c.selected)
              .map((c) => ({
                cat: c.cat,
                name: c.name,
                icon: c.icon,
                ...FM_IMBALANCES[c.cat as FMCategories].intervention,
              })),
            retest: submitted.diff
              ? {
                  isRetest: true,
                  stats: submitted.diff.stats,
                  byCategory: submitted.diff.byCategory,
                  highlights: Object.entries(submitted.diff.byQuestion as Record<string, { old: string; new: string; status: string }>)
                    .slice(0, 12)
                    .map(([qid, v]) => ({
                      qid,
                      text: FM_SECTIONS.flatMap((s) => s.questions).find((q) => q.qid === qid)?.text ?? qid,
                      status: v.status,
                      old: v.old,
                      new: v.new,
                    })),
                }
              : null,
          };
        }
        result.functional = functional;
        setResult(result);
        router.push("/report");
        return;
      }

      // 5. 纯 CHLI 评估
      const result = calculateCHLI(input, {
        enabledDimensions: config.chliDimensions,
      });
      setResult(result);
      router.push("/report");
    } catch (e) {
      console.error("生成报告失败:", e);
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- 渲染 ---------- */
  return (
    <div className="relative min-h-screen bg-brand-soft pt-16">
      <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-50" />
      <div className="container-page relative py-10">
        {/* 头部 */}
        <div className="mx-auto max-w-4xl text-center">
          <span className="section-tag">
            <Sparkles className="h-3.5 w-3.5" />
            长寿指数评估
          </span>
          <h1 className="mt-4 text-3xl font-bold text-ink-900 md:text-4xl">
            {current.kind === "setup" ? (
              <>选择您的<span className="text-gradient">评估模块</span></>
            ) : (
              <>健康评估<span className="text-gradient">问卷</span></>
            )}
          </h1>
          <p className="mt-3 text-ink-600">
            {current.kind === "setup"
              ? "按需选择评估模块，查看各模块介绍与预估用时；后续可随时调整"
              : "完成各模块填写，或使用 AI 智能填写快速录入"}
          </p>
        </div>

        {/* 配置步骤不显示进度条 */}
        {current.kind !== "setup" && (
          <div className="mx-auto mt-10 max-w-4xl">
            <div className="flex items-center justify-between text-sm">
              <span className="rounded-full bg-brand-100 px-3 py-1 font-semibold text-brand-700">
                第 {step} / {steps.length - 1} 步
              </span>
              <span className="font-semibold text-brand-600">{Math.round(progress)}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-brand-100 shadow-inner">
              <div
                className="h-full rounded-full bg-brand-gradient shadow-md transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 步骤指示器 */}
            <div className="mt-7 grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-8">
              {steps.slice(1).map((s, i) => {
                const idx = i + 1;
                const active = idx === step;
                const done = idx < step;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStep(idx)}
                    className={cn(
                      "group flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 transition-all duration-300",
                      active
                        ? "border-brand-500 bg-gradient-to-br from-brand-50 to-white text-brand-700 shadow-soft"
                        : done
                        ? "border-brand-200 bg-white text-brand-600 hover:border-brand-300 hover:shadow-sm"
                        : "border-brand-100 bg-white text-ink-400 hover:border-brand-200 hover:text-ink-600"
                    )}
                  >
                    <s.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    <span className="max-w-full truncate px-1 text-xs font-medium">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 内容区 */}
        <div className="mx-auto mt-8 max-w-4xl">
          {current.kind !== "setup" && (
            <div className="mb-5 flex justify-end">
              <button
                onClick={() => setShowAI(!showAI)}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:brightness-105 active:scale-95"
              >
                <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                {showAI ? "收起 AI 填写" : "AI 智能填写"}
              </button>
            </div>
          )}

          {showAI && current.kind !== "setup" && (
            <div className="mb-8 animate-fade-in">
              <AIFillPanel onFilled={() => {}} />
            </div>
          )}

          {current.kind === "setup" && (
            <SetupPanel
              config={config}
              onChange={(c) => {
                // 保存新配置；配置变化后重置 Stage1 结果，避免类别选择过期
                setConfig(c);
                setFmStage1(null);
              }}
              onStart={() => {
                setStep(1);
                window.scrollTo({ top: 0 });
              }}
            />
          )}

          {current.kind === "lab" && (
            <div className="card card-accent animate-fade-up overflow-hidden">
              <div className="flex items-center gap-4 border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-white p-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-lg">
                  <TestTube className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      检验检查
                    </span>
                    <h2 className="text-xl font-bold text-ink-900">您手头有哪些检查报告？</h2>
                  </div>
                  <p className="mt-1 text-sm text-ink-600">
                    选择您已有的检验/检查项目，有检验数据将获得更精确的评估；没有的项目我们将用科学估算替代。
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-6 sm:grid-cols-2 md:p-8">
                {LAB_CHECKLIST.filter((item) =>
                  QUESTIONS.some((q) => q.dimension === item.dimension && config.chliDimensions.includes(item.dimension))
                ).map((item) => {
                  const active = checkActive(item.subKey);
                  return (
                    <button
                      key={item.subKey}
                      type="button"
                      onClick={() => toggleLab(item.subKey)}
                      className={cn(
                        "group flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
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
                      <span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink-900">{item.name}</span>
                          {item.recommended && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                              推荐
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-400">{item.desc}</span>
                        <span className="mt-0.5 block text-[11px] text-brand-600">{item.tests}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {current.kind === "chli" && (
            <ChliDimCard
              dimKey={current.dimKey}
              questions={getDimQuestions(current.dimKey)}
              getValue={getValue}
              getLabValue={getLabValue}
              setValue={setValue}
            />
          )}

          {(current.kind === "fm-section" || current.kind === "fm-stage1") && (
            <FmSectionCard
              sectionId={current.kind === "fm-stage1" ? "overall" : current.sectionId}
              answers={fmAnswers}
              onAnswer={setFmAnswer}
            />
          )}

          {current.kind === "fm-transition" && fmStage1 && (
            <FMCategoryTransition
              stage1={fmStage1.stage1}
              selection={fmStage1.selection}
              onContinue={continueFromTransition}
            />
          )}
          {current.kind === "fm-transition" && !fmStage1 && (
            <TransitionLoader />
          )}

          {current.kind === "fm-stage2" && (
            <FmSectionCard
              sectionId={categoryToSection(current.category)}
              answers={fmAnswers}
              onAnswer={setFmAnswer}
              categoryLabel={FM_IMBALANCES[current.category].name}
              categoryIcon={FM_IMBALANCES[current.category].icon}
            />
          )}

          {/* 导航按钮 */}
          {current.kind !== "setup" && current.kind !== "fm-transition" && (
            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                onClick={goPrev}
                disabled={step === 0 || submitting}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-5 w-5" />
                上一步
              </button>

              <div className="flex items-center gap-4">
                <Link href="/" className="text-sm text-ink-400 hover:text-brand-600">
                  取消
                </Link>
                <button onClick={goNext} disabled={submitting} className="btn-primary disabled:opacity-60">
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      正在生成报告…
                    </>
                  ) : isLast ? (
                    <>
                      <ClipboardList className="h-5 w-5" />
                      生成评估报告
                    </>
                  ) : (
                    <>
                      下一步
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 返回配置 */}
          {current.kind === "setup" && (
            <div className="mt-6 flex justify-center">
              <Link href="/" className="text-sm text-ink-400 hover:text-brand-600">
                返回首页
              </Link>
            </div>
          )}

          {/* 完成提示 */}
          {isLast && current.kind !== "setup" && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              恭喜完成所有填写！点击「生成评估报告」即可查看您的长寿指数分析
              {hasFm ? "与功能失衡干预建议" : ""}。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 失衡类别 -> stage2 章节 id（ch4~ch10） */
function categoryToSection(cat: FMCategories): string {
  const map: Record<FMCategories, string> = {
    absorption: "ch4",
    detox: "ch5",
    defense: "ch6",
    communication: "ch7",
    transport: "ch8",
    energy: "ch9",
    structure: "ch10",
  };
  return map[cat];
}

/** 过渡页加载中 */
function TransitionLoader() {
  return (
    <div className="card flex items-center justify-center gap-3 p-12 text-ink-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      正在评估失衡类别…
    </div>
  );
}

/** CHLI 维度卡片（沿用原有视觉） */
function ChliDimCard({
  dimKey,
  questions,
  getValue,
  getLabValue,
  setValue,
}: {
  dimKey: string;
  questions: typeof QUESTIONS;
  getValue: (path: string) => number | null;
  getLabValue: (path: string) => { available: boolean; value: number | null };
  setValue: (path: string, value: number | null) => void;
}) {
  const dim = DIMENSIONS.find((d) => d.key === dimKey)!;
  return (
    <div key={dimKey} className="card card-accent animate-fade-up overflow-hidden">
      <div className="flex items-center gap-4 border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-white p-6">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${dim.color} text-white shadow-lg`}
        >
          <dim.icon className="h-8 w-8" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              {dim.key}
            </span>
            <h2 className="text-xl font-bold text-ink-900">{dim.title}</h2>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            {dim.name} · 权重 {dim.weight}
          </p>
        </div>
      </div>

      <div className="space-y-8 p-6 md:p-8">
        {questions.map((q) =>
          q.type === "lab" ? (
            <div key={q.id}>
              <div className="mb-3">
                <label className="text-base font-semibold text-ink-900">{q.label}</label>
                {q.hint && <p className="mt-0.5 text-xs text-ink-400">{q.hint}</p>}
              </div>
              <QuestionField
                question={q}
                value={getLabValue(q.path).value}
                available={getLabValue(q.path).available}
                onAvailableChange={(av) =>
                  setValue(q.path.replace(/\.value$/, ".available"), av ? 1 : 0)
                }
                onChange={(v) => setValue(q.path, v)}
              />
            </div>
          ) : (
            <div key={q.id}>
              <div className="mb-3">
                <label className="text-base font-semibold text-ink-900">{q.label}</label>
                {q.hint && <p className="mt-0.5 text-xs text-ink-400">{q.hint}</p>}
              </div>
              <QuestionField
                question={q}
                value={getValue(q.path)}
                onChange={(v) => setValue(q.path, v)}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

/** 功能医学问卷章节卡片 */
function FmSectionCard({
  sectionId,
  answers,
  onAnswer,
  categoryLabel,
  categoryIcon,
}: {
  sectionId: string;
  answers: Record<string, unknown>;
  onAnswer: (qid: string, value: unknown) => void;
  categoryLabel?: string;
  categoryIcon?: string;
}) {
  const section = FM_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;
  return (
    <div key={sectionId} className="card card-accent animate-fade-up overflow-hidden">
      <div className="flex items-center gap-4 border-b border-brand-100 bg-gradient-to-r from-teal-50/80 to-white p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 text-2xl text-white shadow-lg">
          {categoryIcon ?? FM_SECTION_META[sectionId]?.label.slice(0, 1) ?? "🌿"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              功能医学
            </span>
            <h2 className="text-xl font-bold text-ink-900">
              {categoryLabel ?? section.title}
            </h2>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            {categoryLabel ? section.title : section.subtitle}
            {section.questions.length > 0 && ` · ${section.questions.length} 题`}
          </p>
        </div>
      </div>

      <div className="space-y-8 p-6 md:p-8">
        {section.questions.map((q: FMQuestion, i: number) => (
          <div key={q.qid}>
            <div className="mb-3">
              <label className="flex items-start gap-2 text-base font-semibold text-ink-900">
                <span className="mt-0.5 shrink-0 text-xs font-bold text-brand-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {q.text}
                {q.optional && (
                  <span className="mt-0.5 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-normal text-ink-400">
                    选填
                  </span>
                )}
              </label>
            </div>
            <FMQuestionField question={q} value={answers[q.qid]} onChange={(v) => onAnswer(q.qid, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
