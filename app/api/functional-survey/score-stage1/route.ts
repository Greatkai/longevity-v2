import { NextRequest, NextResponse } from "next/server";
import { scoreStage1, selectCategories } from "@/lib/functional-survey/scoring";
import type { FMAnswers } from "@/lib/functional-survey/types";

export const runtime = "nodejs";

/** 第一阶段评分：返回 7 大失衡类别阳性率与入选类别（用于动态决定第二阶段题目） */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const answers = (body.answers ?? {}) as FMAnswers;
    const stage1 = scoreStage1(answers);
    const selection = selectCategories(stage1);
    return NextResponse.json({ stage1, selection });
  } catch (e) {
    console.error("Stage1 评分失败:", e);
    return NextResponse.json({ error: "评分失败" }, { status: 500 });
  }
}
