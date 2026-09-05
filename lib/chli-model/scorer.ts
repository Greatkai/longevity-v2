import type {
  AssessmentInput,
  BioAgeInput,
  FunctionalInput,
  MetabolicInput,
  LifestyleInput,
  PsychosocialInput,
  DigitalHealthInput,
  DimensionScore,
  BioAgeResult,
  RiskLevel,
  LabValue,
} from "./types";
import { clampScore, linearMap, levelFromScore } from "./normalization";
import { SUB_BY_DIMENSION } from "./sub-indicators";

/**
 * CHLI 二级指标计分逻辑
 * 每维度由若干二级指标加权构成（权重见 SUB_INDICATORS），输出 0-100 分。
 * 需要检验数据的二级指标：有数据用精确值评分，无数据用替代估算。
 */

/** 1-5 李克特量表映射到 0-100 */
function scale1to5(v: number | null): number {
  if (v === null || v === undefined) return 60;
  return clampScore(linearMap(v, 1, 5, 0, 100));
}

/** 0-5 频率量表映射到 0-100 */
function freq0to5(v: number | null): number {
  if (v === null || v === undefined) return 60;
  return clampScore(linearMap(v, 0, 5, 0, 100));
}

/** 0-10 映射到 0-100 */
function scale0to10(v: number | null): number {
  if (v === null || v === undefined) return 60;
  return clampScore(linearMap(v, 0, 10, 0, 100));
}

/** 检验值计分：有值用打分函数，无值用替代分 */
function labScore(
  lab: LabValue | null | undefined,
  scoreFn: (value: number) => number,
  fallback: number
): number {
  if (lab && lab.available && lab.value !== null && lab.value !== undefined) {
    return clampScore(scoreFn(lab.value));
  }
  return clampScore(fallback);
}

/* ------------------- B 生物年龄指数 ------------------- */
export function scoreBioAge(input: BioAgeInput): {
  score: number;
  details: Record<string, number>;
  result: BioAgeResult;
} {
  const actualAge = input.actualAge;
  let biologicalAge: number;
  if (input.biologicalAge !== null && input.biologicalAge > 0) {
    biologicalAge = input.biologicalAge;
  } else if (input.epigeneticAge?.available && input.epigeneticAge.value) {
    biologicalAge = input.epigeneticAge.value;
  } else {
    biologicalAge = actualAge;
  }

  const ageGap = biologicalAge - actualAge;
  // B1 生物年龄差值：年轻越多分越高
  const b1 = clampScore(60 - ageGap * 2.5 + Math.max(0, 80 - actualAge) * 0.1);

  // B2 表观遗传/衰老时钟：有检测数据用差值，无则给中性分
  const b2 = labScore(
    input.epigeneticAge,
    (v) => {
      const gap = v - actualAge;
      return clampScore(60 - gap * 2.5);
    },
    62
  );

  // B3 炎症负荷：hs-CRP 越低越好（<1 最佳）
  const b3 = labScore(
    input.inflammation,
    (v) => clampScore(linearMap(v, 3, 0.5, 0, 100)),
    65
  );

  // B4 免疫年龄：自评或未知中性
  const b4 = input.immunity !== null && input.immunity !== undefined
    ? scale1to5(input.immunity)
    : 70;

  // 按二级权重加权
  const subW = subWeights("B");
  const score = clampScore(b1 * subW.B1 + b2 * subW.B2 + b3 * subW.B3 + b4 * subW.B4);

  return {
    score,
    details: { B1: b1, B2: b2, B3: b3, B4: b4 },
    result: { actualAge, biologicalAge, ageGap },
  };
}

