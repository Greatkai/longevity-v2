/**
 * CHLI（中国百岁健康标准指数）评分引擎类型定义
 * 综合公式：CHLI = 0.20×B + 0.20×F + 0.20×M + 0.15×L + 0.10×P + 0.15×D
 * 含二级指标体系：每个维度由若干二级指标加权构成，部分二级指标依赖检验/专项检查数据。
 */

/** 风险等级 */
export type RiskLevel = "excellent" | "good" | "moderate" | "risk" | "highRisk";

/** 性别 */
export type Gender = "male" | "female";

/* ------------------------- 二级指标输入模型 ------------------------- */

/** 检验数据的通用结构：available 表示用户是否有该项检查报告，值为数值型 */
export interface LabValue {
  /** 是否有该检验/检查 */
  available: boolean;
  /** 数值（无则为 null） */
  value: number | null;
}

/* B 生物年龄二级指标 */
export interface BioAgeInput {
  /** 实际年龄（未填为 null，评分用中性估算分） */
  actualAge: number | null;
  /** B1 生物年龄差值（可自评/体检） */
  biologicalAge: number | null;
  /** B2 表观遗传年龄/衰老时钟（第3代，需检验） */
  epigeneticAge: LabValue;
  /** B3 炎症负荷（hs-CRP / IL-6 / TNF-α，需检验） */
  inflammation: LabValue;
  /** B4 免疫年龄/免疫功能（可自评或检验） */
  immunity: number | null;
}

/* F 功能健康二级指标 */
export interface FunctionalInput {
  /** F1 日常活动能力 ADL/IADL 1-5 */
  adl: number;
  /** F2 步速/6分钟步行（需测试） */
  gaitSpeed: LabValue;
  /** F3 握力/肌肉力量（需测量） */
  gripStrength: LabValue;
  /** F4 平衡能力/跌倒风险（需测试） */
  balance: LabValue;
  /** F5 认知功能 MoCA/MMSE（需测试） */
  cognitiveTest: LabValue;
}

/* M 代谢与慢病二级指标 */
export interface MetabolicInput {
  /** M4 体成分 BMI（可计算） */
  bmi: number;
  /** M3 血压与心血管风险（需测量） */
  systolicBP: number;
  diastolicBP: number;
  /** M1 血糖代谢 HbA1c/空腹血糖（需检验） */
  hba1c: LabValue;
  fastingGlucose: LabValue;
  /** M2 血脂 LDL-C/ApoB（需检验） */
  ldl: LabValue;
  /** M5 肝肾功能与基础慢病（需检验） */
  liverKidney: LabValue;
  chronicCount: number;
  chronicControl: number;
}

/* L 生活方式二级指标 */
export interface LifestyleInput {
  /** L3 饮食质量 0-10 */
  diet: number;
  /** L2 睡眠质量 */
  sleepHours: number;
  sleepQuality: number;
  /** L1 运动水平 */
  weeklyExercise: number;
  /** L4 烟酒 */
  smoking: number;
  alcohol: number;
  /** L5 体重管理依从性 */
  weightManagement: number;
  /** 压力管理（辅助） */
  stress: number;
  /** L6 功能失衡负荷（0-100 失衡率，越高越差；来自功能医学问卷，未做时为 null） */
  functionalLoad?: number | null;
}

/* P 心理认知二级指标 */
export interface PsychosocialInput {
  /** P1 抑郁焦虑压力 1-5 */
  mood: number;
  /** P2 认知健康与记忆 1-5 */
  cognitiveHealth: number;
  /** P3 社会连接与孤独感 1-5 */
  loneliness: number;
  /** P4 生活目标感/心理韧性 1-5 */
  purpose: number;
  /** P5 社交参与 0-5 */
  socialActivity: number;
}

/* D 数字健康轨迹二级指标 */
export interface DigitalHealthInput {
  /** D1 连续健康数据完整性 0-10 */
  recordContinuity: number;
  /** D2 可穿戴设备数据质量 0-2 */
  wearable: number;
  /** D3 健康指标改善趋势（需历史数据） */
  improvingTrend: LabValue;
  /** D4 AI 风险预测结果（需 AI 评估） */
  aiRiskPrediction: number | null;
  /** D5 健康管理依从性 0-5 */
  adherence: number;
  /** 体检习惯（辅助） */
  regularCheckup: number;
}

