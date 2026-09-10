import { jsPDF } from "jspdf";
import type { AssessmentResult } from "@/lib/chli-model";
import { SUB_BY_DIMENSION, LAB_CHECKLIST } from "@/lib/chli-model/sub-indicators";
import { FM_IMBALANCES } from "@/lib/functional-survey/questions";
import type { FMCategories } from "@/lib/functional-survey/types";
import {
  createA4Canvas,
  drawDocHeader,
  drawDocFooter,
  A4W,
  A4H,
  MARGIN,
} from "./report-export";

/**
 * 报告对比分析导出（A4 PDF）
 * 页面：概览 + 总分趋势图 + 六维/二级指标对比表 + 差异对比（失衡类别/检验提供情况）
 */

const FONT = "'PingFang SC','Microsoft YaHei',sans-serif";

export interface CompareEntry {
  id: number;
  code: string;
  createdAt: string;
  result: AssessmentResult;
}

const LEVEL_LABELS: Record<string, string> = {
  excellent: "优",
  good: "良",
  moderate: "中",
  risk: "风险",
  highRisk: "高风险",
};

/** 绘制折线趋势图（单序列，0-100 分） */
function drawTrendChart(
  ctx: CanvasRenderingContext2D,
  entries: CompareEntry[],
  x: number,
  y: number,
  w: number,
  h: number
) {
  // 背景网格
  ctx.strokeStyle = "#E8F0FA";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const gy = y + (h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
    ctx.fillStyle = "#8494A6";
    ctx.font = `10px ${FONT}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(String(100 - i * 25), x - 8, gy);
  }
  // 轴
  ctx.strokeStyle = "#C9D8EA";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  const n = entries.length;
  const px = (i: number) => x + (n === 1 ? w / 2 : (w * i) / (n - 1));
  const py = (score: number) => y + h - (Math.max(0, Math.min(100, score)) / 100) * h;

  // 折线
  ctx.strokeStyle = "#0A5BA8";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  entries.forEach((e, i) => {
    const cx = px(i);
    const cy = py(e.result.chliScore);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.stroke();
  // 点与数值
  entries.forEach((e, i) => {
    const cx = px(i);
    const cy = py(e.result.chliScore);
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#0A5BA8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#12232E";
    ctx.font = `700 12px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(String(Math.round(e.result.chliScore)), cx, cy - 12);
    // X 轴标签
    ctx.fillStyle = "#8494A6";
    ctx.font = `10px ${FONT}`;
    ctx.fillText(`第 ${i + 1} 次`, cx, y + h + 14);
  });
}

