import type { FMAnswers, FMCategories, FMScoreResult } from "./types";
import { FM_CATEGORY_KEYS } from "./questions";

/**
 * 功能医学问卷 → CHLI 评估的映射
 * - 生活方式调查数据反哺 CHLI 生活方式二级指标（L1~L4），避免重复作答
 * - 基本信息自动带入年龄/性别/BMI
 * - 七大失衡类别综合分映射为「功能失衡负荷」参与 L 维度计算
 */

/* ---------------- 基本信息映射 ---------------- */

/** 从 FM 基本信息推导 CHLI 通用输入（gender/actualAge/bmi） */
export function deriveBasicsFromFM(answers: FMAnswers): {
  gender?: "male" | "female";
  actualAge?: number;
  bmi?: number;
  name?: string;
  phone?: string;
} {
  const out: {
    gender?: "male" | "female";
    actualAge?: number;
    bmi?: number;
    name?: string;
    phone?: string;
  } = {};
  if (answers.basic_gender === "男") out.gender = "male";
  else if (answers.basic_gender === "女") out.gender = "female";
  const age = Number(answers.basic_age);
  if (Number.isFinite(age) && age > 0) out.actualAge = age;
  const h = Number(answers.basic_height);
  const w = Number(answers.basic_weight);
  if (Number.isFinite(h) && h > 50 && Number.isFinite(w) && w > 20) {
    out.bmi = Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
  }
  if (typeof answers.basic_name === "string" && answers.basic_name) out.name = answers.basic_name;
  if (typeof answers.basic_phone === "string" && answers.basic_phone) out.phone = answers.basic_phone;
  return out;
}

/* ---------------- 生活方式映射 ---------------- */

const EX_FREQ_MAP: Record<string, number> = {
  "从不或偶尔": 0,
  "每周1次": 1,
  "每周2-4次": 3,
  "每周5次以上": 5,
};

const SLEEP_DURATION_MAP: Record<string, number> = {
  "大于8小时": 9,
  "6-8小时": 7.5,
  "4-6小时": 5,
  "少于4小时": 4,
};

const SLEEP_QUALITY_MAP: Record<string, number> = {
  "很好，入睡快、睡得沉": 5,
  "一般，偶尔失眠或多梦": 3,
  "较差，经常入睡困难或早醒": 2,
  "很差，长期失眠": 1,
};

const SMOKE_MAP: Record<string, number> = {
  不吸烟: 0,
  "已戒烟（1年以上）": 1,
  "已戒烟（不满1年）": 1,
  偶尔吸烟: 2,
  "每天5-10支": 3,
  "每天10-20支": 3,
  "每天21支以上": 3,
};

const ALCOHOL_MAP: Record<string, number> = {
  不饮酒: 0,
  偶尔饮酒: 1,
  "经常饮酒（每周2次及以上）": 2,
  每天饮酒: 2,
};

