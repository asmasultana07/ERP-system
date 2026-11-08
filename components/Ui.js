"use client";

import Link from "next/link";

// Reusable design-system primitives shared across modules for visual consistency.

export function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-2xl border border-vendora/10 bg-surface shadow-xs ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-vendora/10 px-5 py-3.5">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-vendora-dark">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-vendora-text/60">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

const BADGE_TONES = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  danger: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
  brand: "bg-vendora/5 text-vendora border-vendora/15",
  neutral: "bg-vendora-bg text-vendora-text/70 border-vendora/10",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${BADGE_TONES[tone] || BADGE_TONES.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

// Premium stat tile (Stripe/Linear style): tiny label, large value, hint + badge.
export function StatCard({ label, value, hint, badge, badgeTone = "neutral", href, valueClass = "text-vendora-dark", loading }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-vendora-text/60">
          {label}
        </h3>
        {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-28 animate-pulse rounded-lg bg-vendora/10 dark:bg-white/10" />
        ) : (
          <p className={`text-2xl font-bold tracking-tight ${valueClass}`}>{value}</p>
        )}
      </div>
      {hint ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-vendora-text/60">
          {hint}
          {href ? <span className="ml-auto font-medium text-vendora">View →</span> : null}
        </p>
      ) : null}
    </>
  );

  const cls =
    "block rounded-2xl border border-vendora/10 bg-surface p-5 shadow-xs transition hover:border-vendora/25 hover:shadow-sm";

  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
