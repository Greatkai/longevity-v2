import { NextRequest, NextResponse } from "next/server";
import { aiInsights } from "@/lib/ai/provider";
import { generateRuleInsights } from "@/lib/ai/rule-insights";
import type { AssessmentResult } from "@/lib/chli-model";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = body.result as AssessmentResult;
    if (!result || typeof result.chliScore !== "number") {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    // 构造 AI 上下文
    const profile = buildProfile(result);

    // AI 优先
    const ai = await aiInsights(profile);
    const content = ai || generateRuleInsights(result);
    const source = ai ? "ai" : "rule";

    return NextResponse.json({ content, source });
  } catch (e) {
    console.error("生成解读失败:", e);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}

function buildProfile(r: AssessmentResult): string {
  const dims = r.dimensions
    .map((d) => `${d.name}(${d.key}): ${d.score.toFixed(1)}分/${d.weight * 100}%权重`)
    .join("；");
  return [
    `综合长寿指数 CHLI：${r.chliScore.toFixed(1)} 分，等级：${r.label}`,
    `生物年龄：${r.bioAge.biologicalAge} 岁，实际年龄：${r.bioAge.actualAge} 岁，年龄差：${r.bioAge.ageGap >= 0 ? "+" : ""}${r.bioAge.ageGap} 岁`,
    `各维度得分：${dims}`,
    `FSHI 功能与感觉健康指数：${r.fshi?.score.toFixed(1)} 分`,
  ].join("\n");
}
