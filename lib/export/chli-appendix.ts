import type { AssessmentResult } from "@/lib/chli-model";
import { DIMENSIONS, QUESTIONS } from "@/lib/questionnaire-data";
import {
  createA4Canvas,
  drawDocHeader,
  drawDocFooter,
  wrapText,
  A4W,
  A4H,
  MARGIN,
} from "./report-export";

/**
 * CHLI 长寿指数问卷填写明细（A4 PDF 附页）
 * 逐题列出客户在六大维度问卷中的全部填写结果（含未填写标记），
 * 供健康管理师/医生线下解读时参考。快速版/专业版均包含。
 */

const FONT = "'PingFang SC','Microsoft YaHei',sans-serif";

/** 按点分路径读取嵌套值 */
function getByPath(source: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let cur: unknown = source;
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

/** 单题答案格式化 */
function fmtQuestionValue(q: (typeof QUESTIONS)[number], source: Record<string, unknown>): string {
  if (q.type === "lab") {
    const avail = getByPath(source, q.path.replace(/\.value$/, ".available"));
    const v = getByPath(source, q.path);
    const provided = avail === 1 || avail === true;
    if (!provided) return "未提供";
    return v != null ? `已提供：${v}${q.suffix ?? ""}` : "已提供（未填数值）";
  }
  const v = getByPath(source, q.path);
  if (v === null || v === undefined || v === "") return "未填写";
  if (q.options) {
    const opt = q.options.find((o) => o.value === v);
    if (opt) return opt.label;
  }
  return `${v}${q.suffix ?? ""}`;
}

/** 构建 CHLI 问卷填写明细的全部 A4 页面（dataURL 数组，页脚为「附 X / 共 M」） */
export function buildCHLIAnswerPages(
  source: Record<string, unknown> | null | undefined,
  result?: AssessmentResult
): string[] {
  if (!source || typeof source !== "object") return [];
  const dateStr = result?.createdAt
    ? new Date(result.createdAt).toLocaleDateString("zh-CN")
    : new Date().toLocaleDateString("zh-CN");

  const canvases: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }[] = [];
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

  /* ---------- 第 1 页：标题 + 基本信息 ---------- */
  {
    const c = createA4Canvas();
    const g = c.ctx;
    g.fillStyle = "#FFFFFF";
    g.fillRect(0, 0, A4W, A4H);
    drawDocHeader(g);

    let yy = 88;
    g.fillStyle = "#12232E";
    g.font = `700 26px ${FONT}`;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillText("附：长寿指数问卷填写明细", MARGIN, yy);
    g.fillStyle = "#8494A6";
    g.font = `13px ${FONT}`;
    g.fillText("CHLI Questionnaire Detail · 供专业评估参考", MARGIN, yy + 24);
    yy += 52;

    g.fillStyle = "#0A5BA8";
    g.font = `700 15px ${FONT}`;
    g.fillText("基本信息", MARGIN, yy);
    yy += 24;
    const gender = source.gender === "female" ? "女" : source.gender === "male" ? "男" : "未填写";
    const num = (path: string, unit: string) => {
      const v = getByPath(source, path);
      return v != null && v !== "" ? `${v} ${unit}` : "未填写";
    };
    const sys = getByPath(source, "metabolic.systolicBP");
    const dia = getByPath(source, "metabolic.diastolicBP");
    const bpText =
      sys != null && dia != null ? `${sys}/${dia} mmHg` : sys != null ? `${sys}` : "未填写";
    const infoRows: [string, string][] = [
      ["性别", gender],
      ["实际年龄", num("bio.actualAge", "岁")],
      ["BMI", num("metabolic.bmi", "")],
      ["血压", bpText],
      ["慢病数量", num("metabolic.chronicCount", "种")],
      ["关联报告", result?.reportCode || "—"],
    ];
    infoRows.forEach((row, i) => {
      const ry = yy + i * 30;
      g.fillStyle = i % 2 === 0 ? "#F8FBFD" : "#FFFFFF";
      g.fillRect(MARGIN, ry, A4W - MARGIN * 2, 30);
      g.fillStyle = "#8494A6";
      g.font = `13px ${FONT}`;
      g.textAlign = "left";
      g.textBaseline = "middle";
      g.fillText(row[0], MARGIN + 16, ry + 15);
      g.fillStyle = "#12232E";
      g.font = `600 13px ${FONT}`;
      g.fillText(row[1], MARGIN + 140, ry + 15);
      g.strokeStyle = "#E8F0FA";
      g.lineWidth = 1;
      g.strokeRect(MARGIN, ry, A4W - MARGIN * 2, 30);
    });
    yy += infoRows.length * 30 + 16;

    g.fillStyle = "#F0F6FC";
    roundRectLocal(g, MARGIN, yy, A4W - MARGIN * 2, 50, 8);
    g.fill();
    g.fillStyle = "#55677A";
    g.font = `11px ${FONT}`;
    g.textBaseline = "alphabetic";
    wrapText(
      g,
      "说明：本明细包含六大维度问卷的全部填写结果（未作答项标记为「未填写」），供健康管理师/医生线下解读参考。",
      MARGIN + 14,
      yy + 22,
      A4W - MARGIN * 2 - 28,
      18
    );

    canvases.push(c);
  }

  /* ---------- 各维度逐题明细 ---------- */
  newPage();

  for (const dim of DIMENSIONS) {
    const dimQuestions = QUESTIONS.filter((q) => q.dimension === dim.key);
    if (y > A4H - 140) newPage();
    ctx!.fillStyle = "#0A5BA8";
    ctx!.font = `700 16px ${FONT}`;
    ctx!.textAlign = "left";
    ctx!.textBaseline = "alphabetic";
    const answered = dimQuestions.filter((q) => fmtQuestionValue(q, source) !== "未填写").length;
    ctx!.fillText(`${dim.key} · ${dim.title}（已答 ${answered}/${dimQuestions.length}）`, MARGIN, y);
    y += 14;
    ctx!.strokeStyle = "#0A5BA8";
    ctx!.lineWidth = 1.5;
    ctx!.beginPath();
    ctx!.moveTo(MARGIN, y);
    ctx!.lineTo(A4W - MARGIN, y);
    ctx!.stroke();
    y += 22;

    for (const q of dimQuestions) {
      const answer = fmtQuestionValue(q, source);

      ctx!.fillStyle = "#2B3A48";
      ctx!.font = `600 12px ${FONT}`;
      y = wrapText(ctx!, q.label, MARGIN, y, A4W - MARGIN * 2 - 170, 20);

      ctx!.fillStyle = answer === "未填写" || answer === "未提供" ? "#B8C4D2" : "#0A5BA8";
      ctx!.font = `600 12px ${FONT}`;
      ctx!.textAlign = "right";
      const ansLines: string[] = [];
      {
        const ansMaxW = 150;
        let line = "";
        for (const ch of Array.from(answer)) {
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

  // 统一绘制页脚
  const total = canvases.length;
  return canvases.map((c, i) => {
    drawDocFooter(c.ctx, i + 1, total, dateStr);
    return c.canvas.toDataURL("image/jpeg", 0.92);
  });
}

/** 圆角矩形（本地实现，避免跨模块循环依赖） */
function roundRectLocal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
