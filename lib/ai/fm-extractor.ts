import type { FMAnswers, FMQuestion } from "@/lib/functional-survey/types";
import { FM_SECTIONS, FM_QUESTION_BY_ID } from "@/lib/functional-survey/questions";

/**
 * 功能医学问卷「规则兜底」提取：
 * 从自然语言健康描述中按关键词/正则解析问卷答案（无需 AI Key）。
 * 覆盖：基本信息、习惯、运动、睡眠、既往史、用药、症状、总体评估（ov_*）、常见食物频率。
 */

/** 中文数字转阿拉伯数字 */
function cnNum(s: string): number {
  const map: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  return map[s] ?? 0;
}

/** 判断关键词前是否为否定表述（没有/无/不曾/未） */
function isNegated(text: string, index: number): boolean {
  const before = text.slice(Math.max(0, index - 4), index);
  return /没有|无|不曾|未|不$/.test(before);
}

export function ruleBasedFMExtract(text: string): FMAnswers {
  const t = text;
  const out: FMAnswers = {};

  const setRadio = (qid: string, value: string) => {
    const q = FM_QUESTION_BY_ID[qid];
    if (q?.options?.includes(value)) out[qid] = value;
  };

  /* ---------- 基本信息 ---------- */
  const nameMatch = t.match(/(?:我叫|名字[是叫])\s*([\u4e00-\u9fa5]{2,4})/);
  if (nameMatch) out.basic_name = nameMatch[1];
  const phoneMatch = t.match(/1[3-9]\d{9}/);
  if (phoneMatch) out.basic_phone = phoneMatch[0];
  if (/男性|是个男|性别男|男的/.test(t)) out.basic_gender = "男";
  else if (/女性|是个女|性别女|女的/.test(t)) out.basic_gender = "女";
  const ageMatch = t.match(/(\d{2})\s*岁/);
  if (ageMatch) out.basic_age = parseInt(ageMatch[1]);
  const heightMatch = t.match(/身高\s*(\d{3})\s*(?:cm|CM|厘米)?/);
  if (heightMatch) out.basic_height = parseInt(heightMatch[1]);
  const weightMatch = t.match(/体重\s*(\d{2,3})\s*(?:kg|KG|公斤)?/);
  if (weightMatch) out.basic_weight = parseInt(weightMatch[1]);

  /* ---------- 生活习惯 ---------- */
  if (/从不吸烟|不吸烟|不抽烟/.test(t)) out.hab_smoke = "不吸烟";
  else if (/戒烟[^。，；]{0,6}(一年|1年|满一年)/.test(t)) out.hab_smoke = "已戒烟（1年以上）";
  else if (/戒烟/.test(t)) out.hab_smoke = "已戒烟（不满1年）";
  else {
    const smokeMatch = t.match(/每天\s*(\d+)\s*[-~到至]\s*(\d+)\s*支/);
    if (smokeMatch) {
      const a = parseInt(smokeMatch[1]);
      out.hab_smoke = a <= 5 ? "每天5-10支" : a <= 15 ? "每天10-20支" : "每天21支以上";
    } else if (/每天.*?(21|20)支以上|每天一包多/.test(t)) out.hab_smoke = "每天21支以上";
    else if (/偶尔吸烟|偶尔抽烟|偶尔抽/.test(t)) out.hab_smoke = "偶尔吸烟";
  }

  if (/不喝酒|不饮酒|从不喝酒|从不饮酒/.test(t)) out.hab_alcohol = "不饮酒";
  else if (/每天饮酒|天天喝酒|每天都喝/.test(t)) out.hab_alcohol = "每天饮酒";
  else if (/经常饮酒|经常喝酒|每周.{0,4}次.{0,3}酒|应酬多/.test(t))
    out.hab_alcohol = "经常饮酒（每周2次及以上）";
  else if (/偶尔喝酒|偶尔饮酒|少量喝酒|偶尔喝点|喝点酒/.test(t)) out.hab_alcohol = "偶尔饮酒";
  if (out.hab_alcohol) {
    const types: string[] = [];
    if (/红酒|葡萄酒/.test(t)) types.push("红酒");
    if (/白酒/.test(t)) types.push("白酒");
    if (/啤酒/.test(t)) types.push("啤酒");
    if (types.length > 0) out.hab_alcohol_type = types;
  }

  const screenMatch = t.match(/(?:看手机|玩手机|使用电脑|上网|屏幕时间)[^\d]{0,4}(\d+(?:\.\d+)?)\s*小时/);
  if (screenMatch) {
    const h = parseFloat(screenMatch[1]);
    out.hab_screen =
      h < 1 ? "小于1小时" : h <= 3 ? "2-3小时" : h <= 8 ? "4-8小时" : "大于8小时";
  }

  /* ---------- 运动情况 ---------- */
  if (/从不运动|不运动|没有运动/.test(t)) {
    out.ex_freq = "从不或偶尔";
    out.ex_duration = "不运动";
  } else {
    const exMatch = t.match(/(?:每周|一周)[^。；]{0,8}?运动\s*(\d+)\s*次/);
    if (exMatch) {
      const n = parseInt(exMatch[1]);
      out.ex_freq = n >= 5 ? "每周5次以上" : n >= 2 ? "每周2-4次" : "每周1次";
    }
    const durMatch = t.match(/每次运动\s*(\d+(?:\.\d+)?)\s*小时/) ?? t.match(/运动\s*(\d+(?:\.\d+)?)\s*小时/);
    if (durMatch) {
      const h = parseFloat(durMatch[1]);
      out.ex_duration = h < 1 ? "0.5-1小时" : h <= 2 ? "1-2小时" : "2-4小时";
    } else if (/半小时/.test(t) && /运动/.test(t)) out.ex_duration = "0.5-1小时";
    const exTypes = ["散步", "快走", "跑步", "太极", "健身房", "跳舞", "瑜伽", "打球"].filter((x) =>
      t.includes(x)
    );
    if (exTypes.length > 0) out.ex_type = exTypes;
  }

  /* ---------- 睡眠情况 ---------- */
  const sleepH = t.match(/(?:每晚|每天)?(?:睡眠|睡觉)\s*(\d+(?:\.\d+)?)\s*小时/);
  if (sleepH) {
    const h = parseFloat(sleepH[1]);
    out.sleep_duration = h > 8 ? "大于8小时" : h >= 6 ? "6-8小时" : h >= 4 ? "4-6小时" : "少于4小时";
  }
  const bedtime = t.match(/(?:晚上?|夜里)\s*(\d{1,2})\s*点[^\d]{0,6}?(?:才)?(?:睡|上床|入睡)/);
  if (bedtime) {
    const h = parseInt(bedtime[1]);
    out.sleep_bedtime = h < 10 ? "晚8-10点" : h < 12 ? "晚10-12点" : "12点以后";
  }
  if (/长期失眠|失眠严重/.test(t)) out.sleep_quality = "很差，长期失眠";
  else if (/入睡困难|早醒|睡眠差|睡不好/.test(t)) out.sleep_quality = "较差，经常入睡困难或早醒";
  else if (/偶尔失眠|多梦|睡眠一般|质量一般/.test(t)) out.sleep_quality = "一般，偶尔失眠或多梦";
  else if (/睡眠很好|睡得沉|倒头就睡/.test(t)) out.sleep_quality = "很好，入睡快、睡得沉";

  /* ---------- 既往史（关键词 → 有） ---------- */
  const diseaseMap: [string, RegExp][] = [
    ["dis_hypertension", /高血压/],
    ["dis_diabetes", /糖尿病/],
    ["dis_lipid", /高血脂|血脂异常|血脂高/],
    ["dis_chd", /冠心病|冠状动脉/],
    ["dis_stroke", /脑卒中|脑梗|中风/],
    ["dis_hyperuricemia", /高尿酸|痛风/],
    ["dis_fatty_liver", /脂肪肝/],
    ["dis_anemia", /贫血/],
    ["dis_gallstone", /胆结石/],
    ["dis_reflux", /反流性胃炎|胃炎/],
    ["dis_periodontitis", /牙周炎/],
    ["dis_bronchitis", /哮喘|慢性支气管炎/],
    ["dis_tumor", /肿瘤/],
    ["dis_thyroid", /甲状腺/],
    ["dis_allergy", /过敏/],
    ["dis_arrhythmia", /心律不齐|心律失常/],
    ["dis_urine", /尿蛋白|尿潜血/],
  ];
  for (const [qid, re] of diseaseMap) {
    const m = t.search(re);
    if (m >= 0 && !isNegated(t, m)) {
      out[qid] = { status: "有", detail: "" };
    }
  }

  // 用药（提及具体药物类别）
  const meds = ["降压药", "降糖药", "降脂药", "降尿酸药", "肠胃药", "甲状腺药物", "哮喘药", "镇定剂", "中药"].filter(
    (x) => t.includes(x)
  );
  if (meds.length > 0) out.dis_medication = meds;

  /* ---------- 症状调查 ---------- */
  const symptomMap: [string, RegExp][] = [
    ["sym_cold", /感冒|发烧/],
    ["sym_fatigue", /疲乏|疲劳|倦怠|乏力|没力气/],
    ["sym_cough", /咳嗽|咳痰/],
    ["sym_snore", /打呼噜|打鼾/],
    ["sym_appetite", /食欲不振|消化不良|胃口差/],
    ["sym_reflux", /反酸|嗳气|胃酸/],
    ["sym_bowel", /便秘|腹泻/],
    ["sym_palpitation", /心悸|心慌|气短/],
    ["sym_headache", /头痛|头晕/],
    ["sym_dream", /多梦/],
    ["sym_insomnia", /失眠|入睡困难|早醒/],
    ["sym_memory", /记忆力下降|记性变差|记忆力变差/],
  ];
  for (const [qid, re] of symptomMap) {
    const m = t.search(re);
    if (m >= 0 && !isNegated(t, m)) {
      const ctx = t.slice(Math.max(0, m - 8), m + 12);
      out[qid] = /经常|总是|频繁|长期|反复/.test(ctx) ? "经常" : "偶尔";
    }
  }

  /* ---------- 总体评估 ov_*（提及即"是"） ---------- */
  const overallMap: [string, RegExp][] = [
    ["ov_1", /健康状况?(大不如前|变差|不如以前|下降)/],
    ["ov_2", /体重(明显|大幅|一下子)?(减轻|下降|增加|上升|长了)/],
    ["ov_3", /入睡困难|睡眠浅|睡不踏实/],
    ["ov_4", /关节(痛|疼)|肌肉(酸)?痛|腰腿疼/],
    ["ov_5", /经常疲[惫劳]|总是觉得累|容易疲劳|疲乏无力/],
    ["ov_6", /抑郁|焦虑/],
    ["ov_7", /记忆力(下降|变差|减退|有问题)|记性差/],
    ["ov_8", /耳鸣/],
    ["ov_9", /体力(大不如前|衰退|下降)/],
    ["ov_13", /过敏/],
    ["ov_14", /注意力不集中|走神|意识模糊/],
    ["ov_15", /呼吸(急促|困难)|气短/],
    ["ov_16", /(味觉|嗅觉)(退化|下降|变差)/],
    ["ov_17", /肌肉量(减少|流失)|肌肉萎缩/],
    ["ov_18", /血压偏高|血压高|血脂偏高|血脂高|血糖偏高|血糖高/],
    ["ov_19", /牙周|牙龈炎|牙龈出血/],
    ["ov_20", /便秘|腹泻|肠胃不适/],
    ["ov_21", /口臭/],
    ["ov_22", /变矮|身高矮了/],
    ["ov_23", /经常感冒|容易感冒|总是感冒|流感.*中招/],
  ];
  for (const [qid, re] of overallMap) {
    const m = t.search(re);
    if (m >= 0 && !isNegated(t, m)) setRadio(qid, "是");
  }
  // 处方药
  if (/长期服药|服用降压药|服用降糖药|每天吃药/.test(t) || meds.length > 0) {
    setRadio("ov_10", "是");
    if (meds.length >= 2) setRadio("ov_11", "是");
  }
  if (/安眠药/.test(t)) setRadio("ov_12", "D. 安眠药");
  else if (/止痛药/.test(t)) setRadio("ov_12", "C. 镇痛药");
  if (/血压偏高|血压高/.test(t) && !isNegated(t, t.search(/血压偏高|血压高/))) {
    // ov_18 已在上面覆盖
  }

  /* ---------- 食物频率（别名关键词附近的频率词） ---------- */
  const freqWords: [RegExp, string][] = [
    [/不吃|没吃过|从不吃/, "不吃"],
    [/每天|天天/, "每天"],
    [/每周|一周/, "每周"],
    [/每月/, "每月"],
    [/很少吃|偶尔吃|偶尔喝|很少喝/, "每月"],
  ];
  /** 食物题的口语别名（用于在描述中定位） */
  const FOOD_ALIAS: Record<string, string[]> = {
    diet_rice: ["米饭"],
    diet_porridge: ["粥"],
    diet_dried_noodle: ["馒头", "面包", "烙饼"],
    diet_noodle: ["面条", "米线"],
    diet_wholegrain: ["全谷", "粗粮", "燕麦", "糙米", "玉米"],
    diet_tuber: ["薯类", "红薯", "土豆", "山药"],
    diet_gaifan: ["盖浇饭"],
    diet_lean_meat: ["瘦肉", "鸡鸭肉", "牛肉", "猪肉"],
    diet_fat_meat: ["肥肉"],
    diet_offal: ["内脏"],
    diet_seafood: ["水产", "鱼", "虾"],
    diet_egg: ["蛋类", "鸡蛋"],
    diet_milk: ["牛奶", "酸奶"],
    diet_soy: ["豆制品", "豆浆", "豆腐"],
    diet_nut: ["坚果"],
    diet_veg: ["绿叶蔬菜", "蔬菜", "青菜"],
    diet_fruit: ["新鲜水果", "水果"],
    diet_sweets: ["甜食", "蛋糕", "冰淇淋", "糖果"],
    diet_drink: ["饮料", "奶茶", "咖啡"],
    diet_processed: ["加工食品", "方便面", "火腿肠", "香肠", "罐头"],
    diet_fried: ["油炸"],
    diet_pickle: ["咸菜"],
    diet_fastfood: ["洋快餐", "麦当劳", "肯德基", "快餐"],
    diet_seaweed: ["紫菜", "海带", "海鱼"],
    diet_soup: ["煲汤", "肉汤", "面汤"],
    diet_spicy: ["辛辣"],
    diet_eating_out: ["在外就餐", "外出就餐", "下馆子", "在外面吃"],
  };
  for (const section of FM_SECTIONS) {
    if (section.id !== "diet") continue;
    for (const q of section.questions) {
      if (q.type !== "foodfreq") continue;
      const aliases = [...(FOOD_ALIAS[q.qid] ?? []), q.text];
      let done = false;
      for (const alias of aliases) {
        if (done) break;
        let idx = t.indexOf(alias);
        while (idx >= 0) {
          // 频率词一般在食物名之前，窗口只向前看，避免吞掉后文其他食物的"不吃"
          const window = t.slice(Math.max(0, idx - 8), idx + 2);
          let freq: string | null = null;
          for (const [re, val] of freqWords) {
            if (re.test(window)) {
              freq = val;
              break;
            }
          }
          if (freq) {
            const countMatch = window.match(/(\d+|[一两二三四五六七八九十])\s*次/);
            const count = countMatch
              ? /\d/.test(countMatch[1])
                ? parseInt(countMatch[1])
                : cnNum(countMatch[1])
              : 1;
            const amountMatch = window.match(/(大|中|小)(碗|份)/);
            out[q.qid] = {
              freq,
              count: freq === "不吃" ? "" : count,
              amount: amountMatch ? `${amountMatch[1]}${amountMatch[2]}` : q.bowl ? "中碗" : "中份",
            };
            done = true;
            break;
          }
          idx = t.indexOf(alias, idx + 1);
        }
      }
    }
  }

  // 清理空值
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (v === null || v === undefined || v === "") delete out[k];
  }
  return out;
}

