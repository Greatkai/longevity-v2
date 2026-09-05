import { FM_SECTION_MINUTES, FM_SECTION_SIZES } from "./questions";
import type { FMCategories } from "./types";
import { QUESTIONS } from "@/lib/questionnaire-data";

/**
 * 评估配置：主题式模块选择
 * CHLI 内置题目与功能医学问卷存在重叠（运动/睡眠/饮食/烟酒/基本信息），
 * 每个主题可三选一：
 *  - simple   简单版：只答 CHLI 维度内的少量题目
 *  - detailed 详查版：使用功能医学问卷的专项调查（数据反哺 CHLI，避免重复作答）
 *  - skip     跳过：不提问，按默认中性值计分
 */

export type TopicMode = "simple" | "detailed" | "skip";

/** 功能医学主题（与问卷章节一一对应） */
export type FMTopicId =
  | "basic"
  | "habits"
  | "diet"
  | "exercise"
  | "sleep"
  | "disease"
  | "discomfort";

/** 失衡评估（stage1 + stage2）单独作为主题 */
export type TopicId = FMTopicId | "imbalance";

/** 评估配置 */
export interface AssessmentConfig {
  /** 参与评估的 CHLI 维度 key（B/F/M/L/P/D） */
  chliDimensions: string[];
  topics: {
    basic: "simple" | "detailed";
    exercise: TopicMode;
    sleep: TopicMode;
    diet: TopicMode;
    habits: TopicMode;
    disease: "detailed" | "skip";
    discomfort: "detailed" | "skip";
    imbalance: "detailed" | "skip";
  };
}

export const DEFAULT_CONFIG: AssessmentConfig = {
  chliDimensions: ["B", "F", "M", "L", "P", "D"],
  topics: {
    basic: "simple",
    exercise: "simple",
    sleep: "simple",
    diet: "simple",
    habits: "simple",
    disease: "skip",
    discomfort: "skip",
    imbalance: "skip",
  },
};

/** 主题是否为详查模式 */
export function isDetailed(config: AssessmentConfig, topic: TopicId): boolean {
  return config.topics[topic] === "detailed";
}

/** 是否包含功能医学问卷（任意主题为详查版） */
export function hasFunctionalSurvey(config: AssessmentConfig): boolean {
  return (Object.keys(config.topics) as TopicId[]).some((t) =>
    isDetailed(config, t)
  );
}

/** 主题元数据（用于配置面板展示） */
export interface TopicMeta {
  id: TopicId;
  title: string;
  icon: string;
  description: string;
  /** 简单版信息（无则该主题不支持简单版） */
  simple?: {
    desc: string;
    questionCount: number;
    minutes: number;
    /** 简单版依赖的 CHLI 维度（需至少一个被勾选） */
    requiresDims: string[];
  };
  /** 详查版信息 */
  detailed: { desc: string; questionCount: string; minutes: number };
  /** 是否支持"跳过" */
  skippable: boolean;
  /** 详查版对应的问卷章节 */
  sectionId?: string;
}

/** 简单版题目数/用时（按 CHLI 题目数估算，约 15 秒/题） */
function simpleStats(ids: string[]) {
  return { questionCount: ids.length, minutes: Math.max(1, Math.round(ids.length * 0.25)) };
}

