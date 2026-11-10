"use client";

// Dependency-free, responsive, theme-aware SVG charts.
// Enhanced for modern SaaS visualization: subtle gridlines, dual-stop gradient fills,
// smooth curves, rounded bar ends, glowing hover states, and frosted tooltips.

import { useEffect, useRef, useState } from "react";

function useMeasure() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    const el = ref.current;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? el.clientWidth;
      setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

const MUTED = "currentColor";

function Tooltip({ x, y, children }) {
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md transition-all duration-75"
      style={{ left: x, top: y - 10 }}
    >
      {children}
    </div>
  );
}

function EmptyChart({ height, message = "No data recorded for this period." }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-xs font-medium text-slate-400 dark:text-slate-500"
      style={{ height }}
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8 stroke-current stroke-1 opacity-40 mb-1" fill="none">
        <path d="M3 3v18h18M7 16l4-4 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

/* ----------------------------- Area / Line ----------------------------- */

export function AreaChart({
  data = [],
  height = 250,
  color = "#2563eb",
  valueFormat = (v) => v,
  maxTicks = 6,
}) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = useState(null);

  if (!data.length) return <div ref={ref}><EmptyChart height={height} /></div>;

  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const w = Math.max(width, 240);
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = max * 1.15;
  const xAt = (i) =>
    padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yAt = (v) => padT + innerH - (v / niceMax) * innerH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(d.value)}`)
    .join(" ");
  const areaPath =
    `M${xAt(0)},${yAt(0)} ` +
    data.map((d, i) => `L${xAt(i)},${yAt(d.value)}`).join(" ") +
    ` L${xAt(data.length - 1)},${yAt(0)} Z`;

  const yTicks = 4;
  const gridVals = Array.from({ length: yTicks + 1 }, (_, i) => (niceMax / yTicks) * i);
  const labelStep = Math.ceil(data.length / Math.min(maxTicks, data.length));

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * w;
    let idx = Math.round(((px - padL) / innerW) * (data.length - 1));
    idx = Math.max(0, Math.min(data.length - 1, idx));
    setHover(idx);
  };

  const gradientId = `areaGrad-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div ref={ref} className="relative w-full text-slate-400 dark:text-slate-500">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="60%" stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor={color} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines and Y axis labels */}
        {gridVals.map((v, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={yAt(v)}
              x2={w - padR}
              y2={yAt(v)}
              stroke={MUTED}
              strokeOpacity="0.08"
              strokeDasharray={i === 0 ? "none" : "3 3"}
            />
            <text x={padL - 10} y={yAt(v) + 3} textAnchor="end" fontSize="10" fill={MUTED} fillOpacity="0.75" fontWeight="500">
              {valueFormat(Math.round(v))}
            </text>
          </g>
        ))}

        {/* Gradient fill area & line */}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* X axis labels */}
        {data.map((d, i) =>
          i % labelStep === 0 || i === data.length - 1 ? (
            <text key={i} x={xAt(i)} y={height - 8} textAnchor="middle" fontSize="10" fill={MUTED} fillOpacity="0.75" fontWeight="500">
              {d.label}
            </text>
          ) : null
        )}

        {/* Hover cursor and dot */}
        {hover != null && (
          <g>
            <line x1={xAt(hover)} y1={padT} x2={xAt(hover)} y2={padT + innerH} stroke={MUTED} strokeOpacity="0.3" strokeDasharray="2 2" />
            <circle cx={xAt(hover)} cy={yAt(data[hover].value)} r="6" fill={color} fillOpacity="0.3" />
            <circle cx={xAt(hover)} cy={yAt(data[hover].value)} r="3.5" fill={color} stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover != null && (
        <Tooltip x={(xAt(hover) / w) * 100 + "%"} y={yAt(data[hover].value)}>
          <p className="font-bold text-slate-900 dark:text-white text-sm">{valueFormat(data[hover].value)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{data[hover].label}</p>
        </Tooltip>
      )}
    </div>
  );
}

/* --------------------------------- Bar --------------------------------- */

