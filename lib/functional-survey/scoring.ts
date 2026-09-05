import type {
  FMAnswers,
  FMCategories,
  FMQuestion,
  FMDiff,
  FMDiffStatus,
  FMScoreResult,
  FMSelection,
  FMStage1Score,
  FMStage2Score,
  FMImbalanceResult,
  FMSurveyRecord,
  FMMainProblems,
} from "./types";
import {
  FM_DATA,
  FM_QUESTION_BY_ID,
  FM_STAGE1_SECTION,
  FM_STAGE2_SECTIONS,
  FM_IMBALANCES,
  FM_CATEGORY_KEYS,
} from "./questions";

/**
 * 功能医学问卷评分引擎（移植自 health-survey-v2 lib/scoring.js）
 * 两阶段评分：
 *   Stage 1：23 题整体健康评估 -> 计算 7 大失衡领域阳性率 -> 选择主要异常领域
 *   Stage 2：针对选中领域做 15 题深入评估 -> 结合 Stage1 生成干预建议
 * 综合分 = Stage1 60% + Stage2 40%（均归一化为百分比）
 */

/* ---------- 阳性回答判定 ---------- */

/** 返回 true=阳性，0.5=边缘，false=阴性 */
export function isPositive(q: FMQuestion, val: unknown): boolean | number {
  if (val === null || val === undefined || val === "") return false;

  // 多选题：选择了非"无"选项即视为阳性
  if (q.type === "checkbox") {
    if (!Array.isArray(val) || val.length === 0) return false;
    const ignore = ["E. 无", "D. 无", "无", "未服药", "不运动", "不饮酒"];
    return val.filter((v) => !ignore.includes(v)).length > 0;
  }

  // radio_other：选择"其他/说明"分支视为阳性
  if (q.type === "radio_other") {
    return typeof val === "string" && val.startsWith("__other__");
  }

  // 食物频率题不纳入阳性统计（作为原始信息保留）
  if (q.type === "foodfreq") return false;

  // 既往史：有=阳性，不详=边缘
  if (q.type === "diseasehist") {
    if (typeof val !== "object" || val === null || Array.isArray(val)) return false;
    const v = val as { status?: string };
    if (v.status === "有") return 1;
    if (v.status === "不详") return 0.5;
    return false;
  }

  // 数值/文本题不纳入阳性统计（作为原始信息保留）
  if (q.type === "text" || q.type === "number" || q.type === "textarea") return false;

  if (q.type === "radio") {
    const text = String(val);
    // 明确阳性选项
    if (["是", "是，经常", "经常", "几乎每天"].includes(text)) return true;
    // 部分问题中的"偶尔"计为 0.5（边缘）
    if (["偶尔", "偶尔饮酒", "偶尔吸烟", "晚10-12点"].includes(text)) return 0.5;
    // 生活质量类风险选项
    const riskOptions = [
      "很差，长期失眠",
      "较差，经常入睡困难或早醒",
      "非常不规律，经常跳过一餐",
      "不太规律，经常饥饱不定",
      "很少吃蔬菜水果",
      "不足（蔬菜少于300g）",
      "几乎每天",
      "每周7次及以上",
      "每天饮酒",
      "每天10支以上",
      "每天10-20支",
      "每天20支以上",
      "每天21支以上",
      "每天5-10支",
      "偶尔吸烟",
      "已戒烟（不满1年）",
      "经常饮酒（每周2次及以上）",
      "12小时以上",
      "8-12小时",
      "4-8小时",
      "大于8小时",
      "是，请说明：",
      "明显增加",
      "明显减少",
      "经常焦虑或抑郁",
      "从不或偶尔",
      "不运动",
      "少于4小时",
      "4-6小时",
      "12点以后",
    ];
    if (riskOptions.includes(text)) return true;
    return false;
  }

  return false;
}

/** 数值化的阳性权重（1=阳性，0.5=边缘，0=阴性） */
export function positiveWeight(q: FMQuestion, val: unknown): number {
  const r = isPositive(q, val);
  return typeof r === "number" ? r : r ? 1 : 0;
}

