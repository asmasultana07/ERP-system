"use client";

import { useState } from "react";
import Link from "next/link";
import { getDashboardStats, getDashboardAnalytics } from "../../../lib/api";
import { useResource } from "../../../lib/useResource";
import { RefreshIcon, AlertTriangleIcon } from "../../../components/Icons";
import { StatCard, Card, CardHeader } from "../../../components/Ui";
import { Skeleton } from "../../../components/Skeleton";
import { AreaChart, BarChart, DonutChart } from "../../../components/charts/Charts";

function fmt(n) {
  return `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtCompact(n) {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v}`;
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

export default function DashboardPage() {
  const [preset, setPreset] = useState("month");

  const statsRes = useResource("dashboard:stats", () => getDashboardStats());
  const analyticsRes = useResource(`dashboard:analytics:${preset}`, () =>
    getDashboardAnalytics({ preset })
  );

  const data = statsRes.data;
  const stats = data?.stats;
  const recentSales = data?.recentSales || [];
  const recentExpenses = data?.recentExpenses || [];
  const lowStockAlerts = data?.lowStockAlerts || [];
  const loading = statsRes.loading;
  const error = statsRes.error;

  const analytics = analyticsRes.data;
  const revenueTrend = analytics?.revenueTrend || [];
  const categoryDistribution = (analytics?.categoryDistribution || []).map((c) => ({
    label: c.category,
    value: c.revenue,
  }));
  const customerGrowth = analytics?.customerGrowth || [];

  const kpis = [
    { label: "Total Revenue", value: stats ? fmt(stats.totalSales) : "—", hint: "Completed sales", valueClass: "text-emerald-600 dark:text-emerald-400" },
    { label: "Net Profit", value: stats ? fmt(stats.netProfit) : "—", hint: "After COGS & expenses", valueClass: stats?.netProfit >= 0 ? "text-vendora-dark" : "text-red-600" },
    { label: "Outstanding Dues", value: stats ? fmt(stats.totalCustomerDues) : "—", hint: "Receivables", badge: stats?.totalCustomerDues > 0 ? "Attention" : null, badgeTone: "warning", valueClass: "text-amber-600 dark:text-amber-400" },
    { label: "Low Stock", value: stats ? String(stats.lowStockCount ?? 0) : "—", hint: "At/below threshold", href: "/inventory-alerts", badge: stats?.lowStockCount > 0 ? "Review" : "Optimal", badgeTone: stats?.lowStockCount > 0 ? "warning" : "success" },
  ];

  const secondary = [
    { label: "Gross Profit", value: stats ? fmt(stats.grossProfit) : "—", hint: "Revenue − COGS" },
    { label: "Total Expenses", value: stats ? fmt(stats.totalExpenses) : "—", hint: "Operating costs" },
    { label: "Active Customers", value: stats ? String(stats.totalCustomers ?? 0) : "—", hint: "Registered clients" },
    { label: "Products", value: stats ? String(stats.totalProducts ?? 0) : "—", hint: "Catalog items" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vendora-text">Dashboard</h2>
          <p className="mt-1 text-sm text-vendora-text/60">Real-time metrics from your database. Cancelled orders are excluded.</p>
        </div>
        <button
          type="button"
          onClick={() => { statsRes.refresh(); analyticsRes.refresh(); }}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-vendora/20 bg-surface px-3.5 py-2.5 text-sm font-medium text-vendora-text hover:bg-vendora-bg"
        >
          <RefreshIcon className={`h-4 w-4 ${statsRes.refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error ? (
        <Card className="flex flex-col items-center justify-center border-red-200 bg-red-50 p-8 text-center dark:bg-red-500/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-red-800 dark:text-red-300">Failed to Load Dashboard</h3>
          <p className="mt-1 max-w-md text-sm text-red-600">{error.message}</p>
          <button type="button" onClick={statsRes.refresh} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            <RefreshIcon className="h-4 w-4" />Retry
          </button>
        </Card>
      ) : (
        <>
          {/* Primary KPIs */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((c) => <StatCard key={c.label} loading={loading} {...c} />)}
          </section>

          {/* Date filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-vendora-text/50">Analytics period</span>
            <div className="inline-flex rounded-xl border border-vendora/15 bg-surface p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setPreset(r.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    preset === r.key ? "bg-vendora text-white" : "text-vendora-text/70 hover:bg-vendora-bg"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {analyticsRes.refreshing ? <span className="text-xs text-vendora-text/40">updating…</span> : null}
          </div>

          {/* Charts row 1 */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Revenue Overview" subtitle="Completed sales revenue over the selected period" />
              <div className="p-4">
                {analyticsRes.loading ? <Skeleton className="h-60 w-full" /> : (
                  <AreaChart data={revenueTrend.map((d) => ({ label: d.label, value: d.revenue }))} valueFormat={fmtCompact} />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Category Distribution" subtitle="Revenue share by product category" />
              <div className="p-4">
                {analyticsRes.loading ? <Skeleton className="h-60 w-full" /> : (
                  <DonutChart data={categoryDistribution} valueFormat={fmtCompact} centerLabel="Revenue" />
                )}
              </div>
            </Card>
          </div>

          {/* Charts row 2 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Sales Performance" subtitle="Number of orders per period" />
              <div className="p-4">
                {analyticsRes.loading ? <Skeleton className="h-60 w-full" /> : (
                  <BarChart data={revenueTrend.map((d) => ({ label: d.label, value: d.orders }))} valueFormat={(v) => String(v)} />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Customer Growth" subtitle="Cumulative customers, last 12 months" />
              <div className="p-4">
                {analyticsRes.loading ? <Skeleton className="h-60 w-full" /> : (
                  <AreaChart data={customerGrowth.map((d) => ({ label: d.label, value: d.cumulative }))} valueFormat={(v) => String(v)} color="var(--series-1)" />
                )}
              </div>
            </Card>
          </div>

          {/* Secondary KPIs */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {secondary.map((c) => <StatCard key={c.label} loading={loading} {...c} />)}
          </section>

          {/* Low-stock banner */}
          {!loading && stats?.lowStockCount > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:bg-amber-500/5">
              <div className="flex items-center gap-3">
                <AlertTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{stats.lowStockCount} product{stats.lowStockCount !== 1 ? "s" : ""} need restocking</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80">Review inventory alerts to plan purchase orders.</p>
                </div>
              </div>
              <Link href="/inventory-alerts" className="shrink-0 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700">View Alerts</Link>
            </div>
          )}

          {/* Lists */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="overflow-hidden">
              <CardHeader title="Recent Sales" action={<Link href="/sales" className="text-xs font-medium text-vendora hover:underline">View all</Link>} />
              {loading ? (
                <div className="space-y-3 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : recentSales.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-vendora-text/50">No recent sales.</p>
              ) : (
                <ul className="divide-y divide-vendora/5">
                  {recentSales.map((s) => (
                    <li key={String(s.id)} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-vendora-bg/30">
                      <div>
                        <p className="font-mono text-xs font-semibold text-vendora-dark">{s.invoiceNumber}</p>
                        <p className="text-xs text-vendora-text/60">{s.customerName} · {fmtDate(s.saleDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-vendora-dark">{fmt(s.totalAmount)}</p>
                        <span className={`text-[10px] font-semibold ${s.paymentStatus === "Paid" ? "text-emerald-600" : s.paymentStatus === "Partial" ? "text-amber-600" : "text-red-600"}`}>{s.paymentStatus}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="overflow-hidden">
              <CardHeader title="Recent Expenses" action={<Link href="/expenses" className="text-xs font-medium text-vendora hover:underline">View all</Link>} />
              {loading ? (
                <div className="space-y-3 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : recentExpenses.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-vendora-text/50">No recent expenses.</p>
              ) : (
                <ul className="divide-y divide-vendora/5">
                  {recentExpenses.map((e) => (
                    <li key={String(e.id)} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-vendora-bg/30">
                      <div>
                        <p className="max-w-[140px] truncate font-semibold text-vendora-text">{e.title}</p>
                        <p className="text-xs text-vendora-text/60">{e.category} · {fmtDate(e.expenseDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-vendora-dark">{fmt(e.amount)}</p>
                        <span className={`text-[10px] font-semibold ${e.status === "Paid" ? "text-emerald-600" : "text-amber-600"}`}>{e.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="overflow-hidden">
              <CardHeader title="Low Stock Alerts" action={<Link href="/inventory-alerts" className="text-xs font-medium text-vendora hover:underline">View all</Link>} />
              {loading ? (
                <div className="space-y-3 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : lowStockAlerts.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-vendora-text/50">All products well-stocked.</p>
              ) : (
                <ul className="divide-y divide-vendora/5">
                  {lowStockAlerts.map((p) => (
                    <li key={String(p.id)} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-vendora-bg/30">
                      <div>
                        <p className="font-semibold text-vendora-text">{p.name}</p>
                        <p className="font-mono text-xs text-vendora-text/60">{p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${p.stockQuantity === 0 ? "text-red-600" : "text-amber-600"}`}>{p.stockQuantity === 0 ? "Out" : `${p.stockQuantity} left`}</p>
                        <p className="text-[10px] text-vendora-text/50">threshold: {p.lowStockThreshold}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