export async function exportComparePDF(entries: CompareEntry[]): Promise<void> {
  const dateStr = new Date().toLocaleDateString("zh-CN");
  const canvases: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }[] = [];

  const tableRow = (
    ctx: CanvasRenderingContext2D,
    y: number,
    rowH: number,
    label: string,
    values: string[],
    opts?: { isHeader?: boolean; isAlt?: boolean; firstW?: number }
  ) => {
    const firstW = opts?.firstW ?? 130;
    ctx.fillStyle = opts?.isHeader ? "#0A5BA8" : opts?.isAlt ? "#F0F6FC" : "#FFFFFF";
    ctx.fillRect(MARGIN, y, A4W - MARGIN * 2, rowH);
    ctx.textBaseline = "middle";
    ctx.font = opts?.isHeader
      ? `600 12px ${FONT}`
      : `12px ${FONT}`;
    ctx.fillStyle = opts?.isHeader ? "#FFFFFF" : "#2B3A48";
    ctx.textAlign = "left";
    ctx.fillText(label, MARGIN + 10, y + rowH / 2);
    const colW = (A4W - MARGIN * 2 - firstW) / values.length;
    values.forEach((v, i) => {
      ctx.textAlign = "center";
      ctx.fillStyle = opts?.isHeader ? "#FFFFFF" : v === "—" ? "#B8C4D2" : "#12232E";
      ctx.font = opts?.isHeader ? `600 12px ${FONT}` : `600 12px ${FONT}`;
      ctx.fillText(v, MARGIN + firstW + colW * i + colW / 2, y + rowH / 2);
    });
    ctx.strokeStyle = "#E8F0FA";
    ctx.lineWidth = 1;
    ctx.strokeRect(MARGIN, y, A4W - MARGIN * 2, rowH);
  };

  /* ========== 第 1 页：概览 + 总分趋势 ========== */
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
    ctx.fillText("报告对比分析", MARGIN, y);
    ctx.fillStyle = "#8494A6";
    ctx.font = `13px ${FONT}`;
    ctx.fillText(`共 ${entries.length} 次评估 · 按时间正序对比`, MARGIN, y + 24);
    y += 56;

    // 报告概览表
    const overviewHeader = entries.map((_, i) => `第 ${i + 1} 次`);
    tableRow(ctx, y, 30, "项目", overviewHeader, { isHeader: true });
    y += 30;
    const overviewRows: [string, string[]][] = [
      ["报告编码", entries.map((e) => e.code)],
      ["评估日期", entries.map((e) => new Date(e.createdAt).toLocaleDateString("zh-CN"))],
      ["综合指数", entries.map((e) => `${Math.round(e.result.chliScore)}`)],
      ["健康等级", entries.map((e) => LEVEL_LABELS[e.result.level] || e.result.level)],
    ];
    overviewRows.forEach((row, i) => {
      tableRow(ctx, y, 30, row[0], row[1], { isAlt: i % 2 === 0 });
      y += 30;
    });
    y += 20;

    ctx.fillStyle = "#0A5BA8";
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("综合长寿指数趋势", MARGIN, y);
    y += 16;

    drawTrendChart(ctx, entries, MARGIN + 20, y, A4W - MARGIN * 2 - 50, 240);
    y += 240 + 30;

    // 总分趋势结论
    if (entries.length >= 2) {
      const first = entries[0].result.chliScore;
      const last = entries[entries.length - 1].result.chliScore;
      const delta = Math.round((last - first) * 10) / 10;
      const trendText =
        delta > 2
          ? `综合指数较第 1 次提升 ${delta} 分，整体健康趋势向好，请保持当前的健康管理方式。`
          : delta < -2
          ? `综合指数较第 1 次下降 ${Math.abs(delta)} 分，建议回顾期间的生活方式变化，针对性调整。`
          : `综合指数基本持平（变化 ${delta} 分），健康状态保持稳定。`;
      ctx.fillStyle = "#F0F6FC";
      ctx.fillRect(MARGIN, y, A4W - MARGIN * 2, 44);
      ctx.fillStyle = "#2B3A48";
      ctx.font = `12px ${FONT}`;
      ctx.textAlign = "left";
      wrapTextLocal(ctx, trendText, MARGIN + 12, y + 18, A4W - MARGIN * 2 - 24, 20);
    }

    canvases.push({ canvas, ctx });
  }

  /* ========== 第 2 页：六维得分对比 ========== */
  {
    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4W, A4H);
    drawDocHeader(ctx);

    let y = 88;
    ctx.fillStyle = "#12232E";
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("六大维度得分对比", MARGIN, y);
    y += 30;

    const colHeader = entries.map((_, i) => `第 ${i + 1} 次`);
    tableRow(ctx, y, 30, "维度", colHeader, { isHeader: true });
    y += 30;
    const dims = ["B", "F", "M", "L", "P", "D"];
    const dimNames: Record<string, string> = {
      B: "生物年龄", F: "功能健康", M: "代谢慢病", L: "生活方式", P: "心理认知", D: "数字健康",
    };
    dims.forEach((dim, i) => {
      const values = entries.map((e) => {
        const d = e.result.dimensions.find((x) => x.key === dim);
        return d ? `${Math.round(d.score)}` : "—";
      });
      tableRow(ctx, y, 30, `${dim} ${dimNames[dim]}`, values, { isAlt: i % 2 === 0, firstW: 110 });
      y += 30;
    });
    y += 24;

    ctx.fillStyle = "#0A5BA8";
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText("检验报告提供情况", MARGIN, y);
    y += 28;
    tableRow(ctx, y, 28, "检验项", colHeader, { isHeader: true, firstW: 110 });
    y += 28;
    const labPath: Record<string, string> = {
      B2: "bio.epigeneticAge.available",
      B3: "bio.inflammation.available",
      M1: "metabolic.hba1c.available",
      M2: "metabolic.ldl.available",
      M5: "metabolic.liverKidney.available",
      F2: "functional.gaitSpeed.available",
      F3: "functional.gripStrength.available",
      F4: "functional.balance.available",
      F5: "functional.cognitiveTest.available",
      D3: "digital.improvingTrend.available",
    };
    const hasLab = (e: CompareEntry, subKey: string): boolean => {
      const p = labPath[subKey];
      const sd = e.result.sourceData as Record<string, unknown> | undefined;
      if (!p || !sd) return false;
      let cur: unknown = sd;
      for (const k of p.split(".")) {
        if (cur == null || typeof cur !== "object") return false;
        cur = (cur as Record<string, unknown>)[k];
      }
      return cur === 1 || cur === true;
    };
    LAB_CHECKLIST.forEach((item, i) => {
      tableRow(
        ctx,
        y,
        28,
        `${item.name}${item.recommended ? " ★" : ""}`,
        entries.map((e) => (hasLab(e, item.subKey) ? "✓ 已提供" : "—")),
        { isAlt: i % 2 === 0, firstW: 110 }
      );
      y += 28;
    });

    canvases.push({ canvas, ctx });
  }

  /* ========== 第 3+ 页：二级指标对比 ========== */
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
    ctx!.fillStyle = "#12232E";
    ctx!.font = `700 20px ${FONT}`;
    ctx!.textAlign = "left";
    ctx!.textBaseline = "alphabetic";
    ctx!.fillText("二级指标对比", MARGIN, y);
    y += 30;

    const colHeader = entries.map((_, i) => `第 ${i + 1} 次`);
    const dims = ["B", "F", "M", "L", "P", "D"];
    const dimNames: Record<string, string> = {
      B: "生物年龄", F: "功能健康", M: "代谢慢病", L: "生活方式", P: "心理认知", D: "数字健康",
    };

    dims.forEach((dim) => {
      const subs = SUB_BY_DIMENSION[dim] ?? [];
      if (y > A4H - 160) newPage();
      ctx!.fillStyle = "#0A5BA8";
      ctx!.font = `700 14px ${FONT}`;
      ctx!.textAlign = "left";
      ctx!.textBaseline = "alphabetic";
      ctx!.fillText(`${dim} ${dimNames[dim]}`, MARGIN, y);
      y += 12;
      ctx!.beginPath();
      ctx!.moveTo(MARGIN, y);
      ctx!.lineTo(A4W - MARGIN, y);
      ctx!.stroke();
      y += 8;
      tableRow(ctx!, y, 26, "指标", colHeader, { isHeader: true, firstW: 140 });
      y += 26;

      subs.forEach((s, i) => {
        if (y > A4H - 130) newPage();
        const values = entries.map((e) => {
          const d = e.result.dimensions.find((x) => x.key === dim);
          const v = d?.details?.[s.key];
          return v != null ? `${Math.round(v)}` : "—";
        });
        tableRow(ctx!, y, 26, s.name, values, { isAlt: i % 2 === 1, firstW: 140 });
        y += 26;
      });
      y += 12;
    });
  }

  /* ========== 第 4 页（可选）：功能失衡类别对比 ========== */
  const withFm = entries.filter((e) => e.result.functional?.included);
  if (withFm.length > 0) {
    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4W, A4H);
    drawDocHeader(ctx);

    let y = 88;
    ctx.fillStyle = "#12232E";
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("功能失衡类别对比（失衡率 %）", MARGIN, y);
    y += 30;

    const fmEntries = withFm.map((e) => ({
      e,
      label: `第 ${entries.indexOf(e) + 1} 次`,
    }));
    tableRow(ctx, y, 30, "类别", fmEntries.map((f) => f.label), { isHeader: true, firstW: 140 });
    y += 30;

    const cats = Object.keys(FM_IMBALANCES) as FMCategories[];
    cats.forEach((cat, i) => {
      const values = fmEntries.map((f) => {
        const c = f.e.result.functional?.categories.find((x) => x.cat === cat);
        return c ? `${c.rate}%` : "—";
      });
      tableRow(ctx, y, 30, `${FM_IMBALANCES[cat].icon} ${FM_IMBALANCES[cat].name}`, values, {
        isAlt: i % 2 === 1,
        firstW: 140,
      });
      y += 30;
    });

    ctx.fillStyle = "#8494A6";
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    wrapTextLocal(
      ctx,
      "失衡率越高表示该生理过程失衡越明显（≥30% 为重点关注）。未参与失衡评估的报告显示为「—」。",
      MARGIN,
      y + 10,
      A4W - MARGIN * 2,
      18
    );

    canvases.push({ canvas, ctx });
  }

  // 统一绘制页脚（总页数已知）
  const total = canvases.length;
  const pdf = new jsPDF("p", "pt", "a4");
  canvases.forEach((c, i) => {
    drawDocFooter(c.ctx, i + 1, total, dateStr);
    if (i > 0) pdf.addPage();
    pdf.addImage(c.canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 595, 842);
  });
  pdf.save(`报告对比分析-${entries.length}次.pdf`);
}

/** 本地 wrapText（与 report-export 同实现） */
function wrapTextLocal(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = Array.from(text);
  let line = "";
  let cy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      ctx.fillText(line, x, cy);
      line = ch;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy + lineHeight;
}
