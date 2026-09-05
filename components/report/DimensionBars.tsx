"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import type { AssessmentResult } from "@/lib/chli-model";

const COLORS = [
  "#005BAC",
  "#0EA5E9",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
];

export function DimensionBars({ result }: { result: AssessmentResult }) {
  const data = result.dimensions.map((d, i) => ({
    name: d.key,
    fullName: d.name,
    score: Math.round(d.score),
    color: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF4FB" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: "#9CA3AF", fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "#1F2A37", fontSize: 14, fontWeight: 600 }}
          width={30}
        />
        <Tooltip
          formatter={(value: number) => [`${value} 分`, "得分"]}
          labelFormatter={(label: string) => {
            const item = data.find((d) => d.name === label);
            return item?.fullName || label;
          }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #DCE8F7",
            fontSize: 13,
          }}
        />
        <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={26}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
