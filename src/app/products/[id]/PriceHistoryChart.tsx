"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { PriceHistory } from "@/lib/types";
import { formatUnitCost } from "@/lib/calc";

interface ChartPoint {
  date: string;
  unitCost: number;
}

export default function PriceHistoryChart({
  history,
  currentUnitCost,
  currentDate,
}: {
  history: PriceHistory[];
  currentUnitCost: number | null;
  currentDate: string;
}) {
  const points: ChartPoint[] = history
    .filter((h) => h.unit_cost_per_100g !== null)
    .map((h) => ({ date: h.changed_date, unitCost: h.unit_cost_per_100g as number }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (currentUnitCost !== null) {
    const last = points[points.length - 1];
    if (!last || last.date !== currentDate || last.unitCost !== currentUnitCost) {
      points.push({ date: currentDate, unitCost: currentUnitCost });
    }
  }

  if (points.length < 2) {
    return (
      <div className="text-sm text-neutral-500 py-8 text-center">
        추이를 표시할 만큼 변동 이력이 아직 없습니다.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={60} />
          <Tooltip
            formatter={(value) => [`${formatUnitCost(Number(value))} 원`, "100g당 원가"]}
          />
          <Line type="monotone" dataKey="unitCost" stroke="#171717" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
