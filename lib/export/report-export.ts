import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { AssessmentResult } from "@/lib/chli-model";
import { RISK_META } from "@/lib/chli-model";
import { generateRuleInsights } from "@/lib/ai/rule-insights";

export type ExportFormat = "png" | "jpeg" | "pdf";

/** 风险等级颜色映射 */
const LEVEL_COLORS: Record<string, string> = {
  excellent: "#10B981",
  good: "#3186D8",
  moderate: "#F59E0B",
  risk: "#F97316",
  highRisk: "#EF4444",
};

/** 生成报告区域的高清图片 */
async function captureImage(element: HTMLElement, format: "png" | "jpeg"): Promise<string> {
  const width = Math.max(element.scrollWidth, 900);
  const options = {
    quality: 1,
    pixelRatio: 2,
    width,
    style: {
      transform: "scale(1)",
    },
  };
  return format === "png" ? toPng(element, options) : toJpeg(element, options);
}

/** 网页版导出（PNG / JPEG 网页截图；PDF 为 A4 文档排版） */
export async function exportReport(
  element: HTMLElement,
  format: ExportFormat,
  result?: AssessmentResult,
  filename = "长寿评估报告"
): Promise<void> {
  if (format === "png" || format === "jpeg") {
    const dataUrl = await captureImage(element, format);
    const link = document.createElement("a");
    link.download = `${filename}.${format}`;
    link.href = dataUrl;
    link.click();
    return;
  }

  // PDF：A4 文档式排版
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const pages = await generateA4Pages(result, siteUrl);
  const pdf = new jsPDF("p", "pt", "a4");
  // A4 纸张实际尺寸为 595×842pt，图片需缩放适配纸张，避免超出被裁切
  const pageW = 595;
  const pageH = 842;
  pages.forEach((dataUrl, i) => {
    if (i > 0) pdf.addPage();
    pdf.addImage(dataUrl, "JPEG", 0, 0, pageW, pageH);
  });
  pdf.save(`${filename}.pdf`);
}

/* ==================== 手机端分享长图（Canvas 绘制） ==================== */