/** 由食物频率答案计算饮食质量分（0-10） */
export function deriveDietScore(answers: FMAnswers): number | null {
  const freqOf = (qid: string): string => {
    const v = answers[qid];
    return v && typeof v === "object" && !Array.isArray(v) && "freq" in v && v.freq
      ? String(v.freq)
      : "";
  };
  const rare = (f: string) => f === "不吃" || f === "每月";
  const often = (f: string) => f === "每天" || f === "每周";
  if (!freqOf("diet_rice") && !freqOf("diet_veg")) return null; // 未作答

  let score = 10;
  if (rare(freqOf("diet_veg")) || rare(freqOf("diet_fruit"))) score -= 1.5;
  if (rare(freqOf("diet_wholegrain")) && rare(freqOf("diet_tuber"))) score -= 1;
  if (often(freqOf("diet_fat_meat")) || often(freqOf("diet_offal"))) score -= 1;
  if (rare(freqOf("diet_seafood")) && rare(freqOf("diet_seaweed"))) score -= 0.5;
  if (rare(freqOf("diet_milk")) && rare(freqOf("diet_soy"))) score -= 0.5;
  const junk = ["diet_sweets", "diet_drink", "diet_processed", "diet_fried", "diet_fastfood"];
  if (junk.some((k) => often(freqOf(k)))) score -= 1.5;
  if (often(freqOf("diet_pickle"))) score -= 0.5;
  if (often(freqOf("diet_eating_out"))) score -= 1;
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

/** CHLI LifestyleInput 中被 FM 模块覆盖的字段 */
export interface FMDerivedLifestyle {
  weeklyExercise?: number;
  sleepHours?: number;
  sleepQuality?: number;
  diet?: number;
  smoking?: number;
  alcohol?: number;
}

/** 从 FM 生活方式答案推导 CHLI 生活方式输入（仅覆盖对应模块被选中的部分） */
export function deriveLifestyleFromFM(
  answers: FMAnswers,
  selectedSections: string[]
): FMDerivedLifestyle {
  const out: FMDerivedLifestyle = {};
  const has = (id: string) => selectedSections.includes(id);
  if (has("exercise") && answers.ex_freq && String(answers.ex_freq) in EX_FREQ_MAP) {
    out.weeklyExercise = EX_FREQ_MAP[String(answers.ex_freq)];
  }
  if (has("sleep")) {
    const d = String(answers.sleep_duration ?? "");
    const q = String(answers.sleep_quality ?? "");
    if (d in SLEEP_DURATION_MAP) out.sleepHours = SLEEP_DURATION_MAP[d];
    if (q in SLEEP_QUALITY_MAP) out.sleepQuality = SLEEP_QUALITY_MAP[q];
  }
  if (has("diet")) {
    const score = deriveDietScore(answers);
    if (score !== null) out.diet = score;
  }
  if (has("habits")) {
    const s = String(answers.hab_smoke ?? "");
    const a = String(answers.hab_alcohol ?? "");
    if (s in SMOKE_MAP) out.smoking = SMOKE_MAP[s];
    if (a in ALCOHOL_MAP) out.alcohol = ALCOHOL_MAP[a];
  }
  return out;
}

/** FM 章节中被覆盖的 CHLI L 维度题目 id（用于问卷跳题） */
export const FM_OVERRIDDEN_L_QUESTIONS: Record<string, string[]> = {
  habits: ["smoking", "alcohol"],
  diet: ["diet"],
  exercise: ["weeklyExercise"],
  sleep: ["sleepHours", "sleepQuality"],
};

/* ---------------- 失衡负荷映射 ---------------- */

/** 七大失衡类别综合率的平均值（0-100，越高失衡越重） */
export function computeFunctionalLoad(imbalances: FMScoreResult): number {
  const rates = FM_CATEGORY_KEYS.map((cat) => imbalances.combined[cat]?.rate ?? 0);
  const mean = rates.reduce((s, r) => s + r, 0) / (rates.length || 1);
  return Math.round(mean * 10) / 10;
}

/** L6 功能失衡负荷得分（0-100，负荷越低分越高） */
export function functionalLoadToScore(loadRate: number): number {
  // 得分 = 100 − 失衡率/0.6：失衡率 0% 得满分，≥60% 得 0 分
  return Math.max(0, Math.min(100, Math.round((100 - loadRate / 0.6) * 10) / 10));
}

/** 报告展示用的失衡类别摘要 */
export interface FMCategorySummary {
  cat: FMCategories;
  name: string;
  icon: string;
  rate: number;
  selected: boolean;
  description: string;
}

export function summarizeCategories(imbalances: FMScoreResult): FMCategorySummary[] {
  return imbalances.ranked.map((r) => ({
    cat: r.cat,
    name: r.name,
    icon: r.icon,
    rate: r.rate,
    selected: r.selected,
    description: r.description,
  }));
}
