"use client";

import { useEffect, useState, useCallback } from "react";
import { getDashboardStats } from "../../../lib/api";
import { RefreshIcon, AlertTriangleIcon } from "../../../components/Icons";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await getDashboardStats();
      if (res?.success) {
        setStats(res.stats || {});
      } else {
        setError(res?.message || "Failed to load dashboard metrics");
      }
    } catch (err) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const cards = [
    {
      label: "Total Sales",
      value: stats ? `$${Number(stats.totalSales || 0).toFixed(2)}` : "—",
      detail: "Gross revenue from all completed sales orders.",
      highlight: "text-emerald-700",
    },
    {
      label: "Total Purchases",
      value: stats ? `$${Number(stats.totalPurchases || 0).toFixed(2)}` : "—",
      detail: "Cumulative expenditure on wholesale vendor restocks.",
      highlight: "text-vendora-accent",
    },
    {
      label: "Outstanding Dues",
      value: stats ? `$${Number(stats.totalCustomerDues || 0).toFixed(2)}` : "—",
      detail: "Uncollected receivables from unpaid & partial invoices.",
      highlight: stats?.totalCustomerDues > 0 ? "text-amber-800" : "text-vendora-text",
    },
    {
      label: "Total Products",
      value: stats ? String(stats.totalProducts ?? 0) : "—",
      detail: "Active catalog items available for distribution.",
      highlight: "text-vendora-dark",
    },
    {
      label: "Low-Stock Alerts",
      value: stats ? String(stats.lowStockCount ?? 0) : "—",
      detail: "Inventory items at or below reorder threshold.",
      highlight: stats?.lowStockCount > 0 ? "text-red-700" : "text-vendora-text",
      badge: stats?.lowStockCount > 0 ? "Attention Required" : "Optimal",
      badgeClass:
        stats?.lowStockCount > 0
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Active Customers",
      value: stats ? String(stats.totalCustomers ?? 0) : "—",
      detail: "Registered clients and distribution partners.",
      highlight: "text-vendora-dark",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vendora-text">
            Executive Business Dashboard
          </h2>
          <p className="mt-1 text-sm text-vendora-text/70">
            Real-time calculations from verified database records. Cancelled orders are excluded from business totals.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-vendora/20 bg-white px-3.5 py-2.5 text-sm font-medium text-vendora-text transition hover:bg-vendora-bg focus:outline-none focus:ring-2 focus:ring-vendora disabled:opacity-50"
        >
          <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Error state */}
      {error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-red-800">
            Failed to Load Dashboard Data
          </h3>
          <p className="mt-1 max-w-md text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={loadStats}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <RefreshIcon className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        /* Stat Cards Grid */
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <article
              key={c.label}
              className="flex flex-col justify-between rounded-2xl border border-vendora/10 bg-white p-5 shadow-xs transition hover:border-vendora/20 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-vendora">
                  {c.label}
                </h3>
                {c.badge && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${c.badgeClass}`}
                  >
                    {c.badge}
                  </span>
                )}
              </div>

              <div className="my-4">
                {loading ? (
                  <div className="h-9 w-28 animate-pulse rounded-lg bg-vendora-bg" />
                ) : (
                  <p
                    className={`text-3xl font-bold tracking-tight ${c.highlight}`}
                  >
                    {c.value}
                  </p>
                )}
              </div>

              <p className="text-xs text-vendora-text/70">{c.detail}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