/* ------------------- F 功能健康指数 ------------------- */
export function scoreFunctional(input: FunctionalInput): {
  score: number;
  details: Record<string, number>;
} {
  // F1 日常活动能力 ADL
  const f1 = scale1to5(input.adl);

  // F2 步速：正常成人步速约 1.1-1.5 m/s，越高越好
  const f2 = labScore(
    input.gaitSpeed,
    (v) => clampScore(linearMap(v, 0.6, 1.4, 0, 100)),
    70
  );

  // F3 握力：男性/女性不同，这里按统一近似（>40kg 优秀）
  const f3 = labScore(
    input.gripStrength,
    (v) => clampScore(linearMap(v, 15, 40, 0, 100)),
    70
  );

  // F4 平衡能力：1-5 分
  const f4 = labScore(
    input.balance,
    (v) => clampScore(linearMap(v, 1, 5, 0, 100)),
    70
  );

  // F5 认知功能 MoCA（满分 30，>26 正常）
  const f5 = labScore(
    input.cognitiveTest,
    (v) => clampScore(linearMap(v, 18, 28, 0, 100)),
    70
  );

  const subW = subWeights("F");
  const score = clampScore(
    f1 * subW.F1 + f2 * subW.F2 + f3 * subW.F3 + f4 * subW.F4 + f5 * subW.F5
  );

  return { score, details: { F1: f1, F2: f2, F3: f3, F4: f4, F5: f5 } };
}

/* ------------------- M 代谢与慢病风险指数 ------------------- */
export function scoreMetabolic(input: MetabolicInput): {
  score: number;
  details: Record<string, number>;
} {
  // M1 血糖代谢：HbA1c <6% 理想，空腹血糖 <6.1
  let m1: number;
  if (input.hba1c?.available && input.hba1c.value !== null) {
    m1 = clampScore(linearMap(input.hba1c.value, 8, 5.5, 0, 100));
  } else {
    const fb = labScore(input.fastingGlucose, (v) => linearMap(v, 7.5, 5.5, 0, 100), 65);
    m1 = fb;
  }

  // M2 血脂：LDL-C <3.4 理想，ApoB 目标
  const m2 = labScore(input.ldl, (v) => linearMap(v, 4.5, 2.5, 0, 100), 62);

  // M3 血压
  const sysScore = clampScore(linearMap(input.systolicBP, 140, 110, 0, 100));
  const diaScore = clampScore(linearMap(input.diastolicBP, 90, 75, 0, 100));
  const m3 = clampScore(sysScore * 0.5 + diaScore * 0.5);

  // M4 体成分 BMI
  let m4: number;
  if (input.bmi >= 18.5 && input.bmi <= 24) m4 = 100;
  else if (input.bmi >= 24 && input.bmi <= 28) m4 = 75;
  else if (input.bmi < 18.5 || (input.bmi > 28 && input.bmi <= 32)) m4 = 50;
  else m4 = 25;

  // M5 肝肾与基础慢病
  const liver = labScore(input.liverKidney, () => 100, 70);
  const chronicScore = clampScore(100 - input.chronicCount * 20);
  const controlScore = clampScore(linearMap(input.chronicControl, 0, 2, 40, 100));
  const hasChronic = input.chronicCount > 0;
  const m5 = hasChronic
    ? clampScore(liver * 0.5 + controlScore * 0.5)
    : clampScore(liver * 0.7 + chronicScore * 0.3);

  const subW = subWeights("M");
  const score = clampScore(m1 * subW.M1 + m2 * subW.M2 + m3 * subW.M3 + m4 * subW.M4 + m5 * subW.M5);

  return { score, details: { M1: m1, M2: m2, M3: m3, M4: m4, M5: m5 } };
}

/* ------------------- L 生活方式与行为指数 ------------------- */
export function scoreLifestyle(input: LifestyleInput): {
  score: number;
  details: Record<string, number>;
} {
  // L1 运动水平：每周 0-7 次
  const l1 = clampScore(linearMap(input.weeklyExercise, 0, 5, 0, 100));

  // L2 睡眠质量
  let sleepDurationScore: number;
  if (input.sleepHours >= 7 && input.sleepHours <= 8) sleepDurationScore = 100;
  else if (input.sleepHours >= 6 && input.sleepHours <= 9) sleepDurationScore = 75;
  else if (input.sleepHours >= 5 && input.sleepHours <= 10) sleepDurationScore = 50;
  else sleepDurationScore = 25;
  const sleepQualityScore = scale1to5(input.sleepQuality);
  const l2 = clampScore(sleepDurationScore * 0.5 + sleepQualityScore * 0.5);

  // L3 饮食质量
  const l3 = scale0to10(input.diet);

  // L4 烟酒
  const smokingScore = input.smoking === 0 ? 100 : input.smoking === 1 ? 85 : input.smoking === 2 ? 55 : 20;
  const alcoholScore = input.alcohol === 0 ? 100 : input.alcohol === 1 ? 75 : 30;
  const l4 = clampScore(smokingScore * 0.5 + alcoholScore * 0.5);

  // L5 体重管理与依从性
  const l5 = scale1to5(input.weightManagement);

  // L6 功能失衡负荷：来自功能医学问卷（失衡率 0-100，越高越差），未做时用中性估算分
  // 得分 = 100 − 失衡率/0.6：失衡率 0% 得满分，≥60% 得 0 分
  const l6 =
    input.functionalLoad !== null && input.functionalLoad !== undefined
      ? clampScore(100 - input.functionalLoad / 0.6)
      : 65;

  const subW = subWeights("L");
  const score = clampScore(
    l1 * subW.L1 + l2 * subW.L2 + l3 * subW.L3 + l4 * subW.L4 + l5 * subW.L5 + l6 * (subW.L6 ?? 0)
  );

  return { score, details: { L1: l1, L2: l2, L3: l3, L4: l4, L5: l5, L6: l6 } };
}