export function isYesAnswer(val: unknown): boolean {
  return String(val) === "是" || String(val) === "是，经常";
}

/* ---------- Stage 1 评分 ---------- */

export function scoreStage1(answers: FMAnswers): Record<string, FMStage1Score> {
  const overall = FM_STAGE1_SECTION;
  const mapping = overall.mapping ?? {};
  const scores: Record<string, FMStage1Score> = {};

  Object.keys(mapping).forEach((cat) => {
    const nums = mapping[cat];
    let yes = 0;
    const total = nums.length;
    nums.forEach((num) => {
      const qid = `ov_${num}`;
      const q = FM_QUESTION_BY_ID[qid];
      const v = answers[qid];
      if (q && q.type === "checkbox") {
        if (isPositive(q, v)) yes += 1;
      } else if (isYesAnswer(v)) {
        yes += 1;
      }
    });
    scores[cat] = {
      yes,
      total,
      rate: total > 0 ? Math.round((yes / total) * 1000) / 10 : 0,
    };
  });

  return scores;
}

/* ---------- 选择进入 Stage 2 的领域 ---------- */

export function selectCategories(
  scores: Record<string, FMStage1Score>,
  options: { threshold?: number; minCount?: number; maxCount?: number } = {}
): FMSelection {
  const threshold = options.threshold ?? 30; // 阳性率≥30%进入Stage2
  const minCount = options.minCount ?? 2;    // 至少保留top2
  const maxCount = options.maxCount ?? 4;    // 最多4个

  const list = Object.keys(scores).map((cat) => ({
    cat: cat as FMCategories,
    ...scores[cat],
  }));
  list.sort((a, b) => b.rate - a.rate || b.yes - a.yes);

  const selected: FMCategories[] = [];
  list.forEach((item, idx) => {
    if (idx < minCount || item.rate >= threshold) {
      if (selected.length < maxCount) selected.push(item.cat);
    }
  });

  return { selected, ranked: list, threshold };
}

/* ---------- Stage 2 评分 ---------- */

export function scoreStage2(
  answers: FMAnswers,
  categories: FMCategories[]
): Record<string, FMStage2Score> {
  const scores: Record<string, FMStage2Score> = {};

  FM_STAGE2_SECTIONS.forEach((sec) => {
    if (!sec.category || !categories.includes(sec.category)) return;
    let yes = 0;
    let edge = 0;
    let total = 0;
    sec.questions.forEach((q) => {
      // "不适用"不计入分母
      if (answers[q.qid] === "不适用") return;
      total += 1;
      const w = positiveWeight(q, answers[q.qid]);
      if (w === 1) yes += 1;
      else if (w === 0.5) edge += 1;
    });
    scores[sec.category] = {
      yes,
      edge,
      total,
      rate: total > 0 ? Math.round(((yes + edge * 0.5) / total) * 1000) / 10 : 0,
    };
  });

  return scores;
}

/* ---------- 综合失衡评估 ---------- */

export function computeImbalances(answers: FMAnswers): FMScoreResult {
  const stage1 = scoreStage1(answers);
  const selection = selectCategories(stage1);
  const stage2 = scoreStage2(answers, selection.selected);

  // 综合分 = Stage1 60% + Stage2 40%
  const combined: Record<string, FMImbalanceResult> = {};
  FM_CATEGORY_KEYS.forEach((cat) => {
    const s1 = stage1[cat] || { yes: 0, total: 0, rate: 0 };
    const s2 = stage2[cat];
    let rate: number;
    if (s2) {
      rate = Math.round((s1.rate * 0.6 + s2.rate * 0.4) * 10) / 10;
    } else {
      rate = s1.rate;
    }
    combined[cat] = {
      stage1: s1,
      stage2: s2 ?? null,
      rate,
      selected: selection.selected.includes(cat),
    };
  });

  // 排序（降序，附带类别元数据）
  const ranked = FM_CATEGORY_KEYS.map((cat) => ({
    cat,
    ...combined[cat],
    ...FM_IMBALANCES[cat],
  })).sort((a, b) => b.rate - a.rate);

  return { stage1, selection, stage2, combined, ranked };
}

