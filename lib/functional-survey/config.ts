import { FM_SECTION_MINUTES, FM_SECTION_SIZES } from "./questions";
import type { FMCategories } from "./types";

/**
 * 评估配置模块定义
 * 用户在开始评估前可勾选本次要完成的问卷模块，每个模块提供介绍与预估用时。
 */

export type FMModuleId =
  | "fm_basic"
  | "fm_habits"
  | "fm_diet"
  | "fm_exercise"
  | "fm_sleep"
  | "fm_disease"
  | "fm_discomfort"
  | "fm_stage1"
  | "fm_stage2";

/** 功能医学问卷模块配置 */
export interface FMModuleConfig {
  id: FMModuleId;
  /** 对应问卷章节 id（fm_stage2 为动态章节） */
  sectionId: string;
  title: string;
  description: string;
  /** 题目数（fm_stage2 为区间描述） */
  questionCount: string;
  /** 预估用时（分钟） */
  minutes: number;
  /** 推荐选择 */
  recommended: boolean;
  /** 依赖的模块 */
  dependsOn?: FMModuleId[];
  /** 反哺的 CHLI 生活方式二级指标（选择后跳过 CHLI 对应题目） */
  feeds?: string[];
}

const SECTION_META: Record<string, { title: string; description: string; recommended?: boolean }> = {
  fm_basic: {
    title: "基本信息",
    description: "姓名、性别、年龄、身高体重、联系方式等，用于生成个性化报告并识别复测记录；可自动带入 CHLI 评估的年龄、性别与 BMI。",
    recommended: true,
  },
  fm_habits: {
    title: "生活习惯",
    description: "屏幕时间、吸烟、饮酒情况；结果将替代 CHLI 生活方式维度中的烟酒题目，避免重复作答。",
    recommended: true,
  },
  fm_diet: {
    title: "饮食调查",
    description: "27 项食物频率调查（近半年平均水平），覆盖主食、肉蛋水产、奶豆坚果、蔬果、精加工食品等六大类；结果将自动计算饮食质量分。",
    recommended: true,
  },
  fm_exercise: {
    title: "运动情况",
    description: "每周运动次数、单次时长与运动方式；结果将替代 CHLI 生活方式维度中的运动题目。",
    recommended: true,
  },
  fm_sleep: {
    title: "睡眠情况",
    description: "睡眠时长、上床时间与质量自评；结果将替代 CHLI 生活方式维度中的睡眠题目。",
    recommended: true,
  },
  fm_disease: {
    title: "既往史与用药",
    description: "19 项疾病既往史（含年份与详情）、目前用药多选与病史自述，帮助健康管理师了解您的健康状况。",
    recommended: true,
  },
  fm_discomfort: {
    title: "症状调查",
    description: "近半年出现的 12 项常见不适症状（没有/偶尔/经常），用于定位功能失衡线索。",
    recommended: true,
  },
  fm_stage1: {
    title: "失衡总体评估",
    description: "23 道总体健康问题，按《功能医学思路》表 13-1 映射到吸收与排泄、排毒、防御、细胞通信、细胞运输、能量转换、结构完整性七大失衡类别，计算各类别阳性率。",
    recommended: true,
  },
  fm_stage2: {
    title: "失衡专项详查",
    description: "根据总体评估结果，仅对阳性率≥30%的主要失衡类别（2~4 个）各呈现 15 道专项问题，与总体评估按 6:4 加权得到失衡综合分与个性化干预建议。",
  },
};

export const FM_MODULES: FMModuleConfig[] = (
  [
    "fm_basic",
    "fm_habits",
    "fm_diet",
    "fm_exercise",
    "fm_sleep",
    "fm_disease",
    "fm_discomfort",
    "fm_stage1",
    "fm_stage2",
  ] as FMModuleId[]
).map((id) => {
  const meta = SECTION_META[id];
  const sectionId =
    id === "fm_basic"
      ? "basic"
      : id === "fm_habits"
      ? "habits"
      : id === "fm_diet"
      ? "diet"
      : id === "fm_exercise"
      ? "exercise"
      : id === "fm_sleep"
      ? "sleep"
      : id === "fm_disease"
      ? "disease"
      : id === "fm_discomfort"
      ? "discomfort"
      : id === "fm_stage1"
      ? "overall"
      : "stage2";
  const feeds =
    id === "fm_habits"
      ? ["L4"]
      : id === "fm_diet"
      ? ["L3"]
      : id === "fm_exercise"
      ? ["L1"]
      : id === "fm_sleep"
      ? ["L2"]
      : undefined;
  return {
    id,
    sectionId,
    title: meta.title,
    description: meta.description,
    questionCount:
      id === "fm_stage2"
        ? "约 30-60 题（动态）"
        : `${FM_SECTION_SIZES[sectionId] ?? 0} 题`,
    minutes:
      id === "fm_stage2" ? 10 : FM_SECTION_MINUTES[sectionId] ?? 3,
    recommended: !!meta.recommended,
    dependsOn: id === "fm_stage2" ? ["fm_stage1"] : undefined,
    feeds,
  };
});

/** 生活方式章节的固定出题顺序 */
export const FM_LIFESTYLE_ORDER: FMModuleId[] = [
  "fm_basic",
  "fm_habits",
  "fm_diet",
  "fm_exercise",
  "fm_sleep",
  "fm_disease",
  "fm_discomfort",
];

/** 模块 id -> 章节 id */
export const FM_MODULE_SECTION: Record<FMModuleId, string> = FM_MODULES.reduce(
  (acc, m) => {
    acc[m.id] = m.sectionId;
    return acc;
  },
  {} as Record<FMModuleId, string>
);

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

/** 本次评估的总预估用时（分钟） */
export function estimateTotalMinutes(
  fmModules: FMModuleId[],
  chliDimensionCount: number,
  stage2CategoryCount = 3
): number {
  let minutes = 0;
  for (const id of fmModules) {
    const m = FM_MODULES.find((x) => x.id === id);
    if (!m) continue;
    minutes += id === "fm_stage2" ? Math.round(stage2CategoryCount * 2.5) : m.minutes;
  }
  // CHLI 每维度约 1 分钟
  minutes += chliDimensionCount * 1;
  return Math.max(1, minutes);
}
