"use client";

import Link from "next/link";

// Reusable design-system primitives shared across modules for visual consistency.

export function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

const BADGE_TONES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  warning: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  danger: "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  brand: "bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  neutral: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-none shadow-2xs ${BADGE_TONES[tone] || BADGE_TONES.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

// Modern SaaS stat tile (matching capture.png):
// Colorful rounded icon container, clear label, large bold stat value, and trend/hint pills.
export function StatCard({
  label,
  value,
  hint,
  badge,
  badgeTone = "neutral",
  href,
  valueClass = "text-slate-900 dark:text-white",
  loading,
  icon,
  iconBg = "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  trend,
  trendDirection = "up",
}) {
  const body = (
    <div className="flex flex-col h-full justify-between">
      {/* Top row: Icon container + Optional Badge/Trend */}
      <div className="flex items-start justify-between gap-3">
        {icon ? (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg} shadow-inner transition-transform duration-200 group-hover:scale-105`}>
            {icon}
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 ml-auto">
          {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
          {trend ? (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                trendDirection === "up"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20"
                  : trendDirection === "down"
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <span>{trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : "•"}</span>
              <span>{trend}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Middle: Label and Big Value */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="mt-1.5">
          {loading ? (
            <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${valueClass}`}>
              {value}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Hint / Context */}
      {hint ? (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate">{hint}</span>
          {href ? (
            <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
              View →
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const cls =
    "group block rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700";

  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
