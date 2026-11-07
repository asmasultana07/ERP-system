"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getInventoryLowStock, getInventoryOutOfStock, getInventorySummary } from "../../../lib/api";
import { SearchIcon, RefreshIcon, AlertTriangleIcon, CloseIcon } from "../../../components/Icons";

function fmt(n) { return Number(n || 0).toLocaleString(); }

function StockBadge({ qty }) {
  if (qty === 0) return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Out of Stock</span>;
  return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{qty} left</span>;
}

function ProductTable({ items, loading, error, showReorder }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-vendora/10 bg-white p-8 text-center shadow-xs">
        <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-vendora/20 border-t-vendora" />
        <p className="mt-3 text-sm text-vendora-text/70">Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }
  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-vendora/20 bg-white p-8 text-center shadow-xs">
        <p className="text-sm text-vendora-text/60">No products found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-vendora/10 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-vendora/10 bg-vendora-bg/60 text-xs font-semibold uppercase tracking-wider text-vendora-dark">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Current Stock</th>
              <th className="px-4 py-3 text-right">Threshold</th>
              {showReorder && <th className="px-4 py-3 text-right">Suggested Reorder</th>}
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vendora/5">
            {items.map((p) => (
              <tr key={String(p.id)} className="hover:bg-vendora-bg/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-vendora-text">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-vendora-text/70">{p.sku}</td>
                <td className="px-4 py-3">
                  {p.category ? <span className="rounded-full bg-vendora-bg px-2.5 py-0.5 text-xs font-medium text-vendora-dark border border-vendora/10">{p.category}</span> : <span className="text-vendora-text/40">—</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold text-vendora-dark">{fmt(p.stockQuantity)} <span className="text-xs font-normal text-vendora-text/50">{p.unit}</span></td>
                <td className="px-4 py-3 text-right text-vendora-text/70">{fmt(p.lowStockThreshold)}</td>
                {showReorder && (
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-vendora-dark">{fmt(p.suggestedReorderQty)}</span>
                    <span className="ml-1 text-xs text-vendora-text/50">{p.unit}</span>
                    <div className="text-[10px] text-vendora-text/40">suggestion only</div>
                  </td>
                )}
                <td className="px-4 py-3 text-center"><StockBadge qty={p.stockQuantity} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InventoryAlertsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);

  const [loadingSum, setLoadingSum] = useState(true);
  const [loadingLow, setLoadingLow] = useState(true);
  const [loadingOut, setLoadingOut] = useState(true);
  const [errorLow, setErrorLow] = useState("");
  const [errorOut, setErrorOut] = useState("");

  const [activeTab, setActiveTab] = useState("low");

  const loadData = useCallback(async (q = search, cat = category) => {
    setLoadingSum(true);
    setLoadingLow(true);
    setLoadingOut(true);
    setErrorLow("");
    setErrorOut("");

    const [sumRes, lowRes, outRes] = await Promise.allSettled([
      getInventorySummary(),
      getInventoryLowStock({ search: q, category: cat }),
      getInventoryOutOfStock({ search: q, category: cat }),
    ]);

    if (sumRes.status === "fulfilled" && sumRes.value?.success) setSummary(sumRes.value.summary);
    setLoadingSum(false);

    if (lowRes.status === "fulfilled" && lowRes.value?.success) setLowStock(lowRes.value.items || []);
    else setErrorLow(lowRes.reason?.message || "Failed to load low stock.");
    setLoadingLow(false);

    if (outRes.status === "fulfilled" && outRes.value?.success) setOutOfStock(outRes.value.items || []);
    else setErrorOut(outRes.reason?.message || "Failed to load out of stock.");
    setLoadingOut(false);
  }, [search, category]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleSearch(e) {
    e.preventDefault();
    loadData(search, category);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vendora-text">Inventory Alerts</h2>
          <p className="mt-1 text-sm text-vendora-text/70">Monitor low stock and out-of-stock products. Reorder quantities are suggestions only.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => loadData()} className="inline-flex items-center gap-2 rounded-xl border border-vendora/20 bg-white px-3.5 py-2.5 text-sm font-medium text-vendora-text hover:bg-vendora-bg">
            <RefreshIcon className="h-4 w-4" /><span className="hidden sm:inline">Refresh</span>
          </button>
          <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2.5 text-sm font-medium text-white hover:bg-vendora-dark">
            Manage Products
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-vendora/10 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-vendora">Total Active Products</p>
          <p className="mt-2 text-2xl font-bold text-vendora-dark">{loadingSum ? "…" : fmt(summary?.totalActive)}</p>
        </div>
        <div className={`rounded-2xl border bg-white p-4 shadow-xs ${summary?.lowStock > 0 ? "border-amber-200" : "border-vendora/10"}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-vendora">Low Stock</p>
          <p className={`mt-2 text-2xl font-bold ${summary?.lowStock > 0 ? "text-amber-700" : "text-vendora-text"}`}>
            {loadingSum ? "…" : fmt(summary?.lowStock)}
          </p>
          {summary?.lowStock > 0 && <p className="mt-1 text-xs text-amber-600">Attention required</p>}
        </div>
        <div className={`rounded-2xl border bg-white p-4 shadow-xs ${summary?.outOfStock > 0 ? "border-red-200" : "border-vendora/10"}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-vendora">Out of Stock</p>
          <p className={`mt-2 text-2xl font-bold ${summary?.outOfStock > 0 ? "text-red-700" : "text-vendora-text"}`}>
            {loadingSum ? "…" : fmt(summary?.outOfStock)}
          </p>
          {summary?.outOfStock > 0 && <p className="mt-1 text-xs text-red-600">Immediate action needed</p>}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-vendora/10 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-vendora-text/40">
            <SearchIcon className="h-4 w-4" />
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product name or SKU..." className="w-full rounded-xl border border-vendora/15 bg-vendora-bg/30 py-2 pl-10 pr-10 text-sm text-vendora-text outline-none focus:border-vendora focus:bg-white focus:ring-2 focus:ring-vendora-accent/20" />
          {search && (
            <button type="button" onClick={() => { setSearch(""); loadData("", category); }} className="absolute inset-y-0 right-0 flex items-center pr-3 text-vendora-text/40 hover:text-vendora-text">
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </form>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-vendora-text/70">Category:</span>
          <input type="text" value={category} onChange={(e) => { setCategory(e.target.value); loadData(search, e.target.value); }} placeholder="Filter by category..." className="rounded-xl border border-vendora/15 bg-white px-3 py-2 text-sm text-vendora-text outline-none focus:border-vendora" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-vendora/10">
        <button type="button" onClick={() => setActiveTab("low")}
          className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${activeTab === "low" ? "border-vendora text-vendora" : "border-transparent text-vendora-text/60 hover:text-vendora-text"}`}>
          Low Stock {summary?.lowStock > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{summary.lowStock}</span>}
        </button>
        <button type="button" onClick={() => setActiveTab("out")}
          className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px ${activeTab === "out" ? "border-vendora text-vendora" : "border-transparent text-vendora-text/60 hover:text-vendora-text"}`}>
          Out of Stock {summary?.outOfStock > 0 && <span className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">{summary.outOfStock}</span>}
        </button>
      </div>

      {activeTab === "low" ? (
        <div>
          <p className="mb-3 text-sm text-vendora-text/70">Products with stock at or below their reorder threshold. Suggested reorder quantities are estimates — not automatic orders.</p>
          <ProductTable items={lowStock} loading={loadingLow} error={errorLow} showReorder />
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-vendora-text/70">Products with zero stock. These cannot be sold until restocked via a purchase order.</p>
          <ProductTable items={outOfStock} loading={loadingOut} error={errorOut} showReorder />
        </div>
      )}

      <div className="rounded-xl border border-vendora/10 bg-vendora-bg/50 px-4 py-3 text-xs text-vendora-text/70">
        To update stock levels, <Link href="/products" className="font-semibold text-vendora hover:underline">edit a product</Link> directly or create a <Link href="/purchases" className="font-semibold text-vendora hover:underline">new purchase order</Link> to restock inventory.
      </div>
    </div>
  );
}
