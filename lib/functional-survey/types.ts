/**
 * 功能医学两段式问卷类型定义
 * 数据来源：《功能医学思路》两段式健康问卷（health-survey-v2）
 * - Stage 1：23 题总体健康评估 → 7 大失衡类别阳性率
 * - Stage 2：入选类别各 15 题专项详查
 * - Lifestyle：生活方式调查（基本信息/习惯/饮食/运动/睡眠/既往史/症状）
 */

export type FMQuestionType =
  | "text"
  | "radio"
  | "checkbox"
  | "number"
  | "textarea"
  | "foodfreq"
  | "diseasehist"
  | "radio_other";

/** 单道题目 */
export interface FMQuestion {
  qid: string;
  text: string;
  type: FMQuestionType;
  options?: string[];
  placeholder?: string;
  optional?: boolean;
  /** foodfreq 题所属食物分组 */
  group?: string;
  /** foodfreq 题是否以"碗"计份量 */
  bowl?: boolean;
  /** diseasehist 题简称（用于报告摘要） */
  short?: string;
}

/** 问卷章节 */
export interface FMSection {
  id: string;
  title: string;
  subtitle?: string;
  stage: "info" | "lifestyle" | "stage1" | "stage2";
  /** stage2 章节对应的失衡类别 */
  category?: FMCategories;
  /** stage1 章节的表 13-1 题号映射 */
  mapping?: Record<string, number[]>;
  questions: FMQuestion[];
}

/** 干预方案 */
export interface FMIntervention {
  summary: string;
  diet: string[];
  supplements: string[];
  lifestyle: string[];
  tests: string[];
  notes?: string;
}

/** 失衡类别定义 */
export interface FMImbalance {
  name: string;
  fullName: string;
  icon: string;
  threshold: number;
  detailThresholdY?: number;
  description: string;
  intervention: FMIntervention;
}

/** 7 大失衡类别 key */
export type FMCategories =
  | "absorption"
  | "detox"
  | "defense"
  | "communication"
  | "transport"
  | "energy"
  | "structure";

/** 问卷数据根结构 */
export interface FMQuestionData {
  metadata: {
    version: string;
    name: string;
    stage1Description: string;
    stage2Description: string;
    scoringMethod: string;
    selectionRule: string;
  };
  sections: FMSection[];
  imbalances: Record<FMCategories, FMImbalance>;
}

/** 单题答案值 */
export type FMAnswerValue =
  | string
  | string[]
  | number
  | null
  /** foodfreq：{freq, count, amount} */
  | { freq?: string; count?: number | string; amount?: string }
  /** diseasehist：{status, detail} */
  | { status?: string; detail?: string };

/** 全部答案：qid -> 值 */
export type FMAnswers = Record<string, FMAnswerValue>;

/** Stage1 各类别阳性率 */
export interface FMStage1Score {
  yes: number;
  total: number;
  /** 百分比 0-100 */
  rate: number;
}

/** 类别筛选结果 */
export interface FMSelection {
  selected: FMCategories[];
  ranked: { cat: FMCategories; yes: number; total: number; rate: number }[];
  threshold: number;
}

/** Stage2 单类别评分 */
export interface FMStage2Score {
  yes: number;
  edge: number;
  total: number;
  rate: number;
}

/** 综合失衡评估结果 */
export interface FMImbalanceResult {
  stage1: FMStage1Score;
  stage2: FMStage2Score | null;
  /** 综合率 = Stage1 60% + Stage2 40%（百分制 0-100） */
  rate: number;
  selected: boolean;
}

/** 完整失衡评估输出 */
export interface FMScoreResult {
  stage1: Record<string, FMStage1Score>;
  selection: FMSelection;
  stage2: Record<string, FMStage2Score>;
  combined: Record<string, FMImbalanceResult>;
  /** 按综合率降序排列（含失衡类别元数据） */
  ranked: (FMImbalanceResult & FMImbalance & { cat: FMCategories })[];
}

/** 主要问题摘要 */
export interface FMMainProblems {
  lines: string[];
  imbalances: FMScoreResult;
}

/** 复测逐题变化状态 */
export type FMDiffStatus = "improved" | "worsened" | "persistent" | "changed";

/** 复测对比结果 */
export interface FMDiff {
  byQuestion: Record<
    string,
    { old: string; new: string; status: FMDiffStatus; section: string }
  >;
  byCategory: Record<
    string,
    { oldRate: number; newRate: number; delta: number; status: string }
  >;
  stats: Record<FMDiffStatus, number>;
}

/** 一次问卷提交记录 */
export interface FMSurveyRecord {
  id?: number;
  userId?: number | null;
  phone?: string | null;
  reportCode?: string | null;
  answers: FMAnswers;
  createdAt?: string;
}