/* ------------------- P 心理认知与社交参与指数 ------------------- */
export function scorePsychosocial(input: PsychosocialInput): {
  score: number;
  details: Record<string, number>;
} {
  // P1 抑郁焦虑压力（mood 1-5，越高越好）
  const p1 = scale1to5(input.mood);
  // P2 认知健康与记忆
  const p2 = scale1to5(input.cognitiveHealth);
  // P3 社会连接与孤独感（反向）
  const p3 = clampScore(linearMap(input.loneliness, 5, 1, 0, 100));
  // P4 生活目标感/韧性
  const p4 = scale1to5(input.purpose);
  // P5 社交参与
  const p5 = freq0to5(input.socialActivity);

  const subW = subWeights("P");
  const score = clampScore(p1 * subW.P1 + p2 * subW.P2 + p3 * subW.P3 + p4 * subW.P4 + p5 * subW.P5);

  return { score, details: { P1: p1, P2: p2, P3: p3, P4: p4, P5: p5 } };
}

/* ------------------- D 数字健康轨迹指数 ------------------- */
export function scoreDigital(input: DigitalHealthInput): {
  score: number;
  details: Record<string, number>;
} {
  // D1 健康数据完整性
  const d1 = scale0to10(input.recordContinuity);
  // D2 设备数据质量
  const d2 = input.wearable === 0 ? 25 : input.wearable === 1 ? 60 : 100;
  // D3 指标改善趋势
  const d3 = labScore(input.improvingTrend, () => 100, 65);
  // D4 AI 风险预测
  const d4 = input.aiRiskPrediction !== null && input.aiRiskPrediction !== undefined
    ? clampScore(linearMap(input.aiRiskPrediction, 5, 1, 0, 100))
    : 70;
  // D5 管理依从性
  const d5 = freq0to5(input.adherence);

  const subW = subWeights("D");
  const score = clampScore(d1 * subW.D1 + d2 * subW.D2 + d3 * subW.D3 + d4 * subW.D4 + d5 * subW.D5);

  return { score, details: { D1: d1, D2: d2, D3: d3, D4: d4, D5: d5 } };
}

/* ------------------- 权重辅助 ------------------- */
function subWeights(dim: string): Record<string, number> {
  const subs = SUB_BY_DIMENSION[dim] || [];
  const w: Record<string, number> = {};
  for (const s of subs) w[s.key] = s.weight;
  return w;
}

/* ------------------- 维度元数据 ------------------- */
export const DIMENSION_NAMES: Record<string, string> = {
  B: "生物年龄指数",
  F: "功能健康指数",
  M: "代谢与慢病风险指数",
  L: "生活方式与行为指数",
  P: "心理认知与社交参与指数",
  D: "数字健康轨迹指数",
};

/** 构建单个维度得分对象 */
export function buildDimension(
  key: string,
  score: number,
  details: Record<string, number>,
  weight: number
): DimensionScore {
  const s = clampScore(score);
  return {
    key,
    name: DIMENSION_NAMES[key] || key,
    score: s,
    weight,
    level: levelFromScore(s) as RiskLevel,
    details,
  };
}
