import type {
  FMQuestionData,
  FMSection,
  FMQuestion,
  FMCategories,
  FMImbalance,
} from "./types";
import rawData from "./questions.json";

/**
 * 功能医学问卷数据模块
 * 数据来自 health-survey-v2 的 questions.json（含表13-1映射与7大失衡干预方案）
 */

export const FM_DATA = rawData as unknown as FMQuestionData;

export const FM_METADATA = FM_DATA.metadata;

/** 全部章节 */
export const FM_SECTIONS: FMSection[] = FM_DATA.sections;

/** 生活方式调查章节（info + lifestyle） */
export const FM_LIFESTYLE_SECTIONS = FM_SECTIONS.filter(
  (s) => s.stage === "info" || s.stage === "lifestyle"
);

/** Stage1 总体评估章节 */
export const FM_STAGE1_SECTION: FMSection = FM_SECTIONS.find(
  (s) => s.stage === "stage1"
)!;

/** Stage2 专项章节（7 个失衡类别） */
export const FM_STAGE2_SECTIONS = FM_SECTIONS.filter((s) => s.stage === "stage2");

/** 7 大失衡类别定义 */
export const FM_IMBALANCES: Record<FMCategories, FMImbalance> = FM_DATA.imbalances;

/** 失衡类别 key 顺序 */
export const FM_CATEGORY_KEYS = Object.keys(FM_DATA.imbalances) as FMCategories[];

/** 全部题目 */
export const FM_ALL_QUESTIONS: FMQuestion[] = FM_SECTIONS.flatMap(
  (s) => s.questions
);

/** 按 qid 索引题目 */
export const FM_QUESTION_BY_ID: Record<string, FMQuestion> =
  FM_ALL_QUESTIONS.reduce<Record<string, FMQuestion>>((acc, q) => {
    acc[q.qid] = q;
    return acc;
  }, {});

/** 各章节题目数（用于预估用时与介绍） */
export const FM_SECTION_SIZES: Record<string, number> = FM_SECTIONS.reduce<
  Record<string, number>
>((acc, s) => {
  acc[s.id] = s.questions.length;
  return acc;
}, {});

/**
 * 问卷模块预估用时（分钟）——按题量估算
 * 简单单选约 12 秒/题，foodfreq 三段控件约 20 秒/题，diseasehist 约 25 秒/题
 */
export const FM_SECTION_MINUTES: Record<string, number> = FM_SECTIONS.reduce<
  Record<string, number>
>((acc, s) => {
  let seconds = 0;
  for (const q of s.questions) {
    if (q.type === "foodfreq") seconds += 20;
    else if (q.type === "diseasehist") seconds += 25;
    else if (q.type === "textarea") seconds += 45;
    else seconds += 12;
  }
  acc[s.id] = Math.max(1, Math.round(seconds / 60));
  return acc;
}, {});

/** 失衡类别显示名（含图标） */
export function fmImbalanceLabel(cat: FMCategories): string {
  const im = FM_IMBALANCES[cat];
  return `${im.icon} ${im.name}`;
}