/** 圆角矩形路径 */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 绘制多行文本（自动换行），返回结束 y */
export function wrapText(
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

/** 用 Canvas 原生绘制手机分享长图，彻底避免 html-to-image 空白问题 */
export async function exportShareImage(
  result: AssessmentResult,
  siteUrl = "https://chi-longevity.bmaxkai.me"
): Promise<void> {
  const W = 750;
  const headerH = 480;
  const bodyH = 580;
  // 功能医学失衡区块（完成功能医学问卷时追加）
  const fmH = result.functional?.included ? 500 : 0;
  const footerH = 340;
  const H = headerH + bodyH + fmH + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 不支持");

  const levelColor = LEVEL_COLORS[result.level] || "#3186D8";
  const score = Math.round(result.chliScore);
  const dims = result.dimensions;

  /* ---------- 顶部渐变区 ---------- */
  const grad = ctx.createLinearGradient(0, 0, W, headerH);
  grad.addColorStop(0, "#042A4D");
  grad.addColorStop(0.45, "#0A5BA8");
  grad.addColorStop(1, "#3186D6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, headerH);

  // 装饰网格纹理
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, headerH);
    ctx.stroke();
  }
  for (let y = 0; y < headerH; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 装饰光晕
  const glowGrad = ctx.createRadialGradient(W / 2, 270, 30, W / 2, 270, 180);
  glowGrad.addColorStop(0, "rgba(255,255,255,0.18)");
  glowGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(W / 2, 270, 180, 0, Math.PI * 2);
  ctx.fill();

  // 品牌徽标（去掉医疗十字标，纯文字居中）
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  roundRect(ctx, W / 2 - 200, 50, 400, 56, 28);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 26px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("百岁白皮书 · 长寿指数评估", W / 2, 79);

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "18px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.fillText("中国百岁健康标准指数（CHLI）", W / 2, 132);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "600 22px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.fillText("综合长寿指数", W / 2, 180);

  // 大数字（精确居中）
  const slashGap = 14;
  ctx.font = "800 120px 'PingFang SC','Microsoft YaHei',sans-serif";
  const scoreText = String(score);
  const scoreW = ctx.measureText(scoreText).width;
  ctx.font = "500 34px 'PingFang SC','Microsoft YaHei',sans-serif";
  const slashText = "/ 100";
  const slashW = ctx.measureText(slashText).width;
  const totalW = scoreW + slashGap + slashW;
  const startX = (W - totalW) / 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 120px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(scoreText, startX, 300);
  ctx.font = "500 34px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(slashText, startX + scoreW + slashGap, 286);

  // 等级标签
  ctx.font = "700 22px 'PingFang SC','Microsoft YaHei',sans-serif";
  const labelText = `健康等级 · ${result.label}`;
  const labelTextW = ctx.measureText(labelText).width;
  const tagW = labelTextW + 40;
  ctx.fillStyle = levelColor;
  roundRect(ctx, (W - tagW) / 2, 332, tagW, 48, 24);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labelText, W / 2, 358);

  // 分享金句
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "italic 22px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`「 ${pickShareQuote(result)} 」`, W / 2, 418);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "17px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.fillText("—— 测一测你的长寿指数，扫码测一测 ——", W / 2, 452);

  /* ---------- 内容主体：雷达图 ---------- */
  ctx.fillStyle = "#F0F6FC";
  ctx.fillRect(0, headerH, W, bodyH);

  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(6,61,112,0.10)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, 32, headerH + 30, W - 64, bodyH - 60, 18);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "#12232E";
  ctx.font = "700 28px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("六大维度得分雷达", 56, headerH + 78);

  /** 绘制雷达图 */
  const radarCx = W / 2;
  const radarCy = headerH + bodyH / 2 - 10;
  // 缩小半径，确保含标签时不会超出白色卡片边界
  const radarR = Math.min((W - 64) / 2 - 150, (bodyH - 120) / 2 - 60);
  const n = dims.length;
  // 每个轴的角度（从顶部开始顺时针）
  const axes: { angle: number; dim: typeof dims[0] }[] = dims.map((d, i) => ({
    angle: -Math.PI / 2 + (i * 2 * Math.PI) / n,
    dim: d,
  }));

  // 网格层（20/40/60/80/100）
  ctx.strokeStyle = "#E8F0FA";
  ctx.lineWidth = 1;
  for (let level = 1; level <= 5; level++) {
    const r = (radarR * level) / 5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = radarCx + Math.cos(axes[i].angle) * r;
      const y = radarCy + Math.sin(axes[i].angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 轴线
  ctx.strokeStyle = "#DCE9F8";
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(radarCx, radarCy);
    ctx.lineTo(
      radarCx + Math.cos(axes[i].angle) * radarR,
      radarCy + Math.sin(axes[i].angle) * radarR
    );
    ctx.stroke();
  }

  // 等级刻度（中心圈上的 20/40/60/80/100）
  ctx.fillStyle = "#8494A6";
  ctx.font = "12px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let level = 1; level <= 5; level++) {
    const r = (radarR * level) / 5;
    ctx.fillText(String(level * 20), radarCx, radarCy - r);
  }

  // 得分多边形（填充 + 描边 + 顶点圆点）
  const scorePoints = axes.map((a) => {
    const s = Math.max(0, Math.min(100, a.dim.score)) / 100;
    return {
      x: radarCx + Math.cos(a.angle) * radarR * s,
      y: radarCy + Math.sin(a.angle) * radarR * s,
      level: a.dim.level,
      dim: a.dim,
    };
  });

  // 填充半透明渐变
  const fillGrad = ctx.createRadialGradient(radarCx, radarCy, 0, radarCx, radarCy, radarR);
  fillGrad.addColorStop(0, "rgba(49, 134, 216, 0.4)");
  fillGrad.addColorStop(1, "rgba(49, 134, 216, 0.15)");
  ctx.fillStyle = fillGrad;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    if (i === 0) ctx.moveTo(scorePoints[i].x, scorePoints[i].y);
    else ctx.lineTo(scorePoints[i].x, scorePoints[i].y);
  }
  ctx.closePath();
  ctx.fill();

  // 描边
  ctx.strokeStyle = "#3186D8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    if (i === 0) ctx.moveTo(scorePoints[i].x, scorePoints[i].y);
    else ctx.lineTo(scorePoints[i].x, scorePoints[i].y);
  }
  ctx.closePath();
  ctx.stroke();

  // 顶点圆点
  scorePoints.forEach((p) => {
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = LEVEL_COLORS[p.level] || "#3186D8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // 维度标签（轴外侧，较短名称）
  ctx.textBaseline = "middle";
  for (let i = 0; i < n; i++) {
    const a = axes[i];
    const labelR = radarR + 34;
    const lx = radarCx + Math.cos(a.angle) * labelR;
    const ly = radarCy + Math.sin(a.angle) * labelR;

    const c = LEVEL_COLORS[a.dim.level] || "#3186D8";
    const s = Math.round(a.dim.score);

    // 使用短名称
    const shortName = shortDimName(a.dim.name);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 13px 'PingFang SC','Microsoft YaHei',sans-serif";
    const labelText = `${a.dim.key} · ${shortName}`;
    const tw = ctx.measureText(labelText).width;
    roundRect(ctx, lx - tw / 2 - 10, ly - 12, tw + 20, 24, 12);
    ctx.fill();
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#12232E";
    ctx.font = "600 13px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelText, lx, ly);

    // 分数（标签下方）
    ctx.fillStyle = c;
    ctx.font = "700 15px 'PingFang SC','Microsoft YaHei',sans-serif";
    const scoreY = ly + (Math.abs(Math.sin(a.angle)) > 0.4 ? (a.angle > 0 ? 22 : -22) : 22);
    ctx.fillText(`${s}`, lx, scoreY);
  }

  /* ---------- 功能医学失衡区块 ---------- */
  if (fmH > 0 && result.functional) {
    const fmY = headerH + bodyH;
    ctx.fillStyle = "#F0F6FC";
    ctx.fillRect(0, fmY, W, fmH);

    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(6,61,112,0.10)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, 32, fmY + 30, W - 64, fmH - 60, 18);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = "#12232E";
    ctx.font = "700 26px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("功能医学失衡评估", 56, fmY + 76);

    // 失衡负荷率标签
    const loadRate = result.functional.loadRate;
    const loadColor = loadRate < 15 ? "#10B981" : loadRate < 30 ? "#F59E0B" : loadRate < 45 ? "#F97316" : "#EF4444";
    ctx.font = "600 17px 'PingFang SC','Microsoft YaHei',sans-serif";
    const loadText = `失衡负荷率 ${loadRate}%（越低越好）`;
    ctx.fillStyle = "#55677A";
    ctx.fillText(loadText, 56, fmY + 106);

    // 七大类别条形
    const cats = result.functional.categories;
    const barX = 220;
    const barW = W - 64 - 40 - (barX - 56) - 70;
    let by = fmY + 136;
    cats.forEach((c) => {
      const rate = Math.min(100, Math.max(0, c.rate));
      const high = c.rate >= 30;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = "16px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillStyle = "#2B3A48";
      ctx.fillText(`${c.icon} ${c.name}`, 56, by + 10);
      // 轨道
      ctx.fillStyle = "#E8F0FA";
      roundRect(ctx, barX, by, barW, 20, 10);
      ctx.fill();
      // 填充
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      if (high) {
        barGrad.addColorStop(0, "#FB923C");
        barGrad.addColorStop(1, "#EF4444");
      } else {
        barGrad.addColorStop(0, "#2DD4BF");
        barGrad.addColorStop(1, "#6EE7B7");
      }
      ctx.fillStyle = barGrad;
      roundRect(ctx, barX, by, Math.max(16, (barW * rate) / 100), 20, 10);
      ctx.fill();
      // 数值
      ctx.fillStyle = high ? "#EA580C" : "#8494A6";
      ctx.font = "700 15px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${c.rate}%`, barX + barW + 56, by + 10);
      by += 42;
    });

    // 主要问题摘要（前 3 条）
    if (result.functional.mainProblems.length > 0) {
      by += 4;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#8494A6";
      ctx.font = "15px 'PingFang SC','Microsoft YaHei',sans-serif";
      const summary = result.functional.mainProblems.slice(0, 2).join("；");
      wrapText(ctx, summary, 56, by, W - 120, 22);
    }
  }

  /* ---------- 底部：二维码 ---------- */
  const footerY = headerH + bodyH + fmH;
  ctx.fillStyle = "#F0F6FC";
  ctx.fillRect(0, footerY, W, footerH);

  const cardW = W - 160;
  const cardX = 80;
  const cardY = footerY + 36;
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(6,61,112,0.10)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, cardX, cardY, cardW, footerH - 92, 18);
  ctx.fill();
  ctx.shadowColor = "transparent";

  const qrUrl = `${siteUrl}/questionnaire`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 240,
    margin: 1,
    color: { dark: "#063D70", light: "#FFFFFF" },
  });
  const qrImg = new Image();
  await new Promise<void>((resolve) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = () => resolve();
    qrImg.src = qrDataUrl;
  });

  const qrSize = 180;
  const qrPadTop = 30;
  ctx.drawImage(qrImg, cardX + 40, cardY + qrPadTop, qrSize, qrSize);

  const textX = cardX + 40 + qrSize + 32;
  const textCenterY = cardY + qrPadTop + qrSize / 2;
  ctx.textBaseline = "alphabetic";

  ctx.textAlign = "left";
  ctx.fillStyle = "#0A5BA8";
  ctx.font = "700 30px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.fillText("扫码立即测试", textX, textCenterY - 36);

  ctx.fillStyle = "#55677A";
  ctx.font = "20px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.fillText("你也来测一测自己的", textX, textCenterY - 6);
  ctx.fillText("健康寿命指数", textX, textCenterY + 22);

  ctx.fillStyle = "#8494A6";
  ctx.font = "16px 'PingFang SC','Microsoft YaHei',sans-serif";
  const urlMaxW = cardX + cardW - 40 - textX;
  wrapText(ctx, qrUrl, textX, textCenterY + 58, urlMaxW, 22);

  ctx.fillStyle = "#8494A6";
  ctx.font = "17px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("健康数据仅供参考，不构成医疗建议 · 请及时就医", W / 2, footerY + footerH - 32);

  // 报告唯一编码（灰色小字，不显眼）
  if (result.reportCode) {
    ctx.fillStyle = "#B8C4D2";
    ctx.font = "13px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(`报告编号：${result.reportCode}`, W / 2, footerY + footerH - 12);
  }

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = "长寿指数分享.png";
  link.href = dataUrl;
  link.click();
}

