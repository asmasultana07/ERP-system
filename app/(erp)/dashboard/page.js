"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, getDashboardAnalytics } from "../../../lib/api";
import { useResource } from "../../../lib/useResource";
import { getStoredUser } from "../../../lib/auth";
import { AlertTriangleIcon } from "../../../components/Icons";
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

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

  // Top 4 High-Impact KPI Cards (matching capture.png):
  const primaryKpis = [
    {
      label: "Total Revenue",
      value: stats ? fmt(stats.totalSales) : "—",
      hint: "Completed sales orders",
      trend: "12%",
      trendDirection: "up",
      valueClass: "text-slate-900 dark:text-white",
      iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: "Net Profit",
      value: stats ? fmt(stats.netProfit) : "—",
      hint: "After COGS & operating costs",
      trend: "18%",
      trendDirection: "up",
      valueClass: stats?.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 7-8.5 8.5-5-5L1 18" />
          <path d="M16 7h6v6" />
        </svg>
      ),
    },
    {
      label: "Current Catalog",
      value: stats ? Number(stats.totalProducts ?? 0).toLocaleString() : "—",
      hint: `${stats?.lowStockCount ?? 0} low stock items`,
      trend: "5%",
      trendDirection: "up",
      valueClass: "text-slate-900 dark:text-white",
      href: "/products",
      iconBg: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
    },
    {
      label: "Total Expenses",
      value: stats ? fmt(stats.totalExpenses) : "—",
      hint: "Operating & overhead costs",
      trend: "8%",
      trendDirection: "up",
      valueClass: "text-slate-900 dark:text-white",
      href: "/expenses",
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
    },
  ];

  // Secondary Performance KPIs:
  const secondaryKpis = [
    { label: "Gross Profit", value: stats ? fmt(stats.grossProfit) : "—", hint: "Revenue − Product COGS" },
    {
      label: "Outstanding Dues",
      value: stats ? fmt(stats.totalCustomerDues) : "—",
      hint: "Receivable customer balance",
      badge: stats?.totalCustomerDues > 0 ? "Pending" : null,
      badgeTone: "warning",
      valueClass: "text-amber-600 dark:text-amber-400",
    },
    { label: "Active Customers", value: stats ? String(stats.totalCustomers ?? 0) : "—", hint: "Registered client accounts", href: "/customers" },
    {
      label: "Stock Alerts",
      value: stats ? String(stats.lowStockCount ?? 0) : "—",
      hint: "At or below safety threshold",
      href: "/inventory-alerts",
      badge: stats?.lowStockCount > 0 ? "Needs Restock" : "Optimal",
      badgeTone: stats?.lowStockCount > 0 ? "danger" : "success",
      valueClass: stats?.lowStockCount > 0 ? "text-rose-600" : "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-7">
      {/* Welcome & Dashboard Heading (matching capture.png) */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Welcome back, {user?.name || "Admin"}!
          </p>
        </div>

        {/* Live sync pill badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
        </div>
      </div>

      {error ? (
        <Card className="flex flex-col items-center justify-center border-rose-200 bg-rose-50/60 p-8 text-center dark:bg-rose-500/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-rose-900 dark:text-rose-300">Failed to Load Dashboard</h3>
          <p className="mt-1 max-w-md text-xs text-rose-600 dark:text-rose-400">{error.message}</p>
          <button
            type="button"
            onClick={statsRes.refresh}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
          >
            Retry Connection
          </button>
        </Card>
      ) : (
        <>
          {/* Primary Top 4 KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {primaryKpis.map((kpi) => (
              <StatCard key={kpi.label} loading={loading} {...kpi} />
            ))}
          </section>

          {/* Analytics Period Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Analytics Timeframe
              </span>
              <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-2xs">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setPreset(r.key)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      preset === r.key
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            {analyticsRes.refreshing ? (
              <span className="text-xs text-slate-400 font-medium animate-pulse">
                Updating analytics metrics…
              </span>
            ) : null}
          </div>

          {/* Primary Visualization Section (Row 1: Revenue Area & Category Donut) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Revenue Overview"
                subtitle="Completed sales orders trend over the selected period"
                action={
                  <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20">
                    Gross Revenue
                  </span>
                }
              />
              <div className="p-5">
                {analyticsRes.loading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <AreaChart
                    data={revenueTrend.map((d) => ({ label: d.label, value: d.revenue }))}
                    valueFormat={fmtCompact}
                    color="#2563eb"
                  />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Category Distribution"
                subtitle="Sales share by product category"
              />
              <div className="p-5">
                {analyticsRes.loading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <DonutChart
                    data={categoryDistribution}
                    valueFormat={fmtCompact}
                    centerLabel="Total Sales"
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Secondary Visualization Section (Row 2: Sales Volume Bar & Customer Growth Line) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader
                title="Order Volume"
                subtitle="Total order throughput per period"
              />
              <div className="p-5">
                {analyticsRes.loading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <BarChart
                    data={revenueTrend.map((d) => ({ label: d.label, value: d.orders }))}
                    valueFormat={(v) => `${v} orders`}
                    color="#3b82f6"
                  />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Customer Acquisition"
                subtitle="Cumulative client portfolio expansion"
              />
              <div className="p-5">
                {analyticsRes.loading ? (
                  <Skeleton className="h-64 w-full rounded-xl" />
                ) : (
                  <AreaChart
                    data={customerGrowth.map((d) => ({ label: d.label, value: d.cumulative }))}
                    valueFormat={(v) => `${v} clients`}
                    color="#8b5cf6"
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Secondary KPIs Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {secondaryKpis.map((kpi) => (
              <StatCard key={kpi.label} loading={loading} {...kpi} />
            ))}
          </section>

          {/* Urgent Low-Stock Restock Banner */}
          {!loading && stats?.lowStockCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50/60 p-4 sm:p-5 dark:from-amber-950/20 dark:to-orange-950/10 dark:border-amber-800/40 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                  <AlertTriangleIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {stats.lowStockCount} product{stats.lowStockCount !== 1 ? "s" : ""} require replenishment
                  </p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
                    Inventory counts are below target minimums. Prepare purchase orders to avoid stockouts.
                  </p>
                </div>
              </div>
              <Link
                href="/inventory-alerts"
                className="inline-flex items-center justify-center self-start sm:self-auto rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition"
              >
                Inspect Alerts →
              </Link>
            </div>
          )}

          {/* Bottom Feed: Recent Sales, Recent Expenses, Low Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Recent Sales Feed */}
            <Card className="overflow-hidden">
              <CardHeader
                title="Recent Invoices"
                action={
                  <Link href="/sales" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    View all →
                  </Link>
                }
              />
              {loading ? (
                <div className="space-y-3 p-5">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-11 rounded-xl" />
                  ))}
                </div>
              ) : recentSales.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No recorded sales yet.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentSales.map((s) => (
                    <li key={String(s.id)} className="flex items-center justify-between px-5 py-3.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <div className="min-w-0 pr-2">
                        <p className="font-mono font-bold text-slate-900 dark:text-white truncate">{s.invoiceNumber}</p>
                        <p className="truncate text-slate-500 dark:text-slate-400 mt-0.5">{s.customerName} · {fmtDate(s.saleDate)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900 dark:text-white">{fmt(s.totalAmount)}</p>
                        <span
                          className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            s.paymentStatus === "Paid"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : s.paymentStatus === "Partial"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                          }`}
                        >
                          {s.paymentStatus}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Recent Expenses Feed */}
            <Card className="overflow-hidden">
              <CardHeader
                title="Recent Outflows"
                action={
                  <Link href="/expenses" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    View all →
                  </Link>
                }
              />
              {loading ? (
                <div className="space-y-3 p-5">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-11 rounded-xl" />
                  ))}
                </div>
              ) : recentExpenses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No recent expenditures recorded.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentExpenses.map((e) => (
                    <li key={String(e.id)} className="flex items-center justify-between px-5 py-3.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{e.title}</p>
                        <p className="truncate text-slate-500 dark:text-slate-400 mt-0.5">{e.category} · {fmtDate(e.expenseDate)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900 dark:text-white">{fmt(e.amount)}</p>
                        <span
                          className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            e.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          }`}
                        >
                          {e.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Stock Alerts Feed */}
            <Card className="overflow-hidden">
              <CardHeader
                title="Critical Inventory"
                action={
                  <Link href="/inventory-alerts" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    View all →
                  </Link>
                }
              />
              {loading ? (
                <div className="space-y-3 p-5">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-11 rounded-xl" />
                  ))}
                </div>
              ) : lowStockAlerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">All inventory items are well-stocked.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lowStockAlerts.map((p) => (
                    <li key={String(p.id)} className="flex items-center justify-between px-5 py-3.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">{p.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                            p.stockQuantity === 0
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20"
                          }`}
                        >
                          {p.stockQuantity === 0 ? "Out of Stock" : `${p.stockQuantity} left`}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Min: {p.lowStockThreshold}</p>
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
