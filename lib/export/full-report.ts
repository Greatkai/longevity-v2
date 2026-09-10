import { jsPDF } from "jspdf";
import type { AssessmentResult } from "@/lib/chli-model";
import type { FMAnswers } from "@/lib/functional-survey/types";
import { generateA4Pages } from "./report-export";
import { buildCHLIAnswerPages } from "./chli-appendix";
import { buildSurveyDetailPages } from "./survey-export";

/**
 * 完整报告 PDF 生成（客户端与健管师工作台共用）
 * 主报告（含人工解读/AI 解读页）+ CHLI 问卷填写明细附页 + 功能医学问卷明细附页（如有）
 */

export interface FullReportInput {
  result: AssessmentResult;
  /** 健康管理师人工解读（存在时替换 AI 解读页） */
  coachInterpretation?: string;
  /** 功能医学问卷答案（详查版时传入，用于生成 FM 明细附页） */
  fmAnswers?: FMAnswers | null;
  /** 客户姓名/电话（FM 附页显示用，可空） */
  name?: string | null;
  phone?: string | null;
  siteUrl?: string;
  /** 文件名（不含扩展名） */
  fileName?: string;
}

export async function generateFullReportPDF(input: FullReportInput): Promise<void> {
  const { result, coachInterpretation, fmAnswers, name, phone, siteUrl = "", fileName } = input;

  const pages = await generateA4Pages(result, siteUrl, coachInterpretation);

  // 附页 1：CHLI 问卷填写明细（有填写数据即生成）
  if (result.sourceData && typeof result.sourceData === "object") {
    pages.push(...buildCHLIAnswerPages(result.sourceData, result));
  }

  // 附页 2：功能医学问卷明细（详查版且答案可用）
  if (result.functional?.included && fmAnswers && Object.keys(fmAnswers).length > 0) {
    pages.push(
      ...buildSurveyDetailPages({
        answers: fmAnswers,
        categories: result.functional.categories,
        problems: result.functional.mainProblems,
        reportCode: result.reportCode,
        name,
        phone,
        createdAt: result.createdAt,
      })
    );
  }

  const pdf = new jsPDF("p", "pt", "a4");
  pages.forEach((dataUrl, i) => {
    if (i > 0) pdf.addPage();
    pdf.addImage(dataUrl, "JPEG", 0, 0, 595, 842);
  });
  pdf.save(`${fileName || `长寿评估报告-${result.reportCode || "未编号"}`}.pdf`);
}
