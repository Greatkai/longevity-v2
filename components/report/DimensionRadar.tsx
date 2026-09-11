"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Sparkles } from "lucide-react";
import type { AssessmentResult } from "@/lib/chli-model";
import { RISK_META } from "@/lib/chli-model";

export function DimensionRadar({ result }: { result: AssessmentResult }) {
  const data = result.dimensions.map((d) => ({
    dimension: d.key,
    score: Math.round(d.score),
    fullName: d.name,
  }));

  // 参与维度少于 3 个时雷达图会退化成线段/散点，改用条形展示
  if (data.length < 3) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-2 rounded-xl bg-brand-50/70 px-4 py-3 text-xs text-brand-700">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          本次评估仅包含 {data.length} 个维度，维度分布以条形展示
        </div>
        {result.dimensions.map((d) => {
          const meta = RISK_META[d.level];
          return (
            <div key={d.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-800">
                  {d.key} · {d.name}
                </span>
                <span className="font-bold tabular-nums" style={{ color: meta.color }}>
                  {Math.round(d.score)}
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-brand-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(2, d.score)}%`, backgroundColor: meta.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid stroke="#DCE8F7" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#1F2A37", fontSize: 14, fontWeight: 600 }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tickCount={5}
          tick={{ fill: "#9CA3AF", fontSize: 10 }}
        />
        <Radar
          name="得分"
          dataKey="score"
          stroke="#005BAC"
          fill="#2E8BE6"
          fillOpacity={0.45}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
