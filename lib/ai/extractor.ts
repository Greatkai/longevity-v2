/**
 * AI 文本提取：从用户自由文本中解析健康信息，回填问卷。
 * 采用「AI 优先 + 规则兜底」双通道。
 */

export interface ExtractedData {
  bio: {
    actualAge: number | null;
    biologicalAge: number | null;
    immunity: number | null;
  };
  functional: {
    adl: number | null;
  };
  metabolic: {
    bmi: number | null;
    systolicBP: number | null;
    diastolicBP: number | null;
    hba1c: number | null;
    fastingGlucose: number | null;
    ldl: number | null;
    chronicCount: number | null;
    chronicControl: number | null;
  };
  lifestyle: {
    diet: number | null;
    sleepHours: number | null;
    sleepQuality: number | null;
    weeklyExercise: number | null;
    smoking: number | null;
    alcohol: number | null;
    weightManagement: number | null;
    stress: number | null;
  };
  psychosocial: {
    mood: number | null;
    cognitiveHealth: number | null;
    loneliness: number | null;
    purpose: number | null;
    socialActivity: number | null;
  };
  digital: {
    regularCheckup: number | null;
    wearable: number | null;
    recordContinuity: number | null;
    adherence: number | null;
  };
}

export function emptyExtracted(): ExtractedData {
  return {
    bio: { actualAge: null, biologicalAge: null, immunity: null },
    functional: { adl: null },
    metabolic: { bmi: null, systolicBP: null, diastolicBP: null, hba1c: null, fastingGlucose: null, ldl: null, chronicCount: null, chronicControl: null },
    lifestyle: { diet: null, sleepHours: null, sleepQuality: null, weeklyExercise: null, smoking: null, alcohol: null, weightManagement: null, stress: null },
    psychosocial: { mood: null, cognitiveHealth: null, loneliness: null, purpose: null, socialActivity: null },
    digital: { regularCheckup: null, wearable: null, recordContinuity: null, adherence: null },
  };
}

/** 从文本中提取数字（支持 "45岁"、"7小时" 等） */
function extractNumber(text: string, pattern: RegExp): number | null {
  const m = text.match(pattern);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return isNaN(n) ? null : n;
}

/** 关键词匹配到 1-5 量表 */
function keywordScore(
  text: string,
  keywords: string[],
  defaultValue: number | null = null
): number | null {
  for (let i = 0; i < keywords.length; i++) {
    if (text.includes(keywords[i])) return i + 1;
  }
  return defaultValue;
}

