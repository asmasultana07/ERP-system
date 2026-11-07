"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getDashboardStats } from "../../../lib/api";
import { RefreshIcon, AlertTriangleIcon } from "../../../components/Icons";

function fmt(n) { return `$${Number(n || 0).toFixed(2)}`; }
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDashboardStats();
      if (res?.success) {
        setStats(res.stats || {});
        setRecentSales(res.recentSales || []);
        setRecentExpenses(res.recentExpenses || []);
        setLowStockAlerts(res.lowStockAlerts || []);
      } else {
        setError(res?.message || "Failed to load dashboard metrics");
      }
    } catch (err) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const cards = [
    { label: "Total Revenue", value: stats ? fmt(stats.totalSales) : "—", detail: "Gross revenue from all completed sales.", highlight: "text-emerald-700" },
    { label: "Total Expenses", value: stats ? fmt(stats.totalExpenses) : "—", detail: "All recorded operating expenses.", highlight: "text-vendora-dark" },
    { label: "Gross Profit", value: stats ? fmt(stats.grossProfit) : "—", detail: "Revenue minus cost of goods sold.", highlight: stats?.grossProfit >= 0 ? "text-emerald-700" : "text-red-700" },
    { label: "Net Profit", value: stats ? fmt(stats.netProfit) : "—", detail: "Gross profit minus operating expenses.", highlight: stats?.netProfit >= 0 ? "text-emerald-700" : "text-red-700" },
    { label: "Outstanding Dues", value: stats ? fmt(stats.totalCustomerDues) : "—", detail: "Uncollected receivables from customers.", highlight: stats?.totalCustomerDues > 0 ? "text-amber-800" : "text-vendora-text", badge: stats?.totalCustomerDues > 0 ? "Attention" : null, badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Active Customers", value: stats ? String(stats.totalCustomers ?? 0) : "—", detail: "Registered clients and distribution partners.", highlight: "text-vendora-dark" },
    { label: "Total Products", value: stats ? String(stats.totalProducts ?? 0) : "—", detail: "Active catalog items.", highlight: "text-vendora-dark" },
    {
      label: "Low-Stock Alerts", value: stats ? String(stats.lowStockCount ?? 0) : "—",
      detail: "Items at or below reorder threshold.",
      highlight: stats?.lowStockCount > 0 ? "text-amber-700" : "text-vendora-text",
      badge: stats?.lowStockCount > 0 ? "Attention Required" : "Optimal",
      badgeClass: stats?.lowStockCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200",
      link: "/inventory-alerts",
    },
    {
      label: "Out of Stock", value: stats ? String(stats.outOfStockCount ?? 0) : "—",
      detail: "Products with zero inventory.",
      highlight: stats?.outOfStockCount > 0 ? "text-red-700" : "text-vendora-text",
      badge: stats?.outOfStockCount > 0 ? "Critical" : "Clear",
      badgeClass: stats?.outOfStockCount > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200",
      link: "/inventory-alerts",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vendora-text">Executive Business Dashboard</h2>
          <p className="mt-1 text-sm text-vendora-text/70">Real-time calculations from verified database records. Cancelled orders are excluded.</p>
        </div>
        <button type="button" onClick={loadStats} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-vendora/20 bg-white px-3.5 py-2.5 text-sm font-medium text-vendora-text hover:bg-vendora-bg disabled:opacity-50">
          <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error ? (
        <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-red-800">Failed to Load Dashboard Data</h3>
          <p className="mt-1 max-w-md text-sm text-red-600">{error}</p>
          <button type="button" onClick={loadStats} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            <RefreshIcon className="h-4 w-4" />Retry
          </button>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <article key={c.label} className="flex flex-col justify-between rounded-2xl border border-vendora/10 bg-white p-5 shadow-xs hover:border-vendora/20 hover:shadow-sm transition">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-vendora">{c.label}</h3>
                  {c.badge && <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${c.badgeClass}`}>{c.badge}</span>}
                </div>
                <div className="my-4">
                  {loading ? <div className="h-9 w-28 animate-pulse rounded-lg bg-vendora-bg" /> : (
                    <p className={`text-3xl font-bold tracking-tight ${c.highlight}`}>{c.value}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-vendora-text/70">{c.detail}</p>
                  {c.link && <Link href={c.link} className="text-xs font-medium text-vendora hover:underline">View →</Link>}
                </div>
              </article>
            ))}
          </section>

          {/* Low Stock Alert Banner */}
          {!loading && stats?.lowStockCount > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <AlertTriangleIcon className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">{stats.lowStockCount} product{stats.lowStockCount !== 1 ? "s" : ""} need restocking</p>
                  <p className="text-xs text-amber-700">Review inventory alerts to plan purchase orders.</p>
                </div>
              </div>
              <Link href="/inventory-alerts" className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 shrink-0">View Alerts</Link>
            </div>
          )}

          {/* Bottom Panels */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Sales */}
            <div className="lg:col-span-1 rounded-2xl border border-vendora/10 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-vendora/10 px-5 py-3.5">
                <h3 className="text-sm font-bold text-vendora-dark">Recent Sales</h3>
                <Link href="/sales" className="text-xs font-medium text-vendora hover:underline">View all</Link>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-vendora-bg" />)}</div>
              ) : recentSales.length === 0 ? (
                <p className="px-5 py-6 text-sm text-vendora-text/60 text-center">No recent sales.</p>
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
                        <span className={`text-[10px] font-semibold ${s.paymentStatus === "Paid" ? "text-emerald-700" : s.paymentStatus === "Partial" ? "text-amber-700" : "text-red-700"}`}>{s.paymentStatus}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent Expenses */}
            <div className="lg:col-span-1 rounded-2xl border border-vendora/10 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-vendora/10 px-5 py-3.5">
                <h3 className="text-sm font-bold text-vendora-dark">Recent Expenses</h3>
                <Link href="/expenses" className="text-xs font-medium text-vendora hover:underline">View all</Link>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-vendora-bg" />)}</div>
              ) : recentExpenses.length === 0 ? (
                <p className="px-5 py-6 text-sm text-vendora-text/60 text-center">No recent expenses.</p>
              ) : (
                <ul className="divide-y divide-vendora/5">
                  {recentExpenses.map((e) => (
                    <li key={String(e.id)} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-vendora-bg/30">
                      <div>
                        <p className="font-semibold text-vendora-text truncate max-w-[140px]">{e.title}</p>
                        <p className="text-xs text-vendora-text/60">{e.category} · {fmtDate(e.expenseDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-vendora-dark">{fmt(e.amount)}</p>
                        <span className={`text-[10px] font-semibold ${e.status === "Paid" ? "text-emerald-700" : "text-amber-700"}`}>{e.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Low Stock Alerts */}
            <div className="lg:col-span-1 rounded-2xl border border-vendora/10 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-vendora/10 px-5 py-3.5">
                <h3 className="text-sm font-bold text-vendora-dark">Low Stock Alerts</h3>
                <Link href="/inventory-alerts" className="text-xs font-medium text-vendora hover:underline">View all</Link>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-vendora-bg" />)}</div>
              ) : lowStockAlerts.length === 0 ? (
                <p className="px-5 py-6 text-sm text-vendora-text/60 text-center">All products are well-stocked.</p>
              ) : (
                <ul className="divide-y divide-vendora/5">
                  {lowStockAlerts.map((p) => (
                    <li key={String(p.id)} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-vendora-bg/30">
                      <div>
                        <p className="font-semibold text-vendora-text">{p.name}</p>
                        <p className="font-mono text-xs text-vendora-text/60">{p.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${p.stockQuantity === 0 ? "text-red-700" : "text-amber-700"}`}>{p.stockQuantity === 0 ? "Out" : p.stockQuantity} left</p>
                        <p className="text-[10px] text-vendora-text/50">threshold: {p.lowStockThreshold}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
