"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { RISK_META } from "@/lib/chli-model";

interface Props {
  score: number;
  level: keyof typeof RISK_META;
  label: string;
}

export function ScoreDonut({ score, level, label }: Props) {
  const color = RISK_META[level].color;
  const display = Math.round(score);

  return (
    <div className="relative mx-auto h-52 w-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[
              { name: "score", value: display },
              { name: "rest", value: 100 - display },
            ]}
            cx="50%"
            cy="50%"
            innerRadius={68}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="rgba(255,255,255,0.18)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-medium tracking-wide text-white/90">
          综合长寿指数
        </span>
        <span className="mt-1 text-5xl font-bold leading-none text-white drop-shadow-sm">
          {display}
          <span className="ml-1 text-lg font-medium text-white/80">/100</span>
        </span>
        <span
          className="mt-2 rounded-full px-3.5 py-1 text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
