import type { AssessmentResult } from "@/lib/chli-model";
import { RISK_META } from "@/lib/chli-model";
import { LAB_CHECKLIST } from "@/lib/chli-model/sub-indicators";

/** 检验项到 available 路径的映射 */
const LAB_AVAILABLE_PATHS: Record<string, string> = {
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

/** 判断某检验项是否已提供（基于报告 sourceData） */
function hasLabProvided(sourceData: Record<string, unknown> | undefined, subKey: string): boolean {
  if (!sourceData) return false;
  const p = LAB_AVAILABLE_PATHS[subKey];
  if (!p) return false;
  const keys = p.split(".");
  let cur: unknown = sourceData;
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return false;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur === 1 || cur === true;
}

/** 基于规则的本地解读生成（AI 不可用时的兜底） */
export function generateRuleInsights(r: AssessmentResult): string {
  const meta = RISK_META[r.level];
  const lines: string[] = [];
  const sourceData = (r as unknown as { sourceData?: Record<string, unknown> })?.sourceData;

  // 总体评估
  lines.push(`## 总体评估`);
  lines.push(
    `您的综合长寿指数为 **${r.chliScore.toFixed(1)} 分**，健康等级为 **「${r.label}」**。${meta.description}`
  );
  lines.push("");

  // 生物年龄
  const gap = r.bioAge.ageGap;
  lines.push(`## 生物年龄分析`);
  if (gap < -2) {
    lines.push(
      `您的生物年龄（**${r.bioAge.biologicalAge} 岁**）比实际年龄年轻 **${Math.abs(gap)} 岁**，说明您的细胞功能与身体机能处于同龄人中的优秀水平，衰老速度较慢。这是长期健康生活方式的积极回报，值得继续保持。`
    );
    lines.push(`\n建议将这一优势转化为系统化的健康管理：坚持当前的运动与作息，并定期（每年 1 次）复查生物标志物，把良好的身体状态长期锁定。`);
  } else if (gap > 2) {
    lines.push(
      `您的生物年龄（**${r.bioAge.biologicalAge} 岁**）比实际年龄大 **${gap} 岁**，提示身体衰老速度相对偏快。这通常是生活方式、代谢状态或慢性压力长期累积的结果，但也意味着有较大的改善空间。`
    );
    lines.push(`\n建议重点关注三方面：① 改善睡眠质量，保证每晚 7-8 小时；② 增加规律运动（每周至少 150 分钟中等强度）；③ 通过饮食与减压管理代谢指标。通常坚持 3-6 个月即可看到积极变化。`);
  } else {
    lines.push(
      `您的生物年龄（**${r.bioAge.biologicalAge} 岁**）与实际年龄基本相当，处于正常衰老轨道。这说明您的基础健康状况良好，无需过度担忧。`
    );
    lines.push(`\n建议通过优化饮食结构、保持规律运动和积极心态，进一步拉大"生物年龄比实际年龄年轻"的优势区间。`);
  }
  lines.push("");

  // 维度排序
  const sorted = [...r.dimensions].sort((a, b) => b.score - a.score);
  const strength = sorted[0];
  const weak = sorted[sorted.length - 1];

  lines.push(`## 优势维度`);
  lines.push(
    `得分最高的维度是 **${strength.name}**（**${strength.score.toFixed(1)} 分**），这是您健康寿命的重要支撑。${dimensionPraise(strength.key)}`
  );
  lines.push("");

  lines.push(`## 重点关注`);
  if (weak.score < 55) {
    lines.push(
      `当前最需关注的维度是 **${weak.name}**（**${weak.score.toFixed(1)} 分**），该维度对整体健康影响较大，建议优先改善。${dimensionAdvice(weak.key)}`
    );
  } else if (weak.score < 70) {
    lines.push(
      `相对薄弱的维度是 **${weak.name}**（**${weak.score.toFixed(1)} 分**），仍有明显提升空间，可结合自身情况针对性优化。${dimensionAdvice(weak.key)}`
    );
  } else {
    lines.push(
      `各维度表现较为均衡，**${weak.name}**（**${weak.score.toFixed(1)} 分**）为相对较低项，可适当加强以锦上添花。${dimensionAdvice(weak.key)}`
    );
  }
  lines.push("");

  // 各维度快速体检
  lines.push(`## 各维度快速体检`);
  sorted.forEach((d) => {
    const tag = d.level === "excellent" ? "优秀" : d.level === "good" ? "良好" : d.level === "moderate" ? "中等" : "待改善";
    lines.push(`- **${d.name}**：${d.score.toFixed(1)} 分（${tag}）`);
  });
  lines.push("");

  // 改善建议
  lines.push(`## 改善建议`);
  const tips = buildTips(weak.key, sorted.map((s) => s.key));
  tips.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  lines.push("");

  // 建议完善检查（基于缺失的检验项）
  const missingLabs = LAB_CHECKLIST.filter((item) => !hasLabProvided(sourceData, item.subKey));
  if (missingLabs.length > 0) {
    lines.push(`## 建议完善检查`);
    lines.push(`为让评估结果更精准，建议您补充以下检验/检查项目（可前往医院体检或门诊开具）：`);
    missingLabs.forEach((item) => {
      lines.push(`- **${item.name}**（${item.dimension} 维度）：${item.tests}`);
    });
    lines.push(`> 提示：补充检验数据后重新评估，可显著提高各项指数与风险评估的准确性。`);
    lines.push("");
  }

  // 健康展望
  lines.push(`## 健康展望`);
  lines.push(
    `长寿并非单一因素决定，而是多系统协同的结果。您当前的综合表现为 **${r.label}**，通过聚焦薄弱维度、巩固优势维度，并将健康管理融入日常，多数可干预的风险因素都能得到显著改善。`
  );
  lines.push(
    `建议以 **90 天** 为一个改善周期，每 3 个月重新评估一次，动态跟踪各项指标变化，让健康寿命的提升看得见、可衡量。`
  );
  lines.push("");
  lines.push(`> 温馨提示：本报告由系统自动生成，仅供参考，不构成医疗诊断建议。如有持续不适，请及时就医。`);

  return lines.join("\n");
}

/** 优势维度点评 */
function dimensionPraise(key: string): string {
  const map: Record<string, string> = {
    B: "说明您的身体衰老速度控制得当，生命活力充沛，这是极佳的健康信号。",
    F: "说明您的躯体功能、认知能力与自理能力俱佳，是高质量生活的坚实基础。",
    M: "说明您的代谢指标与慢病风险控制良好，是心血管健康和远期寿命的保障。",
    L: "说明您拥有科学健康的生活方式，这是所有健康资本中最具掌控力的一环。",
    P: "说明您情绪积极、心理韧性强、社会联结良好，心理健康是长寿的重要软实力。",
    D: "说明您健康管理意识强、监测规律，数据驱动的管理让健康更可控。",
  };
  return map[key] || "这是您健康资本的重要组成部分，请继续保持。";
}

/** 薄弱维度针对性建议 */
function dimensionAdvice(key: string): string {
  const map: Record<string, string> = {
    B: "建议从抗炎饮食、规律运动与优质睡眠入手延缓生物衰老，并定期检测关键生物标志物。",
    F: "建议增加力量训练与平衡训练，坚持认知刺激活动（如阅读、学习新技能），预防功能衰退。",
    M: "建议严格管理血压、血糖、血脂与体重，采用地中海饮食并遵医嘱规范用药。",
    L: "建议优先保障睡眠时长与质量，规律运动，戒烟限酒，并学会压力管理。",
    P: "建议主动建立社交联结，参与兴趣社群，练习正念冥想，减少孤独感与情绪内耗。",
    D: "建议建立规律的健康监测习惯，善用可穿戴设备记录数据，形成个人健康档案。",
  };
  return map[key] || "建议结合专业健康评估制定个性化改善方案。";
}

function buildTips(weakKey: string, keys: string[]): string[] {
  const tips: Record<string, string[]> = {
    B: [
      "每年进行一次全面的生物标志物检测（血压、血糖、血脂、炎症因子等），追踪身体年龄变化",
      "通过规律运动、优质睡眠和抗炎饮食，从根源延缓生物衰老",
    ],
    F: [
      "保持每周至少 150 分钟的中等强度运动（快走、游泳、骑行等），增强心肺与肌肉功能",
      "进行力量训练与平衡训练（如深蹲、单腿站立），预防肌肉流失与跌倒风险",
      "坚持认知训练（阅读、拼图、学习新技能），维护大脑活力",
    ],
    M: [
      "将 BMI 控制在 18.5-24 的理想范围，减少内脏脂肪",
      "严格管理血压、血糖、血脂，遵医嘱用药并定期复查",
      "采用地中海式饮食（全谷物、蔬果、优质蛋白、健康脂肪），控制钠盐与精制糖摄入",
    ],
    L: [
      "保证每晚 7-8 小时高质量睡眠，固定作息时间",
      "戒烟限酒，减少压力源，练习正念或冥想舒缓情绪",
      "坚持均衡饮食，减少高油、高糖、高盐加工食品",
    ],
    P: [
      "保持积极情绪，建立规律的社交活动，降低孤独感",
      "持续学习与思考，参加社区活动或兴趣小组，维护认知与心理活力",
    ],
    D: [
      "坚持每年 1 次体检，有慢病者遵医嘱增加监测频率",
      "善用可穿戴设备记录心率、睡眠、活动等健康数据，建立个人健康档案",
    ],
  };

  const primary = tips[weakKey] || [];
  const otherKeys = keys.filter((k) => k !== weakKey);
  const secondary = otherKeys.slice(0, 2).flatMap((k) => (tips[k] ? [tips[k][0]] : []));
  return [...primary, ...secondary].slice(0, 5);
}