/**
 * 校验并清洗答案：qid 必须存在、radio/checkbox 值必须在选项内、
 * foodfreq/diseasehist 结构合法，防止非法值进入填写流程
 */
export function sanitizeFmAnswers(raw: unknown): FMAnswers {
  const out: FMAnswers = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [qid, val] of Object.entries(raw as Record<string, unknown>)) {
    const q: FMQuestion | undefined = FM_QUESTION_BY_ID[qid];
    if (!q || val === null || val === undefined) continue;
    switch (q.type) {
      case "radio":
        if (typeof val === "string" && q.options?.includes(val)) out[qid] = val;
        break;
      case "checkbox":
        if (Array.isArray(val)) {
          const filtered = val.filter(
            (v): v is string => typeof v === "string" && !!q.options?.includes(v)
          );
          if (filtered.length > 0) out[qid] = filtered;
        }
        break;
      case "foodfreq": {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          const v = val as { freq?: unknown; count?: unknown; amount?: unknown };
          if (typeof v.freq === "string" && ["每天", "每周", "每月", "不吃"].includes(v.freq)) {
            out[qid] = {
              freq: v.freq,
              count: typeof v.count === "number" ? v.count : "",
              amount: typeof v.amount === "string" ? v.amount : "",
            };
          }
        }
        break;
      }
      case "diseasehist": {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          const v = val as { status?: unknown; detail?: unknown };
          if (typeof v.status === "string" && ["有", "无", "不详"].includes(v.status)) {
            out[qid] = {
              status: v.status,
              detail: typeof v.detail === "string" ? v.detail : "",
            };
          }
        }
        break;
      }
      case "number":
        if (typeof val === "number" && Number.isFinite(val)) out[qid] = val;
        else if (typeof val === "string" && val.trim() !== "" && !isNaN(Number(val)))
          out[qid] = Number(val);
        break;
      case "text":
      case "textarea":
        if (typeof val === "string" && val.trim() !== "") out[qid] = val.trim().slice(0, 200);
        break;
    }
  }
  return out;
}