/* ---------- 主要问题摘要 ---------- */

export function buildMainProblems(answers: FMAnswers): FMMainProblems {
  const a = answers;
  const lines: string[] = [];

  // 1. 失衡领域
  const im = computeImbalances(answers);
  const top = im.ranked.filter((x) => x.rate >= 30);
  if (top.length > 0) {
    lines.push("主要失衡领域：" + top.map((x) => `${x.name}（${x.rate}%）`).join("、"));
  } else {
    lines.push(
      "主要失衡领域：" + im.ranked.slice(0, 2).map((x) => `${x.name}（${x.rate}%）`).join("、")
    );
  }

  // 2. 饮食（食物频率调查）
  const freqOf = (qid: string): string => {
    const v = a[qid];
    return v && typeof v === "object" && !Array.isArray(v) && "freq" in v && v.freq
      ? String(v.freq)
      : "";
  };
  const rare = (f: string) => f === "不吃" || f === "每月";
  const often = (f: string) => f === "每天" || f === "每周";
  const dietNotes: string[] = [];
  if (rare(freqOf("diet_veg")) || rare(freqOf("diet_fruit"))) dietNotes.push("蔬菜水果摄入不足");
  if (rare(freqOf("diet_wholegrain")) && rare(freqOf("diet_tuber"))) dietNotes.push("粗粮摄入不足");
  if (often(freqOf("diet_fat_meat")) || often(freqOf("diet_offal"))) dietNotes.push("肥肉/内脏偏多");
  if (rare(freqOf("diet_seafood")) && rare(freqOf("diet_seaweed"))) dietNotes.push("水产摄入不足");
  if (rare(freqOf("diet_milk")) && rare(freqOf("diet_soy"))) dietNotes.push("奶豆摄入不足");
  const junkItems = ["diet_sweets", "diet_drink", "diet_processed", "diet_fried", "diet_fastfood"];
  if (junkItems.some((k) => often(freqOf(k)))) dietNotes.push("精加工/不健康食品偏多");
  if (often(freqOf("diet_pickle"))) dietNotes.push("咸菜偏多");
  if (often(freqOf("diet_eating_out"))) dietNotes.push("在外就餐频繁");
  if (["偶尔吸烟", "每天5-10支", "每天10-20支", "每天21支以上"].includes(String(a.hab_smoke)))
    dietNotes.push("吸烟");
  if (["经常饮酒（每周2次及以上）", "每天饮酒"].includes(String(a.hab_alcohol)))
    dietNotes.push("饮酒频繁");
  if (dietNotes.length) lines.push("饮食：" + dietNotes.join("、"));

  // 3. 生活习惯与运动
  const habNotes: string[] = [];
  if (["4-8小时", "大于8小时"].includes(String(a.hab_screen))) habNotes.push("屏幕时间过长");
  if (["从不或偶尔"].includes(String(a.ex_freq))) habNotes.push("运动不足");
  if (
    Array.isArray(a.ex_type) &&
    a.ex_type.includes("不运动") &&
    a.ex_freq !== "从不或偶尔"
  )
    habNotes.push("缺乏运动方式");
  if (habNotes.length) lines.push("生活习惯：" + habNotes.join("、"));

  // 4. 睡眠
  const slNotes: string[] = [];
  if (["少于4小时", "4-6小时"].includes(String(a.sleep_duration))) slNotes.push("睡眠不足");
  if (a.sleep_bedtime === "12点以后") slNotes.push("晚睡");
  if (
    ["较差，经常入睡困难或早醒", "很差，长期失眠"].includes(String(a.sleep_quality))
  )
    slNotes.push("睡眠质量差");
  if (slNotes.length) lines.push("睡眠：" + slNotes.join("、"));

  // 5. 疾病史与用药（既往史）
  const dis: string[] = [];
  const disSec = FM_DATA.sections.find((s) => s.id === "disease");
  if (disSec) {
    disSec.questions.forEach((q) => {
      if (q.type !== "diseasehist") return;
      const v = a[q.qid];
      if (v && typeof v === "object" && !Array.isArray(v) && (v as { status?: string }).status === "有")
        dis.push(q.short || q.text);
    });
  }
  if (Array.isArray(a.dis_medication) && a.dis_medication.filter((x) => x !== "未服药").length > 0) {
    dis.push("长期用药（" + a.dis_medication.filter((x) => x !== "未服药").join("、") + "）");
  }
  if (dis.length) lines.push("疾病史：" + dis.join("、"));

  // 6. 不适症状（近半年，经常出现）
  const sym: string[] = [];
  const symSec = FM_DATA.sections.find((s) => s.id === "discomfort");
  if (symSec) {
    symSec.questions.forEach((q) => {
      if (a[q.qid] === "经常") sym.push(q.short || q.text);
    });
  }
  if (sym.length) lines.push("不适症状：" + sym.join("、"));

  return { lines, imbalances: im };
}