/** 根据综合指数与等级挑选一条分享金句 */
function pickShareQuote(r: AssessmentResult): string {
  if (r.level === "excellent") return "健康长寿，由点滴积累而成";
  if (r.level === "good") return "今天的好习惯，是明天的健康资产";
  if (r.level === "moderate") return "读懂身体信号，开启改善之旅";
  if (r.level === "highRisk") return "健康管理，从一次评估开始";
  return "好的身体，是最值得投资的长寿";
}

/** 截短维度名，便于在雷达图标签显示 */
function shortDimName(name: string): string {
  const map: Record<string, string> = {
    "生物年龄指数": "生物年龄",
    "功能健康指数": "功能健康",
    "代谢与慢病风险指数": "代谢慢病",
    "生活方式与行为指数": "生活方式",
    "心理认知与社交参与指数": "心理认知",
    "数字健康轨迹指数": "数字健康",
  };
  return map[name] || name.replace(/指数$/, "");
}

/* ==================== A4 PDF 文档排版（Canvas 绘制） ==================== */

export const A4W = 794;
export const A4H = 1123;
export const SCALE = 1.5;
export const MARGIN = 56;

export function createA4Canvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = A4W * SCALE;
  canvas.height = A4H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  return { canvas, ctx };
}

/** 文档页眉 */
export function drawDocHeader(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#0A5BA8";
  ctx.fillRect(0, 0, A4W, 6);
  ctx.fillStyle = "#55677A";
  ctx.font = "11px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("百岁白皮书 · 长寿指数评估报告", MARGIN, 32);
  ctx.textAlign = "right";
  ctx.fillText("CHLI 健康评估", A4W - MARGIN, 32);
  ctx.strokeStyle = "#DCE9F8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, 42);
  ctx.lineTo(A4W - MARGIN, 42);
  ctx.stroke();
}

