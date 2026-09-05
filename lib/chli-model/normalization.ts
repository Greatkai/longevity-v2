import type { RiskLevel, RiskMeta } from "./types";

/** 风险等级阈值定义（得分越高越健康） */
export const RISK_LEVELS: { min: number; level: RiskLevel }[] = [
  { min: 85, level: "excellent" },
  { min: 70, level: "good" },
  { min: 55, level: "moderate" },
  { min: 40, level: "risk" },
  { min: 0, level: "highRisk" },
];

/** 风险等级元数据（含展示样式） */
export const RISK_META: Record<RiskLevel, RiskMeta> = {
  excellent: {
    level: "excellent",
    label: "优秀",
    color: "#10B981",
    description: "健康寿命状态极佳，各项指标处于理想水平，有望实现高质量百岁人生。",
  },
  good: {
    level: "good",
    label: "良好",
    color: "#0EA5E9",
    description: "总体健康状况良好，个别维度存在改善空间，坚持健康管理可更上层楼。",
  },
  moderate: {
    level: "moderate",
    label: "中等",
    color: "#F59E0B",
    description: "健康状况处于中等水平，存在一定可干预风险因素，建议针对性改善。",
  },
  risk: {
    level: "risk",
    label: "偏高",
    color: "#EF4444",
    description: "存在较多健康风险因素，需高度重视并积极干预，延缓衰老进程。",
  },
  highRisk: {
    level: "highRisk",
    label: "高风险",
    color: "#B91C1C",
    description: "健康风险因素突出，强烈建议尽快就医并进行系统性健康管理。",
  },
};

/** 将任意数值钳制到 0-100 */
export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** 根据 0-100 得分判定风险等级 */
export function levelFromScore(score: number): RiskLevel {
  const s = clampScore(score);
  for (const { min, level } of RISK_LEVELS) {
    if (s >= min) return level;
  }
  return "highRisk";
}

/** 标准化得分标签 */
export function scoreLabel(score: number): string {
  const s = clampScore(score);
  if (s >= 85) return "非常健康";
  if (s >= 70) return "健康";
  if (s >= 55) return "中等";
  if (s >= 40) return "需关注";
  return "高风险";
}

/** 线性映射工具：将 value 从 [inMin, inMax] 映射到 [outMin, outMax]，反向映射用于高分表示健康 */
export function linearMap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  reversed = false
): number {
  if (inMax === inMin) return (outMin + outMax) / 2;
  const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
  const raw = outMin + t * (outMax - outMin);
  return reversed ? outMin + (outMax - raw) : raw;
}