export function BarChart({
  data = [],
  height = 250,
  color = "#2563eb",
  valueFormat = (v) => v,
}) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = useState(null);

  if (!data.length) return <div ref={ref}><EmptyChart height={height} /></div>;

  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const w = Math.max(width, 240);
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = max * 1.15;
  const gap = Math.min(14, innerW / data.length / 3);
  const bw = Math.max(4, innerW / data.length - gap);
  const yAt = (v) => padT + innerH - (v / niceMax) * innerH;

  const yTicks = 4;
  const gridVals = Array.from({ length: yTicks + 1 }, (_, i) => (niceMax / yTicks) * i);
  const labelStep = Math.ceil(data.length / Math.min(8, data.length));

  return (
    <div ref={ref} className="relative w-full text-slate-400 dark:text-slate-500">
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} role="img" className="overflow-visible">
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={yAt(v)} x2={w - padR} y2={yAt(v)} stroke={MUTED} strokeOpacity="0.08" strokeDasharray={i === 0 ? "none" : "3 3"} />
            <text x={padL - 10} y={yAt(v) + 3} textAnchor="end" fontSize="10" fill={MUTED} fillOpacity="0.75" fontWeight="500">
              {valueFormat(Math.round(v))}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = padL + i * (bw + gap) + gap / 2;
          const y = yAt(d.value);
          const h = Math.max(padT + innerH - y, 0);
          const isHovered = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
              <rect x={x - gap / 4} y={padT} width={bw + gap / 2} height={innerH} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={bw}
                height={h}
                rx="4"
                fill={color}
                fillOpacity={hover == null ? 0.9 : isHovered ? 1 : 0.35}
                className="transition-all duration-150"
              />
              {(i % labelStep === 0 || i === data.length - 1) && (
                <text x={x + bw / 2} y={height - 8} textAnchor="middle" fontSize="10" fill={MUTED} fillOpacity="0.75" fontWeight="500">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover != null && (
        <Tooltip x={((padL + hover * (bw + gap) + gap / 2 + bw / 2) / w) * 100 + "%"} y={yAt(data[hover].value)}>
          <p className="font-bold text-slate-900 dark:text-white text-sm">{valueFormat(data[hover].value)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{data[hover].label}</p>
        </Tooltip>
      )}
    </div>
  );
}

/* -------------------------------- Donut -------------------------------- */

const SERIES = [
  "#2563eb", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#f43f5e", // rose
];

function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x1, y1] = p(rOuter, startAngle);
  const [x2, y2] = p(rOuter, endAngle);
  const [x3, y3] = p(rInner, endAngle);
  const [x4, y4] = p(rInner, startAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${x1},${y1} A${rOuter},${rOuter} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 ${large} 0 ${x4},${y4} Z`;
}

export function DonutChart({ data = [], valueFormat = (v) => v, centerLabel = "Total" }) {
  const [hover, setHover] = useState(null);
  if (!data.length) return <EmptyChart height={220} />;

  let items = [...data].sort((a, b) => b.value - a.value);
  if (items.length > 8) {
    const head = items.slice(0, 7);
    const rest = items.slice(7).reduce((s, d) => s + d.value, 0);
    items = [...head, { label: "Other", value: rest }];
  }

  const total = items.reduce((s, d) => s + d.value, 0) || 1;
  const size = 190;
  const cx = size / 2;
  const cy = size / 2;
  const rO = 86;
  const rI = 56;
  const gapAngle = 0.035;

  let angle = -Math.PI / 2;
  const segments = items.map((d, i) => {
    const frac = d.value / total;
    const start = angle + gapAngle / 2;
    const end = angle + frac * 2 * Math.PI - gapAngle / 2;
    angle += frac * 2 * Math.PI;
    return { ...d, i, start: Math.max(start, angle - frac * 2 * Math.PI), end, color: SERIES[i % SERIES.length], frac };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center py-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" className="shrink-0">
        {segments.map((s) => (
          <path
            key={s.i}
            d={arcPath(cx, cy, rO, rI, s.start, s.end)}
            fill={s.color}
            stroke="var(--color-surface)"
            strokeWidth="2"
            opacity={hover == null ? 1 : hover === s.i ? 1 : 0.35}
            onMouseEnter={() => setHover(s.i)}
            onMouseLeave={() => setHover(null)}
            className="cursor-pointer transition-opacity duration-150"
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill="currentColor" className="text-slate-900 dark:text-white">
          {hover != null ? `${Math.round(segments[hover].frac * 100)}%` : valueFormat(total)}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="currentColor" className="text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
          {hover != null ? segments[hover].label : centerLabel}
        </text>
      </svg>

      <ul className="w-full max-w-xs space-y-1.5">
        {segments.map((s) => (
          <li
            key={s.i}
            className={`flex items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-xs transition cursor-pointer ${
              hover === s.i ? "bg-slate-100 dark:bg-slate-800 font-semibold" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
            onMouseEnter={() => setHover(s.i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="truncate text-slate-700 dark:text-slate-200">{s.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
              {valueFormat(s.value)}{" "}
              <span className="text-slate-400 font-normal">({Math.round(s.frac * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