export const TOPIC_META: TopicMeta[] = [
  {
    id: "basic",
    title: "基本信息",
    icon: "👤",
    description: "性别、年龄、身高体重与联系方式，用于生成报告并识别复测记录。",
    simple: {
      desc: "在 B/M 维度中直接填写年龄与 BMI",
      ...simpleStats(["actualAge", "bmi"]),
      requiresDims: ["B", "M"],
    },
    detailed: {
      desc: "完整基本信息（姓名/性别/年龄/身高体重/电话/劳动强度），自动带入 CHLI，无需重复填写",
      questionCount: `${FM_SECTION_SIZES["basic"]} 题`,
      minutes: FM_SECTION_MINUTES["basic"],
    },
    skippable: false,
    sectionId: "basic",
  },
  {
    id: "exercise",
    title: "运动情况",
    icon: "🏃",
    description: "每周运动频率、单次时长与运动方式。",
    simple: {
      desc: "只答一题：每周中等强度运动次数",
      ...simpleStats(["weeklyExercise"]),
      requiresDims: ["L"],
    },
    detailed: {
      desc: "功能医学运动问卷（次数/时长/方式），结果自动计入 CHLI 运动水平",
      questionCount: `${FM_SECTION_SIZES["exercise"]} 题`,
      minutes: FM_SECTION_MINUTES["exercise"],
    },
    skippable: true,
    sectionId: "exercise",
  },
  {
    id: "sleep",
    title: "睡眠情况",
    icon: "😴",
    description: "睡眠时长、上床时间与质量自评。",
    simple: {
      desc: "只答两题：平均睡眠时长 + 质量自评",
      ...simpleStats(["sleepHours", "sleepQuality"]),
      requiresDims: ["L"],
    },
    detailed: {
      desc: "功能医学睡眠问卷（时长/入睡时间/质量），结果自动计入 CHLI 睡眠质量",
      questionCount: `${FM_SECTION_SIZES["sleep"]} 题`,
      minutes: FM_SECTION_MINUTES["sleep"],
    },
    skippable: true,
    sectionId: "sleep",
  },
  {
    id: "diet",
    title: "饮食调查",
    icon: "🥗",
    description: "膳食结构与饮食习惯评估。",
    simple: {
      desc: "只答一题：饮食健康程度自评（0-10）",
      ...simpleStats(["diet"]),
      requiresDims: ["L"],
    },
    detailed: {
      desc: "27 项食物频率调查（主食/肉蛋水产/奶豆坚果/蔬果/精加工），自动计算饮食质量分",
      questionCount: `${FM_SECTION_SIZES["diet"]} 题`,
      minutes: FM_SECTION_MINUTES["diet"],
    },
    skippable: true,
    sectionId: "diet",
  },
  {
    id: "habits",
    title: "烟酒与习惯",
    icon: "🚬",
    description: "吸烟、饮酒与屏幕时间等生活习惯。",
    simple: {
      desc: "只答两题：吸烟情况 + 饮酒情况",
      ...simpleStats(["smoking", "alcohol"]),
      requiresDims: ["L"],
    },
    detailed: {
      desc: "功能医学习惯问卷（屏幕时间/吸烟/饮酒），结果自动计入 CHLI 烟酒评分",
      questionCount: `${FM_SECTION_SIZES["habits"]} 题`,
      minutes: FM_SECTION_MINUTES["habits"],
    },
    skippable: true,
    sectionId: "habits",
  },
  {
    id: "disease",
    title: "既往史与用药",
    icon: "📋",
    description: "19 项疾病既往史（含年份与详情）、目前用药多选与病史自述。",
    detailed: {
      desc: "功能医学既往史问卷，帮助健康管理师全面了解健康状况",
      questionCount: `${FM_SECTION_SIZES["disease"]} 题`,
      minutes: FM_SECTION_MINUTES["disease"],
    },
    skippable: true,
    sectionId: "disease",
  },
  {
    id: "discomfort",
    title: "症状调查",
    icon: "🌡️",
    description: "近半年出现的 12 项常见不适症状（没有/偶尔/经常）。",
    detailed: {
      desc: "功能医学症状问卷，用于定位功能失衡线索",
      questionCount: `${FM_SECTION_SIZES["discomfort"]} 题`,
      minutes: FM_SECTION_MINUTES["discomfort"],
    },
    skippable: true,
    sectionId: "discomfort",
  },
  {
    id: "imbalance",
    title: "功能失衡评估",
    icon: "🧭",
    description: "基于《功能医学思路》两段式评估：23 题总体评估定位七大失衡类别（吸收与排泄/排毒/防御/细胞通信/细胞运输/能量转换/结构完整性），再对主要失衡类别专项详查。",
    detailed: {
      desc: "总体评估 23 题 + 动态专项详查 2~4 类 × 15 题；产出失衡负荷（计入 L6）与个性化干预建议",
      questionCount: "约 53-83 题",
      minutes: 15,
    },
    skippable: true,
  },
];

/** 详查主题的出题顺序 */
export const FM_TOPIC_ORDER: FMTopicId[] = [
  "basic",
  "habits",
  "diet",
  "exercise",
  "sleep",
  "disease",
  "discomfort",
];

/**
 * 主题详查时需要跳过的 CHLI 题目（避免重复作答）
 * key: 主题 id；value: { 维度: [题目 id] }
 */
export const TOPIC_OVERRIDES: Record<string, Record<string, string[]>> = {
  basic: { B: ["actualAge"], M: ["bmi"] },
  exercise: { L: ["weeklyExercise"] },
  sleep: { L: ["sleepHours", "sleepQuality"] },
  diet: { L: ["diet"] },
  habits: { L: ["smoking", "alcohol"] },
};

/** 失衡类别 -> Stage2 章节 id */
export const FM_CATEGORY_SECTION: Record<FMCategories, string> = {
  absorption: "ch4",
  detox: "ch5",
  defense: "ch6",
  communication: "ch7",
  transport: "ch8",
  energy: "ch9",
  structure: "ch10",
};

/** 估算本次评估的总题数与用时 */
export function estimateAssessment(config: AssessmentConfig): {
  minutes: number;
  questions: number;
  moduleCount: number;
} {
  const selectedDims = new Set(config.chliDimensions);
  let questions = 0;

  // CHLI 题目（扣除被详查主题覆盖的题目）
  for (const dim of config.chliDimensions) {
    for (const q of QUESTIONS) {
      if (q.dimension !== dim) continue;
      let overridden = false;
      for (const topic of Object.keys(TOPIC_OVERRIDES)) {
        if (config.topics[topic as TopicId] === "simple") continue;
        const ids = TOPIC_OVERRIDES[topic][dim] ?? [];
        if (ids.includes(q.id)) overridden = true;
      }
      if (!overridden) questions += 1;
    }
  }

  // 详查主题的问卷题目
  for (const topic of TOPIC_META) {
    if (!isDetailed(config, topic.id)) continue;
    if (topic.id === "imbalance") {
      questions += 23 + 45; // 总体 + 专项按 3 类估算
    } else {
      questions += FM_SECTION_SIZES[topic.sectionId!] ?? 0;
    }
  }

  const minutes = Math.max(1, Math.round(questions * 0.22));
  const moduleCount =
    config.chliDimensions.length +
    TOPIC_META.filter((t) => isDetailed(config, t.id)).length;
  return { minutes, questions, moduleCount };
}
