import React from "react";

/* ================= CONTAINER ================= */

export function Container({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto px-4 pt-5 pb-10">
      {children}
    </div>
  );
}

/* ================= TOPBAR ================= */

export function Topbar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-xs text-muted">PL Coach IDEAL</div>
        <div className="text-xl font-semibold tracking-tight">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-muted mt-1">{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}

/* ================= CARD ================= */

export function Card({
  title,
  desc,
  right,
  children,
  glow,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border border-stroke bg-card ${
        glow ? "shadow-glow" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {desc && (
            <div className="text-xs text-muted mt-1">{desc}</div>
          )}
        </div>
        {right}
      </div>

      <div className="mt-3">{children}</div>
    </div>
  );
}

/* ================= PILL ================= */

export function Pill({
  tone,
  children,
}: {
  tone: "red" | "mut" | "ok" | "warn";
  children: React.ReactNode;
}) {
  const cls =
    tone === "red"
      ? "bg-red/15 text-red border-red/20"
      : tone === "ok"
      ? "bg-ok/15 text-ok border-ok/20"
      : tone === "warn"
      ? "bg-warn/15 text-warn border-warn/20"
      : "bg-white/5 text-muted border-stroke";

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs border ${cls}`}
    >
      {children}
    </span>
  );
}

/* ================= INPUT ================= */

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-xl bg-transparent border border-stroke text-sm outline-none ${
        props.className || ""
      }`}
    />
  );
}

/* ================= BTN (ВАЖНО) ================= */

export function Btn(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "red" | "mut" | "ghost";
  }
) {
  const tone = props.tone ?? "red";

  const cls =
    tone === "red"
      ? "bg-red text-bg0 hover:bg-red2"
      : tone === "mut"
      ? "bg-white/10 text-text hover:bg-white/15"
      : "bg-transparent border border-stroke text-text hover:bg-white/5";

  return (
    <button
      {...props}
      className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${cls} ${
        props.className || ""
      }`}
    >
      {props.children}
    </button>
  );
}export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 rounded-xl bg-transparent border border-stroke text-sm outline-none ${
        props.className || ""
      }`}
    >
      {props.children}
    </select>
  );
}export function TopTabs(props: {
  value: string
  onChange: (v: string) => void
  items: { value: string; label: string }[]
}) {
  const { value, onChange, items } = props

  return (
    <div className="flex gap-2 flex-wrap">
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={`px-3 py-2 rounded-xl text-xs border transition-all ${
              active
                ? "bg-red/20 border-red text-red"
                : "border-stroke text-mut hover:bg-white/5"
            }`}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}export function LineChart(props: any) {
  const raw =
    props?.data ??
    props?.points ??
    props?.values ??
    props?.series ??
    props?.items ??
    []

  const ys: number[] = Array.isArray(raw)
    ? raw
        .map((v: any) => {
          if (typeof v === "number") return v
          if (v && typeof v.y === "number") return v.y
          if (v && typeof v.value === "number") return v.value
          return NaN
        })
        .filter((n) => Number.isFinite(n))
    : []

  const w = 100
  const h = 40
  const pad = 3

  if (!ys.length) {
    return (
      <div className={`rounded-xl border border-stroke bg-white/5 ${props?.className ?? ""}`}>
        <div className="px-3 py-2 text-xs text-mut">Нет данных для графика</div>
      </div>
    )
  }

  const min = Math.min(...ys)
  const max = Math.max(...ys)
  const span = max - min || 1

  const pts = ys
    .map((y, i) => {
      const x = pad + (i * (w - pad * 2)) / Math.max(1, ys.length - 1)
      const yy = pad + (1 - (y - min) / span) * (h - pad * 2)
      return '${x.toFixed(2)},${yy.toFixed(2)}'
    })
    .join(" ")

  return (
    <div className={props?.className ?? ""}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
        <polyline
          points={pts}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    </div>
  )
}