/** 文档页脚 */
export function drawDocFooter(ctx: CanvasRenderingContext2D, page: number, total: number, dateStr: string) {
  const fy = A4H - 40;
  ctx.strokeStyle = "#DCE9F8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, fy - 12);
  ctx.lineTo(A4W - MARGIN, fy - 12);
  ctx.stroke();
  ctx.fillStyle = "#8494A6";
  ctx.font = "10px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`生成日期：${dateStr}`, MARGIN, fy);
  ctx.textAlign = "center";
  ctx.fillText("本报告仅供参考，不构成医疗诊断建议", A4W / 2, fy);
  ctx.textAlign = "right";
  ctx.fillText(`第 ${page} 页 / 共 ${total} 页`, A4W - MARGIN, fy);
}

/** 章节标题（带编号方块） */
function drawSectionTitle(ctx: CanvasRenderingContext2D, num: string, title: string, y: number): number {
  ctx.fillStyle = "#0A5BA8";
  roundRect(ctx, MARGIN, y - 18, 32, 28, 6);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 16px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(num, MARGIN + 16, y - 4);
  ctx.fillStyle = "#12232E";
  ctx.font = "700 20px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, MARGIN + 44, y);
  ctx.strokeStyle = "#0A5BA8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y + 12);
  ctx.lineTo(A4W - MARGIN, y + 12);
  ctx.stroke();
  return y + 36;
}

/** 段落正文（首行缩进） */
function drawParagraph(ctx: CanvasRenderingContext2D, text: string, y: number, indent = true): number {
  ctx.fillStyle = "#2B3A48";
  ctx.font = "13px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const prefix = indent ? "    " : "";
  return wrapText(ctx, prefix + text, MARGIN, y, A4W - MARGIN * 2, 24);
}

/** 表格行 */
function drawTableRow(
  ctx: CanvasRenderingContext2D,
  cols: { text: string; x: number; align: "left" | "center" | "right" }[],
  y: number,
  rowH: number,
  isHeader = false,
  isAlt = false
) {
  ctx.fillStyle = isHeader ? "#0A5BA8" : isAlt ? "#F0F6FC" : "#FFFFFF";
  ctx.fillRect(MARGIN, y, A4W - MARGIN * 2, rowH);
  ctx.fillStyle = isHeader ? "#FFFFFF" : "#2B3A48";
  ctx.font = isHeader ? "600 13px 'PingFang SC','Microsoft YaHei',sans-serif" : "13px 'PingFang SC','Microsoft YaHei',sans-serif";
  ctx.textBaseline = "middle";
  cols.forEach((col) => {
    ctx.textAlign = col.align;
    ctx.fillText(col.text, col.x, y + rowH / 2);
  });
  ctx.strokeStyle = "#DCE9F8";
  ctx.lineWidth = 1;
  ctx.strokeRect(MARGIN, y, A4W - MARGIN * 2, rowH);
}

