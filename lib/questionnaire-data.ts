import type { LucideIcon } from "lucide-react";
import { Dna, HeartPulse, Activity, UtensilsCrossed, Brain, LineChart } from "lucide-react";
import { LAB_CHECKLIST } from "@/lib/chli-model/sub-indicators";

export type QuestionType = "number" | "select" | "radio" | "range" | "lab";

export interface Option {
  value: number;
  label: string;
}

export interface Question {
  id: string;
  dimension: string;
  type: QuestionType;
  label: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  options?: Option[];
  /** 关联到 AssessmentInput 的路径 */
  path: string;
  /** 是否需要检验（lab 类型，含 available 开关） */
  needsLab?: boolean;
}

export interface DimensionConfig {
  key: string;
  title: string;
  name: string;
  icon: LucideIcon;
  description: string;
  color: string;
  weight: string;
}

export const DIMENSIONS: DimensionConfig[] = [
  {
    key: "B", title: "生物年龄", name: "生物年龄指数",
    icon: Dna, description: "评估生物年龄与实际年龄的差异，判断身体衰老速度。",
    color: "from-brand-600 to-brand-400", weight: "20%",
  },
  {
    key: "F", title: "功能健康", name: "功能健康指数",
    icon: HeartPulse, description: "评估躯体功能、认知功能、生活自理与运动能力。",
    color: "from-teal-500 to-emerald-400", weight: "20%",
  },
  {
    key: "M", title: "代谢慢病", name: "代谢与慢病风险指数",
    icon: Activity, description: "评估血糖、血脂、血压、体成分与慢病风险。",
    color: "from-orange-500 to-amber-400", weight: "20%",
  },
  {
    key: "L", title: "生活方式", name: "生活方式与行为指数",
    icon: UtensilsCrossed, description: "评估饮食、睡眠、运动、烟酒与体重管理。",
    color: "from-sky-500 to-cyan-400", weight: "15%",
  },
  {
    key: "P", title: "心理认知", name: "心理认知与社交参与指数",
    icon: Brain, description: "评估情绪、认知、社会连接、目标感与社交参与。",
    color: "from-violet-500 to-purple-400", weight: "10%",
  },
  {
    key: "D", title: "数字健康", name: "数字健康轨迹指数",
    icon: LineChart, description: "评估健康数据完整性、设备质量与改善趋势。",
    color: "from-rose-500 to-pink-400", weight: "15%",
  },
];

const scale5 = [
  { value: 1, label: "很差" },
  { value: 2, label: "较差" },
  { value: 3, label: "一般" },
  { value: 4, label: "较好" },
  { value: 5, label: "很好" },
];

const freq6 = [
  { value: 0, label: "从不" },
  { value: 1, label: "偶尔" },
  { value: 2, label: "每月几次" },
  { value: 3, label: "每周几次" },
  { value: 4, label: "经常" },
  { value: 5, label: "每天" },
];

/** 检验检查清单的路径映射（用于回填 available） */
export const LAB_PATH_MAP: Record<string, string> = {
  B2: "bio.epigeneticAge",
  B3: "bio.inflammation",
  M1: "metabolic.hba1c",
  M2: "metabolic.ldl",
  M3: "metabolic.systolicBP",
  M5: "metabolic.liverKidney",
  F2: "functional.gaitSpeed",
  F3: "functional.gripStrength",
  F4: "functional.balance",
  F5: "functional.cognitiveTest",
  D3: "digital.improvingTrend",
};