/** 规则兜底解析（AI 不可用时的本地提取） */
export function ruleBasedExtract(text: string): ExtractedData {
  const result = emptyExtracted();
  const t = text.toLowerCase();

  // 年龄
  result.bio.actualAge = extractNumber(t, /(?:年龄|今年|岁数)[^\d]*(\d{2})/) ?? null;
  result.bio.biologicalAge = extractNumber(t, /(?:生物年龄|生理年龄)[^\d]*(\d{2})/) ?? null;
  result.bio.immunity =
    keywordScore(t, ["免疫力很差", "抵抗力差", "免疫力一般", "免疫力不错", "免疫力很好", "抵抗力强"], null);

  // 功能健康
  result.functional.adl =
    keywordScore(t, ["无法自理", "需要帮助", "基本自理", "能自理", "完全自理", "行动自如"], null);

  // 代谢
  result.metabolic.bmi =
    extractNumber(t, /bmi[^\d]*(\d+(?:\.\d+)?)/) ??
    extractNumber(t, /(?:身体质量指数|体质指数)[^\d]*(\d+(?:\.\d+)?)/) ??
    null;
  const bp = t.match(/血压[^\d]*(\d+)\s*[\/、-]\s*(\d+)/);
  if (bp) {
    result.metabolic.systolicBP = parseInt(bp[1]);
    result.metabolic.diastolicBP = parseInt(bp[2]);
  }
  result.metabolic.hba1c =
    extractNumber(t, /(?:糖化血红蛋白|hba1c)[^\d]*(\d+(?:\.\d+)?)/) ?? null;
  result.metabolic.fastingGlucose =
    extractNumber(t, /(?:空腹血糖|血糖)[^\d]*(\d+(?:\.\d+)?)/) ?? null;
  result.metabolic.ldl =
    extractNumber(t, /(?:低密度脂蛋白|ldl)[^\d]*(\d+(?:\.\d+)?)/) ?? null;
  if (/糖尿病|高血压|高血脂|冠心病|慢阻肺/.test(t)) {
    const diseases = ["糖尿病", "高血压", "高血脂", "冠心病", "慢阻肺", "脑梗", "肾病"];
    const count = diseases.filter((d) => t.includes(d)).length;
    result.metabolic.chronicCount = Math.min(count, 6);
    result.metabolic.chronicControl =
      keywordScore(t, ["控制差", "控制一般", "控制良好"], null);
  } else if (/没有慢病|无慢病|健康/.test(t)) {
    result.metabolic.chronicCount = 0;
  }

  // 生活方式
  result.lifestyle.diet =
    extractNumber(t, /(?:饮食|膳食)[^\d]*(\d{1,2})/) ??
    keywordScore(t, ["很不健康", "不太健康", "一般", "比较健康", "非常健康", "很健康"], null);
  result.lifestyle.sleepHours =
    extractNumber(t, /(?:睡眠|睡觉)[^\d]*(\d+(?:\.\d+)?)\s*小?时?/) ??
    extractNumber(t, /(\d+(?:\.\d+)?)\s*小?时?\s*(?:睡眠|睡觉)/) ??
    null;
  result.lifestyle.sleepQuality =
    keywordScore(t, ["失眠严重", "睡眠差", "睡眠一般", "睡眠不错", "睡眠很好", "睡眠极好"], null);
  result.lifestyle.weeklyExercise =
    extractNumber(t, /(?:每周|一周)[^\d]*(\d)[^\d]*(?:次|天)[^\d]*(?:运动|锻炼)/) ??
    extractNumber(t, /(?:运动|锻炼)[^\d]*(\d)[^\d]*(?:次|天)\s*(?:每周|一周)?/) ??
    null;
  if (/吸烟|抽烟|烟龄|每天.*烟/.test(t)) {
    result.lifestyle.smoking = /从不|不吸烟|戒烟/.test(t) ? 0 : /偶尔|少量/.test(t) ? 2 : 3;
  } else if (/不吸烟|从不吸烟|戒烟/.test(t)) {
    result.lifestyle.smoking = 0;
  }
  if (/喝酒|饮酒|酒精/.test(t)) {
    result.lifestyle.alcohol = /从不|不喝|戒酒/.test(t) ? 0 : /偶尔|少量/.test(t) ? 1 : 2;
  } else if (/不喝酒|不饮酒/.test(t)) {
    result.lifestyle.alcohol = 0;
  }
  result.lifestyle.weightManagement =
    keywordScore(t, ["不关注体重", "很少管理", "一般", "比较重视", "很重视体重", "严格管理"], null);
  result.lifestyle.stress =
    keywordScore(t, ["压力很大", "压力大", "压力一般", "压力较小", "没有压力", "压力很小"], null);

  // 心理
  result.psychosocial.mood =
    keywordScore(t, ["情绪很差", "情绪差", "情绪一般", "情绪不错", "情绪很好", "心情非常好"], null);
  result.psychosocial.cognitiveHealth =
    keywordScore(t, ["记忆力很差", "记性差", "记性一般", "记性不错", "记性好", "记忆力很好"], null);
  result.psychosocial.loneliness =
    keywordScore(t, ["很孤独", "经常孤独", "有时孤独", "偶尔孤独", "不孤独", "从不孤独"], null);
  result.psychosocial.purpose =
    keywordScore(t, ["没有目标", "目标模糊", "目标一般", "比较有目标", "目标明确", "目标感很强"], null);
  result.psychosocial.socialActivity =
    keywordScore(t, ["不社交", "很少社交", "偶尔社交", "经常社交", "每天社交", "很活跃"], null);

  // 数字健康
  if (/每年体检|定期体检|体检/.test(t)) {
    result.digital.regularCheckup = /不体检|没体检/.test(t) ? 0 : 1;
  }
  if (/手环|手表|可穿戴|监测设备/.test(t)) {
    result.digital.wearable = /经常/.test(t) ? 2 : /偶尔/.test(t) ? 1 : 1;
  }
  result.digital.recordContinuity =
    extractNumber(t, /(?:记录|监测)连续性[^\d]*(\d{1,2})/) ?? null;
  result.digital.adherence =
    keywordScore(t, ["不坚持", "很少坚持", "偶尔坚持", "经常坚持", "很坚持", "严格坚持"], null);

  return result;
}
