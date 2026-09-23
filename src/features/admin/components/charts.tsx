"use client";

import { useLocale } from "next-intl";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { intlLocale, type Locale } from "@/config/site";

// Single-series charts: one brand hue (coral-600, ≥3:1 on white), no legend — the card title names the series.
const SERIES = "#D9442A";
const GRID = "#ECE3DC";
const AXIS = "#6F6368";

function useFmt() {
  const locale = useLocale() as Locale;
  const num = new Intl.NumberFormat(intlLocale[locale]);
  const day = new Intl.DateTimeFormat(intlLocale[locale], { day: "numeric", month: "short" });
  return { num, day };
}

function TooltipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm shadow-pop-sm">
      <p className="text-xs text-muted">{title}</p>
      <p className="font-bold text-ink">{value}</p>
    </div>
  );
}

export function TimeSeriesChart({ data, dataKey, kind, unit }: { data: { date: string; revenue: number; orders: number }[]; dataKey: "revenue" | "orders"; kind: "area" | "bar"; unit?: string }) {
  const { num, day } = useFmt();
  const fmtDate = (d: string) => day.format(new Date(d));
  const common = (
    <>
      <CartesianGrid vertical={false} stroke={GRID} />
      <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
      <YAxis tickFormatter={(v) => num.format(v)} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={56} allowDecimals={false} />
      <Tooltip
        cursor={kind === "area" ? { stroke: AXIS, strokeDasharray: "3 3" } : { fill: "rgba(42,31,36,0.05)" }}
        content={({ active, payload, label }) =>
          active && payload?.length ? <TooltipBox title={fmtDate(String(label))} value={`${num.format(Number(payload[0].value))}${unit ? ` ${unit}` : ""}`} /> : null
        }
      />
    </>
  );
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        {kind === "area" ? (
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES} stopOpacity={0.22} />
                <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
              </linearGradient>
            </defs>
            {common}
            <Area type="monotone" dataKey={dataKey} stroke={SERIES} strokeWidth={2} fill="url(#area-fill)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
            {common}
            <Bar dataKey={dataKey} fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** Ranked horizontal bars (magnitude by category/country) with value labels. */
export function RankedBars({ data, unit }: { data: { name: string; value: number }[]; unit: string }) {
  const { num } = useFmt();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.name} className="group" title={`${d.name}: ${num.format(d.value)} ${unit}`}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-semibold text-ink">{d.name}</span>
            <span className="text-muted tabular-nums">
              {num.format(d.value)} {unit}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-ink/[0.06]">
            <div className="h-full rounded-full transition-opacity group-hover:opacity-80" style={{ width: `${(d.value / max) * 100}%`, background: SERIES }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
