import type { SubIndicator } from "./types";

/**
 * CHLI 二级指标体系配置
 * 每个一级维度由若干二级指标加权构成，权重和为 1。
 * needsLab 标记该二级指标需要检验/专项检查数据。
 */
export const SUB_INDICATORS: SubIndicator[] = [
  /* -------- B 生物年龄 -------- */
  { key: "B1", dimension: "B", name: "生物年龄差值", weight: 0.4, needsLab: false, desc: "基于生物标志物测算的生物年龄与实际年龄的差值", rule: "得分 = 60 − 年龄差×2.5。年龄差越负（生物年龄越年轻）分越高；生物年龄比实际年轻 4 岁约得 80 分，年轻 10 岁约 100 分。" },
  { key: "B2", dimension: "B", name: "表观遗传/衰老时钟", weight: 0.25, needsLab: true, desc: "第3代衰老时钟，基于 DNA 甲基化等分子标志", rule: "用 DNA 甲基化检测出的衰老年龄与实际年龄比较：衰老年龄越年轻分越高。未提供检测数据时，采用估算替代分（62 分）。" },
  { key: "B3", dimension: "B", name: "炎症负荷", weight: 0.2, needsLab: true, desc: "hs-CRP、IL-6、TNF-α 等炎症标志物", rule: "以 hs-CRP 为例：<1.0 mg/L 得 90 分以上，1.0-3.0 得 60-90 分，>3.0 得 60 分以下。未提供时用估算分（65 分）。" },
  { key: "B4", dimension: "B", name: "免疫年龄/免疫功能", weight: 0.15, needsLab: false, desc: "免疫细胞亚群与免疫应答能力", rule: "按自评 1-5 分映射：1 分=很差(0 分)，3 分=一般(50 分)，5 分=很好(100 分)。" },

  /* -------- F 功能健康 -------- */
  { key: "F1", dimension: "F", name: "日常活动能力", weight: 0.25, needsLab: false, desc: "ADL/IADL 日常生活自理与工具性活动", rule: "按自评 1-5 分映射：5 分=完全自理(100 分)，3 分=基本自理(50 分)，1 分=需要帮助(0 分)。" },
  { key: "F2", dimension: "F", name: "步速/步行能力", weight: 0.2, needsLab: true, desc: "步速测试、6 分钟步行试验", rule: "步速(m/s)在 0.6-1.4 间线性映射到 0-100 分；1.4m/s 以上得满分。未提供时用估算分（70 分）。" },
  { key: "F3", dimension: "F", name: "握力/肌肉力量", weight: 0.2, needsLab: true, desc: "握力计测量、上肢肌力", rule: "握力(kg)在 15-40 间线性映射；40kg 以上得满分。未提供时用估算分（70 分）。" },
  { key: "F4", dimension: "F", name: "平衡能力/跌倒风险", weight: 0.15, needsLab: true, desc: "单腿站立、Berg 平衡量表", rule: "按测试评分 1-5 分映射；5 分=平衡良好(100 分)。未提供时用估算分（70 分）。" },
  { key: "F5", dimension: "F", name: "认知功能", weight: 0.2, needsLab: true, desc: "MoCA/MMSE 认知筛查量表", rule: "MoCA 得分(满分 30)在 18-28 间线性映射；≥28 分约满分。未提供时用估算分（70 分）。" },

  /* -------- M 代谢与慢病 -------- */
  { key: "M1", dimension: "M", name: "血糖代谢", weight: 0.25, needsLab: true, desc: "糖化血红蛋白 HbA1c、空腹血糖", rule: "HbA1c：5.5% 得 100 分，8% 得 0 分，6.0% 约 80 分；无 HbA1c 时用空腹血糖 5.5-7.5 mmol/L 映射。" },
  { key: "M2", dimension: "M", name: "血脂与动脉粥样硬化", weight: 0.25, needsLab: true, desc: "LDL-C、ApoB、非 HDL-C", rule: "LDL-C(mmol/L)：2.5 得 100 分，4.5 得 0 分，3.4 约 60 分。未提供时用估算分（62 分）。" },
  { key: "M3", dimension: "M", name: "血压与心血管风险", weight: 0.2, needsLab: true, desc: "收缩压/舒张压、脉压差", rule: "收缩压 110-140 与舒张压 75-90 各自映射到 0-100 分，取平均；收缩压 110 得满分。" },
  { key: "M4", dimension: "M", name: "体成分", weight: 0.15, needsLab: false, desc: "BMI、腰围、体脂率", rule: "BMI 18.5-24 得 100 分；24-28 得 75 分；<18.5 或 28-32 得 50 分；>32 得 25 分。" },
  { key: "M5", dimension: "M", name: "肝肾与基础慢病", weight: 0.15, needsLab: true, desc: "肝肾功能指标、慢病数量与控制", rule: "肝肾功能正常计满分；无慢病（或选择「无慢性病」）计 100 分，每增加 1 种慢病减 20 分；慢病控制良好额外加分。" },

  /* -------- L 生活方式 -------- */
  { key: "L1", dimension: "L", name: "运动水平", weight: 0.25, needsLab: false, desc: "规律运动频率与强度", rule: "每周中等强度运动 0-5 次线性映射；每周 5 次得满分。" },
  { key: "L2", dimension: "L", name: "睡眠质量", weight: 0.2, needsLab: false, desc: "睡眠时长与质量", rule: "时长 7-8 小时得 100 分，6-9 小时 75 分，5-10 小时 50 分；再结合自评睡眠质量 1-5 分取平均。" },
  { key: "L3", dimension: "L", name: "饮食质量", weight: 0.2, needsLab: false, desc: "膳食均衡与地中海式饮食", rule: "按自评 0-10 分映射到 0-100 分；10 分=非常均衡健康。完成功能医学饮食调查时按 27 项食物频率自动计算。" },
  { key: "L4", dimension: "L", name: "烟酒习惯", weight: 0.1, needsLab: false, desc: "吸烟与饮酒情况", rule: "从不吸烟得 100 分，已戒烟 85 分，经常吸烟 20 分；从不饮酒 100 分，经常饮酒 30 分，取平均。" },
  { key: "L5", dimension: "L", name: "体重管理与依从性", weight: 0.1, needsLab: false, desc: "体重控制与健康行为依从", rule: "按自评 1-5 分映射；5 分=严格管理体重。" },
  { key: "L6", dimension: "L", name: "功能失衡负荷", weight: 0.15, needsLab: false, desc: "功能医学七大失衡类别（吸收与排泄/排毒/防御/细胞通信/细胞运输/能量转换/结构完整性）综合分", rule: "来自功能医学问卷：失衡率 = 七大类别综合率均值（Stage1 60% + Stage2 40%）；得分 = (100 − 失衡率) ÷ 0.6，失衡率 0% 得满分。未完成功能医学问卷时用中性估算分（65 分）。" },

  /* -------- P 心理认知 -------- */
  { key: "P1", dimension: "P", name: "抑郁焦虑压力", weight: 0.25, needsLab: false, desc: "情绪状态与心理压力", rule: "按自评 1-5 分映射；5 分=情绪很好、压力很小。" },
  { key: "P2", dimension: "P", name: "认知健康与记忆", weight: 0.25, needsLab: false, desc: "自我认知与记忆功能", rule: "按自评 1-5 分映射；5 分=记忆力很好。" },
  { key: "P3", dimension: "P", name: "社会连接与孤独感", weight: 0.2, needsLab: false, desc: "孤独感与社会联结", rule: "反向计分：孤独感 1 分=没有(100 分)，5 分=经常孤独(0 分)。" },
  { key: "P4", dimension: "P", name: "生活目标感/韧性", weight: 0.15, needsLab: false, desc: "目标感、心理韧性", rule: "按自评 1-5 分映射；5 分=目标明确、韧性强。" },
  { key: "P5", dimension: "P", name: "社交参与", weight: 0.15, needsLab: false, desc: "社会活动参与频率", rule: "按参与频率 0-5 映射；5 分=每天参与社交。" },

  /* -------- D 数字健康轨迹 -------- */
  { key: "D1", dimension: "D", name: "健康数据完整性", weight: 0.25, needsLab: false, desc: "连续健康数据的完整程度", rule: "按自评 0-10 分映射；10 分=长期规律记录健康数据。" },
  { key: "D2", dimension: "D", name: "设备数据质量", weight: 0.2, needsLab: false, desc: "可穿戴设备数据质量", rule: "经常使用可穿戴设备得 100 分，偶尔 60 分，不使用 25 分。" },
  { key: "D3", dimension: "D", name: "指标改善趋势", weight: 0.25, needsLab: true, desc: "历史健康指标的改善趋势", rule: "连续体检指标呈改善趋势得满分；未提供历史数据时用估算分（65 分）。" },
  { key: "D4", dimension: "D", name: "AI 风险预测", weight: 0.2, needsLab: true, desc: "基于 AI 的疾病风险预测结果", rule: "AI 风险等级 1-5 分映射；风险越低分越高。无预测结果时用中性分（70 分）。" },
  { key: "D5", dimension: "D", name: "管理依从性", weight: 0.1, needsLab: false, desc: "健康管理计划依从程度", rule: "按依从频率 0-5 映射；5 分=严格坚持健康管理计划。" },
];

