import { jsPDF } from "jspdf";
import type { FMAnswers, FMScoreResult } from "@/lib/functional-survey/types";
import { FM_SECTIONS, FM_IMBALANCES } from "@/lib/functional-survey/questions";
import { formatValue } from "@/lib/functional-survey/scoring";
import {
  createA4Canvas,
  drawDocHeader,
  drawDocFooter,
  roundRect,
  wrapText,
  A4W,
  A4H,
  MARGIN,
} from "./report-export";

/**
 * 功能医学问卷结果明细导出（A4 PDF）
 * 包含：基本信息、失衡评分表、主要问题摘要、逐题答案明细
 * 供健康管理师/医生进行更专业的线下评估使用。
 */

export interface SurveyExportInput {
  answers: FMAnswers;
  /** 存储的评分快照（可空） */
  scores?: { imbalances?: FMScoreResult; mainProblems?: string[] } | null;
  reportCode?: string | null;
  name?: string | null;
  phone?: string | null;
  createdAt?: string | null;
}

const FONT = "'PingFang SC','Microsoft YaHei',sans-serif";

/** 生成并下载问卷结果明细 PDF */
export async function exportSurveyPDF(input: SurveyExportInput): Promise<void> {
  const { answers, scores, reportCode, name, phone, createdAt } = input;
  const im = scores?.imbalances;
  const problems = scores?.mainProblems ?? [];

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString("zh-CN")
    : new Date().toLocaleDateString("zh-CN");

  // 先在画布上绘制内容（页脚最后统一画，以获得正确总页数）
  const canvases: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }[] = [];

  /* ========== 第 1 页：基本信息 + 失衡评分 + 摘要 ========== */
  {
    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4W, A4H);
    drawDocHeader(ctx);

    let y = 88;
    ctx.fillStyle = "#12232E";
    ctx.font = `700 26px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("功能医学问卷结果明细", MARGIN, y);
    ctx.fillStyle = "#8494A6";
    ctx.font = `13px ${FONT}`;
    ctx.fillText("Functional Medicine Survey Detail · 供专业评估参考", MARGIN, y + 24);
    y += 52;

    ctx.fillStyle = "#0A5BA8";
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText("一、基本信息", MARGIN, y);
    y += 24;
    const infoRows: [string, string][] = [
      ["姓名", name || "—"],
      ["联系电话", phone || "—"],
      ["填写时间", createdAt ? new Date(createdAt).toLocaleString("zh-CN") : dateStr],
      ["关联报告", reportCode || "—"],
    ];
    infoRows.forEach((row, i) => {
      const ry = y + i * 30;
      ctx.fillStyle = i % 2 === 0 ? "#F8FBFD" : "#FFFFFF";
      ctx.fillRect(MARGIN, ry, A4W - MARGIN * 2, 30);
      ctx.fillStyle = "#8494A6";
      ctx.font = `13px ${FONT}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(row[0], MARGIN + 16, ry + 15);
      ctx.fillStyle = "#12232E";
      ctx.font = `600 13px ${FONT}`;
      ctx.fillText(row[1], MARGIN + 140, ry + 15);
      ctx.strokeStyle = "#E8F0FA";
      ctx.lineWidth = 1;
      ctx.strokeRect(MARGIN, ry, A4W - MARGIN * 2, 30);
    });
    y += infoRows.length * 30 + 20;

    if (im?.combined) {
      ctx.fillStyle = "#0A5BA8";
      ctx.font = `700 15px ${FONT}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("二、七大失衡类别评分", MARGIN, y);
      y += 24;
      const rowH = 32;
      const cats = Object.keys(im.combined) as (keyof typeof FM_IMBALANCES)[];
      cats.forEach((cat, i) => {
        const c = im.combined[cat];
        const meta = FM_IMBALANCES[cat];
        const ry = y + i * rowH;
        ctx.fillStyle = i % 2 === 0 ? "#F8FBFD" : "#FFFFFF";
        ctx.fillRect(MARGIN, ry, A4W - MARGIN * 2, rowH);
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillStyle = "#2B3A48";
        ctx.font = `13px ${FONT}`;
        ctx.fillText(`${meta.icon} ${meta.name}`, MARGIN + 16, ry + rowH / 2);
        ctx.textAlign = "center";
        ctx.fillStyle = c.rate >= 30 ? "#DC2626" : "#55677A";
        ctx.font = `700 13px ${FONT}`;
        ctx.fillText(`${c.rate}%`, MARGIN + 220, ry + rowH / 2);
        ctx.fillStyle = "#55677A";
        ctx.font = `12px ${FONT}`;
        ctx.fillText(
          c.selected ? "入选专项详查" : c.stage2 ? "已详查" : "仅总体评估",
          MARGIN + 340,
          ry + rowH / 2
        );
        ctx.textAlign = "right";
        ctx.fillStyle = "#8494A6";
        ctx.font = `11px ${FONT}`;
        ctx.fillText(
          `总体 ${c.stage1.rate}%${c.stage2 ? ` · 专项 ${c.stage2.rate}%` : ""}`,
          A4W - MARGIN - 16,
          ry + rowH / 2
        );
        ctx.strokeStyle = "#E8F0FA";
        ctx.lineWidth = 1;
        ctx.strokeRect(MARGIN, ry, A4W - MARGIN * 2, rowH);
      });
      y += cats.length * rowH + 20;
    }

    if (problems.length > 0) {
      ctx.fillStyle = "#0A5BA8";
      ctx.font = `700 15px ${FONT}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("三、主要问题摘要", MARGIN, y);
      y += 24;
      ctx.fillStyle = "#2B3A48";
      ctx.font = `12px ${FONT}`;
      for (const line of problems) {
        if (y > A4H - 120) break;
        y = wrapText(ctx, `• ${line}`, MARGIN + 8, y, A4W - MARGIN * 2 - 16, 22);
        y += 4;
      }
    }

    ctx.fillStyle = "#F0F6FC";
    roundRect(ctx, MARGIN, A4H - 96, A4W - MARGIN * 2, 56, 8);
    ctx.fill();
    ctx.fillStyle = "#55677A";
    ctx.font = `11px ${FONT}`;
    ctx.textBaseline = "alphabetic";
    wrapText(
      ctx,
      "说明：本明细由功能医学两段式问卷自动汇总生成，包含全部原始答案，供健康管理师/医生进行更专业的评估参考，不构成医疗诊断。",
      MARGIN + 14,
      A4H - 72,
      A4W - MARGIN * 2 - 28,
      18
    );

    canvases.push({ canvas, ctx });
  }

  /* ========== 第 2+ 页：逐题答案明细 ========== */
  {
    let ctx: CanvasRenderingContext2D | null = null;
    let y = 0;

    const newPage = () => {
      const c = createA4Canvas();
      ctx = c.ctx;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, A4W, A4H);
      drawDocHeader(ctx);
      y = 80;
      canvases.push(c);
    };

    newPage();

    for (const section of FM_SECTIONS) {
      if (y > A4H - 140) newPage();
      ctx!.fillStyle = "#0A5BA8";
      ctx!.font = `700 16px ${FONT}`;
      ctx!.textAlign = "left";
      ctx!.textBaseline = "alphabetic";
      const answered = section.questions.filter((q) => {
        const v = answers[q.qid];
        if (v === null || v === undefined || v === "") return false;
        if (Array.isArray(v) && v.length === 0) return false;
        if (typeof v === "object" && !Array.isArray(v)) {
          return Object.keys(v).length > 0;
        }
        return true;
      }).length;
      ctx!.fillText(
        `${section.title}（已答 ${answered}/${section.questions.length}）`,
        MARGIN,
        y
      );
      y += 14;
      ctx!.strokeStyle = "#0A5BA8";
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.moveTo(MARGIN, y);
      ctx!.lineTo(A4W - MARGIN, y);
      ctx!.stroke();
      y += 22;

      for (const q of section.questions) {
        const text = formatValue(answers[q.qid]);
        if (text === "") continue;

        ctx!.fillStyle = "#2B3A48";
        ctx!.font = `600 12px ${FONT}`;
        y = wrapText(ctx!, q.text, MARGIN, y, A4W - MARGIN * 2 - 170, 20);

        // 答案（右对齐栏，自动拆行）
        ctx!.fillStyle = "#0A5BA8";
        ctx!.font = `600 12px ${FONT}`;
        ctx!.textAlign = "right";
        const ansLines: string[] = [];
        {
          const ansMaxW = 150;
          let line = "";
          for (const ch of Array.from(text)) {
            if (ctx!.measureText(line + ch).width > ansMaxW && line !== "") {
              ansLines.push(line);
              line = ch;
            } else {
              line += ch;
            }
          }
          if (line) ansLines.push(line);
        }
        let ay = y - (ansLines.length - 1) * 18;
        for (const al of ansLines) {
          ctx!.fillText(al, A4W - MARGIN, ay);
          ay += 18;
        }
        ctx!.textAlign = "left";
        y = Math.max(y, ay - 18) + 8;

        ctx!.strokeStyle = "#EFF4FA";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(MARGIN, y);
        ctx!.lineTo(A4W - MARGIN, y);
        ctx!.stroke();
        y += 12;

        if (y > A4H - 120) newPage();
      }
    }
  }

  // 统一绘制页脚（总页数已知）
  const total = canvases.length;
  const dataUrls = canvases.map((c, i) => {
    drawDocFooter(c.ctx, i + 1, total, dateStr);
    return c.canvas.toDataURL("image/jpeg", 0.92);
  });

  const pdf = new jsPDF("p", "pt", "a4");
  dataUrls.forEach((dataUrl, i) => {
    if (i > 0) pdf.addPage();
    pdf.addImage(dataUrl, "JPEG", 0, 0, 595, 842);
  });
  const fileName = `功能医学问卷明细${name ? `-${name}` : ""}${reportCode ? `-${reportCode}` : ""}.pdf`;
  pdf.save(fileName);
}