export const QUESTIONS: Question[] = [
  /* ================= 基本信息 ================= */
  {
    id: "actualAge", dimension: "B", type: "number",
    label: "您的实际年龄？", hint: "评估范围 25-105 岁", min: 25, max: 105, suffix: "岁",
    path: "bio.actualAge",
  },

  /* ================= B 生物年龄 ================= */
  {
    id: "biologicalAge", dimension: "B", type: "number",
    label: "您的生物年龄？（如做过生物年龄评估）", hint: "可用体检标志物评估，不确定可留空",
    min: 20, max: 120, suffix: "岁", path: "bio.biologicalAge",
  },
  {
    id: "epigeneticAge", dimension: "B", type: "lab",
    label: "表观遗传年龄（衰老时钟检测）", hint: "基于 DNA 甲基化检测的生物年龄，单位：岁",
    min: 20, max: 120, suffix: "岁", path: "bio.epigeneticAge.value", needsLab: true,
  },
  {
    id: "hsCRP", dimension: "B", type: "lab",
    label: "高敏 C 反应蛋白（hs-CRP）", hint: "炎症标志物，理想值 <1.0 mg/L",
    min: 0, max: 20, step: 0.1, suffix: "mg/L", path: "bio.inflammation.value", needsLab: true,
  },
  {
    id: "immunity", dimension: "B", type: "radio",
    label: "您的免疫功能/抵抗力如何？", hint: "自评免疫力水平", options: scale5,
    path: "bio.immunity",
  },

  /* ================= F 功能健康 ================= */
  {
    id: "adl", dimension: "F", type: "radio",
    label: "您的日常生活自理能力（ADL）如何？", options: scale5, path: "functional.adl",
  },
  {
    id: "gaitSpeed", dimension: "F", type: "lab",
    label: "步速测试结果", hint: "6 米步速或步行能力，单位：m/s，正常约 1.1-1.5",
    min: 0.3, max: 2.5, step: 0.1, suffix: "m/s", path: "functional.gaitSpeed.value", needsLab: true,
  },
  {
    id: "gripStrength", dimension: "F", type: "lab",
    label: "握力测量结果", hint: "优势手握力，单位：kg，成年男性约 30-45kg",
    min: 5, max: 80, suffix: "kg", path: "functional.gripStrength.value", needsLab: true,
  },
  {
    id: "balance", dimension: "F", type: "lab",
    label: "平衡能力评分", hint: "单腿站立或 Berg 量表，1-5 分",
    min: 1, max: 5, step: 1, path: "functional.balance.value", needsLab: true,
  },
  {
    id: "cognitiveTest", dimension: "F", type: "lab",
    label: "认知功能筛查得分（MoCA）", hint: "满分 30 分，>26 正常，18-25 轻度受损",
    min: 0, max: 30, step: 1, path: "functional.cognitiveTest.value", needsLab: true,
  },

  /* ================= M 代谢慢病 ================= */
  {
    id: "hba1c", dimension: "M", type: "lab",
    label: "糖化血红蛋白（HbA1c）", hint: "理想值 <6.0%，单位：%",
    min: 4, max: 15, step: 0.1, suffix: "%", path: "metabolic.hba1c.value", needsLab: true,
  },
  {
    id: "fastingGlucose", dimension: "M", type: "lab",
    label: "空腹血糖", hint: "理想值 <6.1 mmol/L",
    min: 3, max: 15, step: 0.1, suffix: "mmol/L", path: "metabolic.fastingGlucose.value", needsLab: true,
  },
  {
    id: "ldl", dimension: "M", type: "lab",
    label: "低密度脂蛋白（LDL-C）", hint: "理想值 <3.4 mmol/L",
    min: 1, max: 8, step: 0.1, suffix: "mmol/L", path: "metabolic.ldl.value", needsLab: true,
  },
  {
    id: "systolicBP", dimension: "M", type: "number",
    label: "您的收缩压（高压）？", hint: "理想值约 110-120 mmHg",
    min: 80, max: 220, suffix: "mmHg", path: "metabolic.systolicBP",
  },
  {
    id: "diastolicBP", dimension: "M", type: "number",
    label: "您的舒张压（低压）？", hint: "理想值约 70-80 mmHg",
    min: 50, max: 140, suffix: "mmHg", path: "metabolic.diastolicBP",
  },
  {
    id: "bmi", dimension: "M", type: "number",
    label: "您的身体质量指数（BMI）？", hint: "BMI = 体重(kg) ÷ 身高(m)²，理想范围 18.5-24",
    min: 14, max: 45, step: 0.1, path: "metabolic.bmi",
  },
  {
    id: "chronicCount", dimension: "M", type: "number",
    label: "您目前患有的慢性病数量？", hint: "如高血压、糖尿病、高血脂、冠心病等",
    min: 0, max: 6, path: "metabolic.chronicCount",
  },
  {
    id: "chronicControl", dimension: "M", type: "radio",
    label: "慢性病控制情况如何？",
    options: [
      { value: 0, label: "控制较差" },
      { value: 1, label: "控制一般" },
      { value: 2, label: "控制良好" },
    ],
    path: "metabolic.chronicControl",
  },

  /* ================= L 生活方式 ================= */
  {
    id: "diet", dimension: "L", type: "range",
    label: "您的饮食健康程度（0-10）？", hint: "0=很不健康，10=非常均衡健康",
    min: 0, max: 10, path: "lifestyle.diet",
  },
  {
    id: "sleepHours", dimension: "L", type: "number",
    label: "您平均每天睡眠时长？", hint: "理想 7-8 小时",
    min: 3, max: 12, step: 0.5, suffix: "小时", path: "lifestyle.sleepHours",
  },
  {
    id: "sleepQuality", dimension: "L", type: "radio",
    label: "您的睡眠质量如何？", options: scale5, path: "lifestyle.sleepQuality",
  },
  {
    id: "weeklyExercise", dimension: "L", type: "number",
    label: "您每周进行中等强度运动的次数？", min: 0, max: 7, suffix: "次",
    path: "lifestyle.weeklyExercise",
  },
  {
    id: "smoking", dimension: "L", type: "radio",
    label: "您的吸烟情况？",
    options: [
      { value: 0, label: "从不吸烟" },
      { value: 1, label: "已戒烟" },
      { value: 2, label: "偶尔吸烟" },
      { value: 3, label: "经常吸烟" },
    ],
    path: "lifestyle.smoking",
  },
  {
    id: "alcohol", dimension: "L", type: "radio",
    label: "您的饮酒情况？",
    options: [
      { value: 0, label: "从不饮酒" },
      { value: 1, label: "少量/偶尔" },
      { value: 2, label: "经常饮酒" },
    ],
    path: "lifestyle.alcohol",
  },
  {
    id: "weightManagement", dimension: "L", type: "radio",
    label: "您对体重的管理意识如何？", hint: "关注并主动控制体重",
    options: scale5, path: "lifestyle.weightManagement",
  },

  /* ================= P 心理认知 ================= */
  {
    id: "mood", dimension: "P", type: "radio",
    label: "您近期的情绪状态如何？", hint: "焦虑、抑郁、压力程度", options: scale5,
    path: "psychosocial.mood",
  },
  {
    id: "cognitiveHealth", dimension: "P", type: "radio",
    label: "您的记忆力与认知功能如何？", options: scale5, path: "psychosocial.cognitiveHealth",
  },
  {
    id: "loneliness", dimension: "P", type: "radio",
    label: "您感觉孤独的程度？",
    options: [
      { value: 1, label: "没有" },
      { value: 2, label: "偶尔" },
      { value: 3, label: "一般" },
      { value: 4, label: "较常" },
      { value: 5, label: "经常" },
    ],
    path: "psychosocial.loneliness",
  },
  {
    id: "purpose", dimension: "P", type: "radio",
    label: "您对生活的目标感与掌控感如何？", hint: "生活有目标、有方向",
    options: scale5, path: "psychosocial.purpose",
  },
  {
    id: "socialActivity", dimension: "P", type: "radio",
    label: "您参与社交活动的频率？", options: freq6, path: "psychosocial.socialActivity",
  },

  /* ================= D 数字健康 ================= */
  {
    id: "recordContinuity", dimension: "D", type: "range",
    label: "您的健康数据记录连续性（0-10）？", hint: "0=从不记录，10=长期规律记录",
    min: 0, max: 10, path: "digital.recordContinuity",
  },
  {
    id: "wearable", dimension: "D", type: "radio",
    label: "您使用可穿戴健康设备的情况？",
    options: [
      { value: 0, label: "不使用" },
      { value: 1, label: "偶尔使用" },
      { value: 2, label: "经常使用" },
    ],
    path: "digital.wearable",
  },
  {
    id: "adherence", dimension: "D", type: "radio",
    label: "您对健康管理计划的依从程度？", hint: "能否坚持执行健康计划",
    options: freq6, path: "digital.adherence",
  },
];

