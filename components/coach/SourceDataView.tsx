"use client";

interface Props {
  data: Record<string, any>;
}

/** 展示客户的原始填写数据（供健管师解读参考） */
export function SourceDataView({ data }: Props) {
  const bio = data.bio || {};
  const functional = data.functional || {};
  const metabolic = data.metabolic || {};
  const lifestyle = data.lifestyle || {};
  const psychosocial = data.psychosocial || {};
  const digital = data.digital || {};

  /** 展示 lab 值（available + value） */
  const lab = (obj: any, unit = "") =>
    obj?.available ? `${obj.value ?? "—"} ${unit}` : "未提供";

  const sections = [
    {
      title: "生物年龄",
      items: [
        ["实际年龄", `${bio.actualAge ?? "—"} 岁`],
        ["生物年龄", bio.biologicalAge ? `${bio.biologicalAge} 岁` : "未填写"],
        ["表观遗传", lab(bio.epigeneticAge, "岁")],
        ["炎症(hs-CRP)", lab(bio.inflammation, "mg/L")],
        ["免疫功能", bio.immunity ? `${bio.immunity}/5` : "—"],
      ],
    },
    {
      title: "功能健康",
      items: [
        ["日常活动能力", functional.adl ? `${functional.adl}/5` : "—"],
        ["步速", lab(functional.gaitSpeed, "m/s")],
        ["握力", lab(functional.gripStrength, "kg")],
        ["平衡能力", lab(functional.balance, "分")],
        ["认知(MoCA)", lab(functional.cognitiveTest, "分")],
      ],
    },
    {
      title: "代谢与慢病",
      items: [
        ["BMI", metabolic.bmi ?? "—"],
        ["收缩压", metabolic.systolicBP ? `${metabolic.systolicBP} mmHg` : "—"],
        ["舒张压", metabolic.diastolicBP ? `${metabolic.diastolicBP} mmHg` : "—"],
        ["糖化血红蛋白", lab(metabolic.hba1c, "%")],
        ["空腹血糖", lab(metabolic.fastingGlucose, "mmol/L")],
        ["LDL-C", lab(metabolic.ldl, "mmol/L")],
        ["慢病数量", metabolic.chronicCount ?? "0"],
      ],
    },
    {
      title: "生活方式",
      items: [
        ["饮食(0-10)", lifestyle.diet ?? "—"],
        ["睡眠时长", lifestyle.sleepHours ? `${lifestyle.sleepHours} 小时` : "—"],
        ["睡眠质量", lifestyle.sleepQuality ? `${lifestyle.sleepQuality}/5` : "—"],
        ["每周运动", lifestyle.weeklyExercise ? `${lifestyle.weeklyExercise} 次` : "—"],
        ["吸烟", smokingLabel(lifestyle.smoking)],
        ["饮酒", alcoholLabel(lifestyle.alcohol)],
      ],
    },
    {
      title: "心理认知与社交",
      items: [
        ["情绪状态", psychosocial.mood ? `${psychosocial.mood}/5` : "—"],
        ["认知健康", psychosocial.cognitiveHealth ? `${psychosocial.cognitiveHealth}/5` : "—"],
        ["孤独感", psychosocial.loneliness ? `${psychosocial.loneliness}/5` : "—"],
        ["目标感", psychosocial.purpose ? `${psychosocial.purpose}/5` : "—"],
        ["社交频率", psychosocial.socialActivity ? `${psychosocial.socialActivity}/5` : "—"],
      ],
    },
    {
      title: "数字健康",
      items: [
        ["记录连续性(0-10)", digital.recordContinuity ?? "—"],
        ["可穿戴设备", wearableLabel(digital.wearable)],
        ["管理依从性", digital.adherence ? `${digital.adherence}/5` : "—"],
      ],
    },
  ];

  return (
    <div className="space-y-3">
      {sections.map((sec) => (
        <div key={sec.title} className="rounded-xl border border-brand-100 bg-white p-3">
          <div className="mb-2 text-[11px] font-bold text-brand-700">{sec.title}</div>
          <div className="grid grid-cols-1 gap-1">
            {sec.items.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 text-xs">
                <span className="text-ink-500">{k}</span>
                <span className="font-medium text-ink-800">{v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function smokingLabel(v: any): string {
  const map = { 0: "从不吸烟", 1: "已戒烟", 2: "偶尔吸烟", 3: "经常吸烟" };
  return map[v as keyof typeof map] ?? "—";
}
function alcoholLabel(v: any): string {
  const map = { 0: "从不饮酒", 1: "少量/偶尔", 2: "经常饮酒" };
  return map[v as keyof typeof map] ?? "—";
}
function wearableLabel(v: any): string {
  const map = { 0: "不使用", 1: "偶尔使用", 2: "经常使用" };
  return map[v as keyof typeof map] ?? "—";
}
