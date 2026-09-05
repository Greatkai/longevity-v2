import { NextRequest, NextResponse } from "next/server";
import { aiExtract } from "@/lib/ai/provider";
import { ruleBasedExtract, emptyExtracted, type ExtractedData } from "@/lib/ai/extractor";

export const runtime = "nodejs";

/** 深度合并 AI 提取结果与规则结果 */
function mergeResults(
  ai: Partial<ExtractedData> | null,
  rule: ExtractedData
): ExtractedData {
  const merged = emptyExtracted();
  const groups: (keyof ExtractedData)[] = [
    "bio",
    "functional",
    "metabolic",
    "lifestyle",
    "psychosocial",
    "digital",
  ];

  for (const g of groups) {
    const ruleGroup = rule[g];
    const aiGroup = (ai?.[g] ?? {}) as Record<string, number | null>;
    for (const [key, ruleVal] of Object.entries(ruleGroup)) {
      const aiVal = aiGroup[key] ?? null;
      (merged[g] as Record<string, number | null>)[key] =
        aiVal ?? ruleVal ?? null;
    }
  }
  return merged;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "请输入健康描述文本" }, { status: 400 });
    }

    // 规则兜底
    const ruleResult = ruleBasedExtract(text);

    // AI 提取（若可用）
    let aiResult: Partial<ExtractedData> | null = null;
    try {
      const aiRaw = await aiExtract(text);
      if (aiRaw) {
        const parsed = JSON.parse(
          aiRaw.replace(/```json|```/g, "").trim()
        );
        aiResult = parsed as Partial<ExtractedData>;
      }
    } catch (e) {
      console.error("AI 提取解析失败，使用规则结果:", e);
    }

    const merged = mergeResults(aiResult, ruleResult);
    return NextResponse.json({ data: merged });
  } catch (e) {
    console.error("提取失败:", e);
    return NextResponse.json({ error: "提取失败" }, { status: 500 });
  }
}
