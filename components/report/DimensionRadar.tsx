"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { AssessmentResult } from "@/lib/chli-model";

export function DimensionRadar({ result }: { result: AssessmentResult }) {
  const data = result.dimensions.map((d) => ({
    dimension: d.key,
    score: Math.round(d.score),
    fullName: d.name,
  }));

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