/** 每个维度的默认初始值（含二级指标与检验数据） */
export const DEFAULT_ASSESSMENT = {
  gender: "male" as const,
  bio: {
    actualAge: 40,
    biologicalAge: null as number | null,
    epigeneticAge: { available: false, value: null as number | null },
    inflammation: { available: false, value: null as number | null },
    immunity: 3,
  },
  functional: {
    adl: 3,
    gaitSpeed: { available: false, value: null as number | null },
    gripStrength: { available: false, value: null as number | null },
    balance: { available: false, value: null as number | null },
    cognitiveTest: { available: false, value: null as number | null },
  },
  metabolic: {
    bmi: 23,
    systolicBP: 120,
    diastolicBP: 80,
    hba1c: { available: false, value: null as number | null },
    fastingGlucose: { available: false, value: null as number | null },
    ldl: { available: false, value: null as number | null },
    liverKidney: { available: false, value: null as number | null },
    chronicCount: 0,
    chronicControl: 1,
  },
  lifestyle: {
    diet: 7,
    sleepHours: 7,
    sleepQuality: 3,
    weeklyExercise: 3,
    smoking: 0,
    alcohol: 0,
    weightManagement: 3,
    stress: 3,
  },
  psychosocial: {
    mood: 3,
    cognitiveHealth: 3,
    loneliness: 2,
    purpose: 3,
    socialActivity: 3,
  },
  digital: {
    recordContinuity: 6,
    wearable: 1,
    improvingTrend: { available: false, value: null as number | null },
    aiRiskPrediction: null as number | null,
    adherence: 3,
    regularCheckup: 1,
  },
};

/** 导出检验清单（供问卷第一步使用） */
export { LAB_CHECKLIST };
