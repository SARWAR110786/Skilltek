"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// 61500 -> "61.5k", 1200000 -> "1.2M" so axis labels never get clipped.
function compact(v: number) {
  const n = Number(v);
  if (Math.abs(n) >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${+(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function TrendChart({
  data,
  xKey,
  series,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; color: string; label?: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis width={48} tickFormatter={compact} tick={{ fontSize: 12, fill: "#64748b" }} />
        <Tooltip />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color}
            fill={`url(#grad-${s.key})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({
  data,
  xKey,
  series,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; color: string; label?: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis width={48} tickFormatter={compact} tick={{ fontSize: 12, fill: "#64748b" }} />
        <Tooltip />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label ?? s.key} fill={s.color} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