/** 按维度分组 */
export const SUB_BY_DIMENSION: Record<string, SubIndicator[]> = SUB_INDICATORS.reduce(
  (acc, s) => {
    (acc[s.dimension] = acc[s.dimension] || []).push(s);
    return acc;
  },
  {} as Record<string, SubIndicator[]>
);

/** 所有需要检验/检查的二级指标 */
export const LAB_SUB_INDICATORS = SUB_INDICATORS.filter((s) => s.needsLab);

/** 可选的检验/检查项清单（用于评估开始前询问用户有哪些报告） */
export interface LabCheckItem {
  /** 关联的二级指标 key */
  subKey: string;
  /** 名称 */
  name: string;
  /** 所属维度 */
  dimension: string;
  /** 说明 */
  desc: string;
  /** 涉及的具体检验指标 */
  tests: string;
  /** 是否推荐（强烈建议做） */
  recommended: boolean;
}

export const LAB_CHECKLIST: LabCheckItem[] = [
  { subKey: "B2", dimension: "B", name: "表观遗传/衰老时钟检测", desc: "基于 DNA 甲基化的生物年龄评估", tests: "DNA甲基化检测、端粒长度", recommended: true },
  { subKey: "B3", dimension: "B", name: "炎症标志物检测", desc: "评估慢性炎症水平", tests: "hs-CRP、IL-6、TNF-α", recommended: true },
  { subKey: "M1", dimension: "M", name: "血糖代谢检测", desc: "评估糖代谢与糖尿病风险", tests: "空腹血糖、糖化血红蛋白 HbA1c", recommended: true },
  { subKey: "M2", dimension: "M", name: "血脂检测", desc: "评估动脉粥样硬化风险", tests: "LDL-C、ApoB、总胆固醇、甘油三酯", recommended: true },
  { subKey: "M5", dimension: "M", name: "肝肾功能检测", desc: "评估代谢与脏器功能", tests: "ALT、AST、肌酐、eGFR、尿酸", recommended: true },
  { subKey: "F2", dimension: "F", name: "步速/步行测试", desc: "评估躯体运动功能", tests: "6分钟步行、步速", recommended: false },
  { subKey: "F3", dimension: "F", name: "握力测量", desc: "评估肌肉力量", tests: "握力计", recommended: false },
  { subKey: "F4", dimension: "F", name: "平衡能力测试", desc: "评估跌倒风险", tests: "单腿站立、Berg量表", recommended: false },
  { subKey: "F5", dimension: "F", name: "认知功能筛查", desc: "评估认知能力", tests: "MoCA、MMSE", recommended: true },
  { subKey: "D3", dimension: "D", name: "历史健康数据", desc: "既往体检指标趋势", tests: "连续 2-3 年体检报告", recommended: false },
];
