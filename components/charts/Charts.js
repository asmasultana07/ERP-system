"use client";

// Dependency-free, responsive, theme-aware SVG charts.
// Follows the dataviz mark specs: thin 2px lines, 4px rounded bar ends, a 2px
// surface gap between donut segments, recessive grid/axes, a legend for >=2
// series, and a hover tooltip layer. All data is supplied by callers from real
// API responses — nothing here is hardcoded.

import { useCallback, useEffect, useRef, useState } from "react";

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

const MUTED = "var(--color-vendora-text)";

function Tooltip({ x, y, children }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-vendora/15 bg-surface px-3 py-2 text-xs shadow-lg"
      style={{ left: x, top: y - 8 }}
    >
      {children}
    </div>
  );
}

function EmptyChart({ height, message = "No data for this period." }) {
  return (
    <div
      className="flex items-center justify-center text-sm text-vendora-text/50"
      style={{ height }}
    >
      {message}
    </div>
  );
}

/* ----------------------------- Area / Line ----------------------------- */

export function AreaChart({
  data = [],
  height = 240,
  color = "var(--color-vendora-accent)",
  valueFormat = (v) => v,
  maxTicks = 6,
}) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = useState(null);

  if (!data.length) return <div ref={ref}><EmptyChart height={height} /></div>;

  const padL = 48;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const w = Math.max(width, 240);
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = max * 1.1;
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

  return (
    <div ref={ref} className="relative w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridVals.map((v, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={yAt(v)}
              x2={w - padR}
              y2={yAt(v)}
              stroke={MUTED}
              strokeOpacity="0.1"
            />
            <text x={padL - 8} y={yAt(v) + 3} textAnchor="end" fontSize="10" fill={MUTED} fillOpacity="0.55">
              {valueFormat(Math.round(v))}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#areaFill)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) =>
          i % labelStep === 0 || i === data.length - 1 ? (
            <text key={i} x={xAt(i)} y={height - 8} textAnchor="middle" fontSize="10" fill={MUTED} fillOpacity="0.55">
              {d.label}
            </text>
          ) : null
        )}

        {hover != null && (
          <g>
            <line x1={xAt(hover)} y1={padT} x2={xAt(hover)} y2={padT + innerH} stroke={MUTED} strokeOpacity="0.25" />
            <circle cx={xAt(hover)} cy={yAt(data[hover].value)} r="4" fill={color} stroke="var(--color-surface)" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover != null && (
        <Tooltip x={(xAt(hover) / w) * 100 + "%"} y={yAt(data[hover].value)}>
          <p className="font-semibold text-vendora-text">{valueFormat(data[hover].value)}</p>
          <p className="text-vendora-text/60">{data[hover].label}</p>
        </Tooltip>
      )}
    </div>
  );
}

/* --------------------------------- Bar --------------------------------- */

export function BarChart({
  data = [],
  height = 240,
  color = "var(--color-vendora-accent)",
  valueFormat = (v) => v,
}) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = useState(null);

  if (!data.length) return <div ref={ref}><EmptyChart height={height} /></div>;

  const padL = 48;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const w = Math.max(width, 240);
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = max * 1.1;
  const gap = Math.min(16, innerW / data.length / 3);
  const bw = innerW / data.length - gap;
  const yAt = (v) => padT + innerH - (v / niceMax) * innerH;

  const yTicks = 4;
  const gridVals = Array.from({ length: yTicks + 1 }, (_, i) => (niceMax / yTicks) * i);
  const labelStep = Math.ceil(data.length / Math.min(8, data.length));

  return (
    <div ref={ref} className="relative w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} role="img">
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={yAt(v)} x2={w - padR} y2={yAt(v)} stroke={MUTED} strokeOpacity="0.1" />
            <text x={padL - 8} y={yAt(v) + 3} textAnchor="end" fontSize="10" fill={MUTED} fillOpacity="0.55">
              {valueFormat(Math.round(v))}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = padL + i * (bw + gap) + gap / 2;
          const y = yAt(d.value);
          const h = Math.max(padT + innerH - y, 0);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x} y={padT} width={bw} height={innerH} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={bw}
                height={h}
                rx="4"
                fill={color}
                fillOpacity={hover == null || hover === i ? 1 : 0.4}
              />
              {(i % labelStep === 0 || i === data.length - 1) && (
                <text x={x + bw / 2} y={height - 8} textAnchor="middle" fontSize="10" fill={MUTED} fillOpacity="0.55">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover != null && (
        <Tooltip x={((padL + hover * (bw + gap) + gap / 2 + bw / 2) / w) * 100 + "%"} y={yAt(data[hover].value)}>
          <p className="font-semibold text-vendora-text">{valueFormat(data[hover].value)}</p>
          <p className="text-vendora-text/60">{data[hover].label}</p>
        </Tooltip>
      )}
    </div>
  );
}

/* -------------------------------- Donut -------------------------------- */

const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
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

  // Fold anything past 7 slots into "Other" so hues are never cycled.
  let items = [...data].sort((a, b) => b.value - a.value);
  if (items.length > 8) {
    const head = items.slice(0, 7);
    const rest = items.slice(7).reduce((s, d) => s + d.value, 0);
    items = [...head, { label: "Other", value: rest }];
  }

  const total = items.reduce((s, d) => s + d.value, 0) || 1;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const rO = 92;
  const rI = 58;
  const gapAngle = 0.03;

  let angle = -Math.PI / 2;
  const segments = items.map((d, i) => {
    const frac = d.value / total;
    const start = angle + gapAngle / 2;
    const end = angle + frac * 2 * Math.PI - gapAngle / 2;
    angle += frac * 2 * Math.PI;
    return { ...d, i, start: Math.max(start, angle - frac * 2 * Math.PI), end, color: SERIES[i % SERIES.length], frac };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" className="shrink-0">
        {segments.map((s) => (
          <path
            key={s.i}
            d={arcPath(cx, cy, rO, rI, s.start, s.end)}
            fill={s.color}
            stroke="var(--color-surface)"
            strokeWidth="2"
            opacity={hover == null || hover === s.i ? 1 : 0.4}
            onMouseEnter={() => setHover(s.i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--color-vendora-text)">
          {hover != null ? `${Math.round(segments[hover].frac * 100)}%` : valueFormat(total)}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill={MUTED} fillOpacity="0.6">
          {hover != null ? segments[hover].label : centerLabel}
        </text>
      </svg>

      <ul className="w-full max-w-xs space-y-1.5">
        {segments.map((s) => (
          <li
            key={s.i}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition hover:bg-vendora-bg/50"
            onMouseEnter={() => setHover(s.i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="truncate text-vendora-text">{s.label}</span>
            </span>
            <span className="shrink-0 font-medium text-vendora-text/80">
              {valueFormat(s.value)}{" "}
              <span className="text-vendora-text/50">({Math.round(s.frac * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