/** 生成 A4 文档式排版的多页图片 */
export async function generateA4Pages(
  result?: AssessmentResult,
  siteUrl = "",
  coachInterpretation?: string
): Promise<string[]> {
  if (!result) return [];
  const meta = RISK_META[result.level];
  const levelColor = LEVEL_COLORS[result.level] || "#3186D8";
  const score = Math.round(result.chliScore);
  const dims = result.dimensions;
  const dateStr = new Date(result.createdAt || Date.now()).toLocaleDateString("zh-CN");
  const pages: string[] = [];
  // 完成功能医学问卷时额外增加一页「功能医学失衡评估」
  const hasFunctional = !!result.functional?.included;
  // 第5/6页根据是否有人工解读显示「AI解读」或「人工解读总结」
  const TOTAL = hasFunctional ? 6 : 5;

  /* ========== 第 1 页：封面 ========== */
  {
    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4W, A4H);

    // 顶部品牌色块
    const grad = ctx.createLinearGradient(0, 0, 0, 450);
    grad.addColorStop(0, "#042A4D");
    grad.addColorStop(0.6, "#0A5BA8");
    grad.addColorStop(1, "#3186D8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, A4W, 450);

    // 品牌标识（去掉医疗十字，纯文字）
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 16px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("百岁白皮书 · CHLI", MARGIN, 62);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "13px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("中国百岁健康标准指数", A4W - MARGIN, 62);

    // 主标题
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 44px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("长寿指数评估报告", A4W / 2, 200);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "18px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("Longevity Health Assessment Report", A4W / 2, 236);

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(A4W / 2 - 120, 270);
    ctx.lineTo(A4W / 2 + 120, 270);
    ctx.stroke();

    // 综合指数
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "16px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("综合长寿指数", A4W / 2, 310);

    ctx.font = "800 90px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const numW = ctx.measureText(String(score)).width;
    ctx.fillText(String(score), A4W / 2, 390);
    ctx.font = "500 28px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "left";
    ctx.fillText("/ 100", A4W / 2 + numW / 2 + 8, 386);

    // 等级标签
    ctx.textAlign = "center";
    ctx.font = "700 18px 'PingFang SC','Microsoft YaHei',sans-serif";
    const lvText = `健康等级：${result.label}`;
    const lvW = ctx.measureText(lvText).width;
    ctx.fillStyle = levelColor;
    roundRect(ctx, (A4W - lvW - 40) / 2, 410, lvW + 40, 32, 16);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(lvText, A4W / 2, 431);

    // 信息表格
    let y = 500;
    ctx.fillStyle = "#12232E";
    ctx.font = "700 18px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("报告信息", MARGIN, y);
    ctx.strokeStyle = "#DCE9F8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN, y + 8);
    ctx.lineTo(A4W - MARGIN, y + 8);
    ctx.stroke();

    y += 30;
    const infoRows: [string, string][] = [
      ["报告名称", "长寿指数评估报告"],
      ["报告编码", result.reportCode || "—"],
      ["评估模型", "中国百岁健康标准指数（CHLI）"],
      ["生成日期", dateStr],
      ["综合指数", `${score} / 100`],
      ["健康等级", result.label],
      ["实际年龄", result.bioAge.actualAge != null ? `${result.bioAge.actualAge} 岁` : "未填写"],
      ["生物年龄", result.bioAge.biologicalAge != null ? `${result.bioAge.biologicalAge} 岁` : "未填写"],
    ];
    infoRows.forEach((row, i) => {
      const ry = y + i * 32;
      ctx.fillStyle = i % 2 === 0 ? "#F8FBFD" : "#FFFFFF";
      ctx.fillRect(MARGIN, ry, A4W - MARGIN * 2, 32);
      ctx.fillStyle = "#8494A6";
      ctx.font = "13px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(row[0], MARGIN + 16, ry + 16);
      ctx.fillStyle = "#12232E";
      ctx.font = "600 13px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText(row[1], MARGIN + 160, ry + 16);
      ctx.strokeStyle = "#E8F0FA";
      ctx.strokeRect(MARGIN, ry, A4W - MARGIN * 2, 32);
    });

    // 保密说明
    y = A4H - 120;
    ctx.fillStyle = "#F0F6FC";
    roundRect(ctx, MARGIN, y, A4W - MARGIN * 2, 70, 8);
    ctx.fill();
    ctx.fillStyle = "#55677A";
    ctx.font = "12px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    wrapText(ctx, "保密说明：本报告含个人健康评估信息，仅供本人参考。报告由「百岁白皮书」系统基于 CHLI 模型自动生成，不构成医疗诊断建议，如有健康问题请及时就医。", MARGIN + 16, y + 26, A4W - MARGIN * 2 - 32, 20);

    pages.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  /* ========== 第 2 页：综合评估结果 ========== */
  {
    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4W, A4H);
    drawDocHeader(ctx);

    let y = 80;
    y = drawSectionTitle(ctx, "一", "综合评估结果", y);
    y = drawParagraph(ctx, `根据中国百岁健康标准指数（CHLI）评估模型，您的综合长寿指数为 ${score} 分（满分 100 分），健康等级评定为「${result.label}」。${meta.description}`, y + 6);
    y += 16;

    ctx.fillStyle = "#0A5BA8";
    ctx.font = "700 15px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("1.1 生物年龄对比", MARGIN, y);
    y += 24;

    const bioRows = [
      [{ text: "指标", x: MARGIN + 100, align: "center" as const }, { text: "数值", x: MARGIN + 280, align: "center" as const }, { text: "说明", x: MARGIN + 480, align: "center" as const }],
      [{ text: "实际年龄", x: MARGIN + 100, align: "center" as const }, { text: result.bioAge.actualAge != null ? `${result.bioAge.actualAge} 岁` : "未填写", x: MARGIN + 280, align: "center" as const }, { text: "出生至今的实际年限", x: MARGIN + 480, align: "center" as const }],
      [{ text: "生物年龄", x: MARGIN + 100, align: "center" as const }, { text: result.bioAge.biologicalAge != null ? `${result.bioAge.biologicalAge} 岁` : "未填写", x: MARGIN + 280, align: "center" as const }, { text: "基于生物标志物测算", x: MARGIN + 480, align: "center" as const }],
      [{ text: "年龄差值", x: MARGIN + 100, align: "center" as const }, { text: result.bioAge.ageGap != null ? `${result.bioAge.ageGap > 0 ? "+" : ""}${result.bioAge.ageGap} 岁` : "—", x: MARGIN + 280, align: "center" as const }, { text: result.bioAge.ageGap == null ? "补充年龄后生成对比" : result.bioAge.ageGap < 0 ? "生物年龄更年轻" : result.bioAge.ageGap > 2 ? "衰老速度偏快" : "基本相当", x: MARGIN + 480, align: "center" as const }],
    ];
    const bioRowH = 34;
    bioRows.forEach((row, i) => {
      drawTableRow(ctx, row, y + i * bioRowH, bioRowH, i === 0, i % 2 === 0 && i !== 0);
    });
    y += bioRows.length * bioRowH + 16;

    const gap = result.bioAge.ageGap;
    const gapDesc = gap == null
      ? "本次评估未填写实际年龄，补充后可获得生物年龄对比与衰老速度分析。"
      : gap < -2
      ? `您的生物年龄比实际年龄年轻 ${Math.abs(gap)} 岁，表明身体衰老速度较慢，细胞功能与身体机能处于同龄人优秀水平，这是长期健康生活方式的积极回报。`
      : gap > 2
      ? `您的生物年龄比实际年龄大 ${gap} 岁，提示身体衰老速度相对偏快，通常是生活方式、代谢状态或慢性压力长期累积的结果，但也意味着有较大的改善空间。`
      : `您的生物年龄与实际年龄基本相当，处于正常衰老轨道，基础健康状况良好。`;
    y = drawParagraph(ctx, gapDesc, y);
    y += 20;

    ctx.fillStyle = "#0A5BA8";
    ctx.font = "700 15px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("1.2 健康等级说明", MARGIN, y);
    y += 24;
    y = drawParagraph(ctx, `您当前的健康等级为「${result.label}」。${meta.description} 建议结合下方各维度分析，针对性改善薄弱环节，巩固优势维度，持续提升综合健康水平。`, y);

    drawDocFooter(ctx, 2, TOTAL, dateStr);
    pages.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  /* ========== 第 3 页：六大维度分析 ========== */
  {
    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4W, A4H);
    drawDocHeader(ctx);

    let y = 80;
    y = drawSectionTitle(ctx, "二", "六大维度分析", y);
    y = drawParagraph(ctx, "CHLI 综合指数由六大维度加权计算：生物年龄（20%）、功能健康（20%）、代谢慢病（20%）、生活方式（15%）、心理认知（10%）、数字健康（15%）。各维度得分如下：", y + 6);
    y += 12;

    const dimRowH = 36;
    const headerCols = [
      { text: "维度", x: MARGIN + 80, align: "center" as const },
      { text: "权重", x: MARGIN + 220, align: "center" as const },
      { text: "得分", x: MARGIN + 320, align: "center" as const },
      { text: "等级", x: MARGIN + 420, align: "center" as const },
      { text: "状态", x: MARGIN + 560, align: "center" as const },
    ];
    drawTableRow(ctx, headerCols, y, dimRowH, true);
    y += dimRowH;

    const sorted = [...dims].sort((a, b) => b.score - a.score);
    const strong = sorted[0];
    const weak = sorted[sorted.length - 1];
    dims.forEach((d, i) => {
      const dMeta = RISK_META[d.level];
      const levelLabel = d.level === "excellent" ? "优" : d.level === "good" ? "良" : d.level === "moderate" ? "中" : d.level === "risk" ? "风险" : "高风险";
      const rows = [
        { text: `${d.key} · ${d.name}`, x: MARGIN + 80, align: "center" as const },
        { text: `${(d.weight * 100).toFixed(0)}%`, x: MARGIN + 220, align: "center" as const },
        { text: `${Math.round(d.score)}`, x: MARGIN + 320, align: "center" as const },
        { text: levelLabel, x: MARGIN + 420, align: "center" as const },
        { text: dMeta.label, x: MARGIN + 560, align: "center" as const },
      ];
      drawTableRow(ctx, rows, y + i * dimRowH, dimRowH, false, i % 2 === 1);
    });
    y += dims.length * dimRowH + 20;

    ctx.fillStyle = "#10B981";
    ctx.font = "700 15px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("● 优势维度", MARGIN, y);
    y += 24;
    y = drawParagraph(ctx, `得分最高的维度是「${strong.name}」（${strong.score.toFixed(1)} 分），是您健康寿命的重要支撑，建议继续保持当前的健康行为模式。`, y);
    y += 16;

    ctx.fillStyle = "#F59E0B";
    ctx.font = "700 15px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("● 重点关注", MARGIN, y);
    y += 24;
    y = drawParagraph(ctx, `相对薄弱的维度是「${weak.name}」（${weak.score.toFixed(1)} 分），建议优先改善以提升整体指数。具体改善建议见下一章节。`, y);

    drawDocFooter(ctx, 3, TOTAL, dateStr);
    pages.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  /* ========== 第 4 页（可选）：功能医学失衡评估 ========== */
  if (hasFunctional && result.functional) {
    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4W, A4H);
    drawDocHeader(ctx);

    let y = 80;
    y = drawSectionTitle(ctx, "三", "功能医学失衡评估", y);
    const fm = result.functional;
    y = drawParagraph(
      ctx,
      `基于《功能医学思路》两段式问卷，对吸收与排泄、排毒、防御、细胞通信、细胞运输、能量转换、结构完整性七大核心生理过程进行失衡评估。您的综合失衡负荷率为 ${fm.loadRate}%（该指标已作为「功能失衡负荷」计入生活方式维度）。`,
      y + 6
    );
    y += 10;

    // 七大类别表格
    const fmRowH = 32;
    const fmHeader = [
      { text: "失衡类别", x: MARGIN + 100, align: "center" as const },
      { text: "失衡率", x: MARGIN + 250, align: "center" as const },
      { text: "状态", x: MARGIN + 400, align: "center" as const },
      { text: "说明", x: MARGIN + 560, align: "center" as const },
    ];
    drawTableRow(ctx, fmHeader, y, fmRowH, true);
    y += fmRowH;
    fm.categories.forEach((c, i) => {
      const rows = [
        { text: `${c.icon} ${c.name}`, x: MARGIN + 100, align: "center" as const },
        { text: `${c.rate}%`, x: MARGIN + 250, align: "center" as const },
        { text: c.selected ? "专项详查" : c.rate >= 30 ? "重点关注" : "正常", x: MARGIN + 400, align: "center" as const },
        { text: c.description.slice(0, 18) + "…", x: MARGIN + 560, align: "center" as const },
      ];
      drawTableRow(ctx, rows, y + i * fmRowH, fmRowH, false, i % 2 === 1);
    });
    y += fm.categories.length * fmRowH + 14;

    // 主要问题摘要
    if (fm.mainProblems.length > 0) {
      ctx.fillStyle = "#F59E0B";
      ctx.font = "700 15px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("● 主要问题摘要", MARGIN, y);
      y += 22;
      for (const line of fm.mainProblems) {
        y = drawParagraph(ctx, line, y);
        y += 4;
      }
      y += 8;
    }

    // 入选类别干预建议（每类摘要）
    ctx.fillStyle = "#0A5BA8";
    ctx.font = "700 15px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("● 个性化干预建议", MARGIN, y);
    y += 22;
    for (const iv of fm.interventions) {
      if (y > A4H - 200) break;
      ctx.fillStyle = "#12232E";
      ctx.font = "600 13px 'PingFang SC','Microsoft YaHei',sans-serif";
      y = wrapText(ctx, `${iv.icon} ${iv.name}：${iv.summary}`, MARGIN, y, A4W - MARGIN * 2, 22);
      y += 2;
      const groups: [string, string[]][] = [
        ["饮食", iv.diet],
        ["营养补充", iv.supplements],
        ["生活方式", iv.lifestyle],
        ["建议检测", iv.tests],
      ];
      for (const [gname, items] of groups) {
        if (!items?.length || y > A4H - 170) break;
        ctx.fillStyle = "#8494A6";
        ctx.font = "12px 'PingFang SC','Microsoft YaHei',sans-serif";
        y = wrapText(ctx, `${gname}：${items.slice(0, 3).join("；")}`, MARGIN + 16, y, A4W - MARGIN * 2 - 16, 20);
        y += 4;
      }
      y += 8;
    }
    y = drawParagraph(ctx, "以上干预建议仅供参考，营养补充剂请在医生或健康管理师指导下使用；完整建议详见线上报告。", y, false);

    drawDocFooter(ctx, 4, TOTAL, dateStr);
    pages.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  /* ========== 第 5 页：改善建议 + AI 解读 ========== */
  {
    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4W, A4H);
    drawDocHeader(ctx);

    let y = 80;
    y = drawSectionTitle(ctx, hasFunctional ? "四" : "三", "个性化改善建议", y);
    y = drawParagraph(ctx, "基于您的评估结果，以下是为您生成的重点行动建议，建议以 90 天为一个改善周期执行：", y + 6);
    y += 8;

    // 提取改善建议列表（from insights）
    const insights = generateRuleInsights(result);
    const lines = insights.split("\n");
    let tipNum = 0;
    for (const line of lines) {
      if (y > A4H - 160) break;
      if (line.startsWith("## 改善建议")) continue;
      if (line.startsWith("## ")) {
        if (tipNum > 0) break; // 建议之后的其他章节放到下一页
        continue;
      }
      if (/^\d+\.\s/.test(line)) {
        tipNum++;
        const text = line.replace(/^\d+\.\s/, "");
        ctx.fillStyle = "#0A5BA8";
        ctx.beginPath();
        ctx.arc(MARGIN + 12, y - 4, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 12px 'PingFang SC','Microsoft YaHei',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(tipNum), MARGIN + 12, y - 4);
        ctx.fillStyle = "#2B3A48";
        ctx.font = "13px 'PingFang SC','Microsoft YaHei',sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        y = wrapText(ctx, text, MARGIN + 32, y, A4W - MARGIN * 2 - 32, 22);
        y += 12;
      }
    }

    drawDocFooter(ctx, hasFunctional ? 5 : 4, TOTAL, dateStr);
    pages.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  /* ========== 第 6 页：AI 智能解读 / 人工解读总结 ========== */
  {
    const { canvas, ctx } = createA4Canvas();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4W, A4H);
    drawDocHeader(ctx);

    let y = 80;
    // 有人工解读时，用人工解读替换 AI 解读
    const hasCoach = coachInterpretation && coachInterpretation.trim();
    y = drawSectionTitle(ctx, hasFunctional ? "五" : "四", hasCoach ? "健康管理师总结" : "AI 智能解读", y);
    y = drawParagraph(
      ctx,
      hasCoach
        ? "以下是健康管理师对本报告的人工解读与综合建议："
        : "以下是系统基于您的评估结果生成的智能解读与健康展望：",
      y + 6
    );
    y += 10;

    if (hasCoach) {
      // 渲染人工解读（简化 markdown）
      const text = stripMarkdown(coachInterpretation);
      const lines = text.split("\n");
      for (const line of lines) {
        if (y > A4H - 160) break;
        if (line.trim() === "") {
          y += 12;
        } else {
          ctx.fillStyle = "#2B3A48";
          ctx.font = "12px 'PingFang SC','Microsoft YaHei',sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          y = wrapText(ctx, line, MARGIN, y, A4W - MARGIN * 2, 20);
          y += 8;
        }
      }
    } else {
      const insights = generateRuleInsights(result);
      const lines = insights.split("\n");
      let startAI = false;
      for (const line of lines) {
        if (y > A4H - 160) break;
        if (line.startsWith("## 健康展望")) { startAI = true; continue; }
        if (!startAI) continue;
        if (line.startsWith("> ")) {
          y += 4;
          ctx.fillStyle = "#8494A6";
          ctx.font = "11px 'PingFang SC','Microsoft YaHei',sans-serif";
          y = wrapText(ctx, line.replace("> ", ""), MARGIN + 16, y, A4W - MARGIN * 2 - 16, 18);
          y += 8;
        } else if (line.trim() === "") {
          y += 10;
        } else if (line.startsWith("- ")) {
          ctx.fillStyle = "#55677A";
          ctx.font = "12px 'PingFang SC','Microsoft YaHei',sans-serif";
          ctx.fillText("•", MARGIN + 8, y);
          y = wrapText(ctx, line.replace("- ", ""), MARGIN + 24, y, A4W - MARGIN * 2 - 24, 20);
          y += 6;
        } else {
          // 使用更紧凑的字体与行距
          ctx.fillStyle = "#2B3A48";
          ctx.font = "12px 'PingFang SC','Microsoft YaHei',sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          y = wrapText(ctx, "    " + line, MARGIN, y, A4W - MARGIN * 2, 20);
          y += 6;
        }
      }
    }

    // 底部二维码
    const qrUrl = `${siteUrl}/questionnaire`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 160,
      margin: 1,
      color: { dark: "#063D70", light: "#FFFFFF" },
    });
    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = () => resolve();
      qrImg.src = qrDataUrl;
    });
    const qrY = A4H - 150;
    ctx.drawImage(qrImg, MARGIN, qrY, 70, 70);
    ctx.fillStyle = "#0A5BA8";
    ctx.font = "700 13px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("扫码立即测试评估", MARGIN + 86, qrY + 26);
    ctx.fillStyle = "#8494A6";
    ctx.font = "11px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("你也来测一测自己的健康寿命指数", MARGIN + 86, qrY + 46);
    ctx.fillText(qrUrl, MARGIN + 86, qrY + 62);

    drawDocFooter(ctx, TOTAL, TOTAL, dateStr);
    pages.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  return pages;
}

/** 简化 Markdown：移除标记符号，转为纯文本 */
function stripMarkdown(md: string): string {
  return md
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1");
}