/** 完整评估输入（含二级指标） */
export interface AssessmentInput {
  gender: Gender;
  bio: BioAgeInput;
  functional: FunctionalInput;
  metabolic: MetabolicInput;
  lifestyle: LifestyleInput;
  psychosocial: PsychosocialInput;
  digital: DigitalHealthInput;
}

/* ------------------------- 二级指标定义（用于问卷与权重） ------------------------- */

/** 二级指标配置 */
export interface SubIndicator {
  /** 二级指标编码，如 B1 */
  key: string;
  /** 名称 */
  name: string;
  /** 所属一级维度 */
  dimension: string;
  /** 权重（占一级维度的比例，和为 1） */
  weight: number;
  /** 是否需要检验/检查 */
  needsLab: boolean;
  /** 说明 */
  desc: string;
  /** 具体评分规则（值域→得分的映射说明，供“详细计算逻辑”展示） */
  rule?: string;
}

/* ------------------------- 维度得分模型 ------------------------- */

/** 单维度得分结果 */
export interface DimensionScore {
  key: string;
  name: string;
  /** 0-100 得分 */
  score: number;
  /** 权重 */
  weight: number;
  /** 风险等级 */
  level: RiskLevel;
  /** 二级指标得分明细 key -> score(0-100) */
  details: Record<string, number>;
}

/** 生物年龄结果（未填写实际年龄时各字段可为 null） */
export interface BioAgeResult {
  actualAge: number | null;
  biologicalAge: number | null;
  /** 生物年龄 - 实际年龄（正值=衰老快，负值=衰老慢） */
  ageGap: number | null;
}

/** 功能失衡类别摘要（用于报告展示） */
export interface FunctionalCategorySummary {
  cat: string;
  name: string;
  icon: string;
  /** 综合失衡率 0-100 */
  rate: number;
  /** 是否入选第二阶段详查 */
  selected: boolean;
  description: string;
}

/** 功能医学问卷结果摘要（附加到评估报告） */
export interface FunctionalSummary {
  /** 是否本次评估包含功能医学问卷 */
  included: boolean;
  /** 七大失衡类别平均失衡率 0-100 */
  loadRate: number;
  categories: FunctionalCategorySummary[];
  /** 主要问题摘要行 */
  mainProblems: string[];
  /** 入选类别的干预建议 */
  interventions: {
    cat: string;
    name: string;
    icon: string;
    summary: string;
    diet: string[];
    supplements: string[];
    lifestyle: string[];
    tests: string[];
    notes?: string;
  }[];
  /** 复测对比（首次填写为 null） */
  retest: {
    isRetest: boolean;
    stats: { improved: number; worsened: number; persistent: number; changed: number };
    byCategory: Record<
      string,
      { oldRate: number; newRate: number; delta: number; status: string }
    >;
    highlights: {
      qid: string;
      text: string;
      status: string;
      old: string;
      new: string;
    }[];
  } | null;
}

/** 综合评估结果 */
export interface AssessmentResult {
  /** 综合 CHLI 得分 0-100 */
  chliScore: number;
  /** 综合等级 */
  level: RiskLevel;
  /** 评估标签 */
  label: string;
  /** 各维度得分 */
  dimensions: DimensionScore[];
  /** 本次评估包含的维度（用户可配置选择部分维度） */
  includedDimensions?: string[];
  /** 生物年龄对比 */
  bioAge: BioAgeResult;
  /** 附加模块 FSHI（功能与感觉健康） */
  fshi: DimensionScore | null;
  /** 功能医学问卷结果（选择了功能医学问卷时存在） */
  functional?: FunctionalSummary | null;
  /** 原始填写数据（用于个性化检验建议与工作台查看） */
  sourceData?: Record<string, unknown>;
  /** 生成时间 */
  createdAt: string;
  /** 报告唯一编码（用于健康管理师检索） */
  reportCode: string;
}

/** 风险等级元数据 */
export interface RiskMeta {
  level: RiskLevel;
  label: string;
  color: string;
  description: string;
}