/* ---------- 复测 diff（按领域与题目） ---------- */

export function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (Array.isArray(v)) return v.join("、");
  if (typeof v === "string" && v.startsWith("__other__")) return v.replace("__other__", "");
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    // 食物频率：{freq, count, amount}
    if (obj.freq) {
      if (obj.freq === "不吃") return "不吃";
      const cnt = obj.count && Number(obj.count) > 0 ? `${obj.count}次` : "";
      return `${obj.freq}${cnt}${obj.amount ? "·" + obj.amount : ""}`;
    }
    // 既往史：{status, detail}
    if (obj.status) {
      return obj.status + (obj.detail ? `（${obj.detail}）` : "");
    }
    return JSON.stringify(v);
  }
  return String(v);
}

export function computeDiff(prevRecord: FMSurveyRecord, newRecord: FMSurveyRecord): FMDiff {
  const diff: FMDiff = { byQuestion: {}, byCategory: {}, stats: { improved: 0, worsened: 0, persistent: 0, changed: 0 } };
  const prev = prevRecord.answers;
  const next = newRecord.answers;

  FM_DATA.sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      const oldV = prev[q.qid];
      const newV = next[q.qid];
      const os = formatValue(oldV);
      const ns = formatValue(newV);

      if (q.type === "text" || q.type === "number" || q.type === "textarea") {
        if (os !== ns && os !== "" && ns !== "" && !["basic_name", "basic_phone"].includes(q.qid)) {
          diff.byQuestion[q.qid] = { old: os, new: ns, status: "changed", section: sec.id };
        }
        return;
      }

      const op = positiveWeight(q, oldV);
      const np = positiveWeight(q, newV);
      let status: FMDiffStatus | null = null;
      if (op >= 1 && np < 1) status = "improved";
      else if (op < 1 && np >= 1) status = "worsened";
      else if (op >= 1 && np >= 1) status = "persistent";
      else if (op === 0.5 && np === 0) status = "improved";
      else if (op === 0 && np === 0.5) status = "worsened";

      if (status) {
        diff.byQuestion[q.qid] = { old: os, new: ns, status, section: sec.id };
      }
    });
  });

  // 按失衡领域统计变化
  const prevIm = computeImbalances(prev);
  const newIm = computeImbalances(next);
  FM_CATEGORY_KEYS.forEach((cat) => {
    const oldRate = prevIm.combined[cat].rate;
    const newRate = newIm.combined[cat].rate;
    const delta = Math.round((newRate - oldRate) * 10) / 10;
    let status = "stable";
    if (delta <= -10) status = "improved";
    else if (delta >= 10) status = "worsened";
    diff.byCategory[cat] = { oldRate, newRate, delta, status };
  });

  // 汇总统计
  Object.values(diff.byQuestion).forEach((v) => {
    if (diff.stats[v.status] !== undefined) diff.stats[v.status]++;
  });

  return diff;
}
