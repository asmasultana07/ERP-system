"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getReportSales,
  getReportPurchases,
  getReportProfitLoss,
  getReportTopProducts,
  getReportCustomers,
  getReportSuppliers,
  getReportExpenses,
} from "../../../lib/api";
import { AlertTriangleIcon } from "../../../components/Icons";
import { Card, CardHeader, Badge } from "../../../components/Ui";
import { AreaChart } from "../../../components/charts/Charts";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

const SECTIONS = [
  { id: "all", label: "Overview & All" },
  { id: "financials", label: "Profit & Loss" },
  { id: "sales", label: "Sales & Invoicing" },
  { id: "purchases", label: "Purchases & Restock" },
  { id: "products", label: "Top Products" },
  { id: "expenses", label: "Expenses" },
  { id: "stakeholders", label: "Customers & Vendors" },
];

function fmt(n) {
  return `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtCompact(n) {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v}`;
}

function StatTile({ label, value, sub, highlight = "text-slate-900 dark:text-white", icon, warn }) {
  return (
    <div className={`flex flex-col justify-between rounded-2xl border bg-white dark:bg-slate-900 p-4.5 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs ${
      warn ? "border-amber-300 dark:border-amber-800/80 bg-amber-50/20" : "border-slate-200/80 dark:border-slate-800"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
        {icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className={`text-2xl font-extrabold tracking-tight ${highlight}`}>{value}</p>
        {sub && <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

function exportCSV(headers, rows, filename) {
  const lines = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      {children}
    </div>
  );
}

function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
        <div className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-blue-600/30 border-t-blue-600 mr-2 align-middle" />
        Fetching analytical records…
      </td>
    </tr>
  );
}

function ErrorRow({ cols, message }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-5 text-center text-xs text-rose-600 dark:text-rose-400 font-medium">
        {message}
      </td>
    </tr>
  );
}

export default function ReportsPage() {
  const [preset, setPreset] = useState("month");
  const [activeTab, setActiveTab] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [salesData, setSalesData] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [plData, setPlData] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [supplierData, setSupplierData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);

  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const setL = (key, val) => setLoading((p) => ({ ...p, [key]: val }));
  const setE = (key, val) => setErrors((p) => ({ ...p, [key]: val }));

  const fetchAll = useCallback(async () => {
    if (preset === "custom" && (!customStart || !customEnd)) return;

    const args = [preset, customStart, customEnd];

    const tasks = [
      { key: "sales", fn: () => getReportSales(...args), set: setSalesData },
      { key: "purchases", fn: () => getReportPurchases(...args), set: setPurchaseData },
      { key: "pl", fn: () => getReportProfitLoss(...args), set: setPlData },
      { key: "products", fn: () => getReportTopProducts(...args), set: setTopProducts },
      { key: "customers", fn: () => getReportCustomers(...args), set: setCustomerData },
      { key: "suppliers", fn: () => getReportSuppliers(...args), set: setSupplierData },
      { key: "expenses", fn: () => getReportExpenses(...args), set: setExpenseData },
    ];

    tasks.forEach(({ key }) => {
      setL(key, true);
      setE(key, "");
    });

    await Promise.all(
      tasks.map(async ({ key, fn, set }) => {
        try {
          const res = await fn();
          if (res?.success) set(res);
          else setE(key, res?.message || "Failed to load.");
        } catch (err) {
          setE(key, err.message || "Failed to load.");
        } finally {
          setL(key, false);
        }
      })
    );
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const pl = plData?.profitLoss || {};
  const sales = salesData?.summary || {};
  const purchases = purchaseData?.summary || {};

  const salesTrendList = (salesData?.trend || []).map((t) => ({
    label: t._id?.day || t._id?.week || t._id?.month || "Period",
    value: t.total || 0,
  }));

  const showAll = activeTab === "all";

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reports & Business Intelligence
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Real-time analytics and financial summaries generated directly from database entries.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Print Full Report"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Date Timeframe Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
            Period:
          </span>
          <div className="inline-flex rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-850 p-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPreset(p.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  preset === p.value
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="flex items-center gap-2 text-xs pl-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Section View Switcher Pills */}
        <div className="overflow-x-auto pb-1 sm:pb-0">
          <div className="inline-flex gap-1">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveTab(sec.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                  activeTab === sec.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Profit & Loss Overview */}
      {(showAll || activeTab === "financials") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Income Statement (Profit & Loss)
              </h2>
              <p className="text-xs text-slate-500">Summary of revenue, cost of goods sold, and net operational earnings.</p>
            </div>
            {pl.grossProfit !== undefined && (
              <Badge tone={pl.netProfit >= 0 ? "success" : "danger"}>
                {pl.netProfit >= 0 ? "Profitable" : "Operating at Loss"}
              </Badge>
            )}
          </div>

          {pl.cogsIncomplete && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangleIcon className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <span>
                Historical sales in this date range contain items created prior to automated cost tracking. Some COGS figures may be approximated.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              label="Gross Revenue"
              value={loading.pl ? "…" : fmt(pl.revenue)}
              highlight="text-blue-600 dark:text-blue-400"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />
            <StatTile
              label="Product COGS"
              value={loading.pl ? "…" : fmt(pl.cogs)}
              sub={pl.cogsIncomplete ? "⚠ Partial data" : "Cost of Inventory Sold"}
            />
            <StatTile
              label="Gross Margin"
              value={loading.pl ? "…" : fmt(pl.grossProfit)}
              highlight={pl.grossProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}
            />
            <StatTile
              label="Operating Costs"
              value={loading.pl ? "…" : fmt(pl.operatingExpenses)}
              sub="Total business expenses"
            />
            <StatTile
              label="Net Profit"
              value={loading.pl ? "…" : fmt(pl.netProfit)}
              highlight={pl.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}
              sub={`Cash in hand: ${fmt(pl.totalPaidByCustomers)}`}
            />
          </div>

          {errors.pl && <p className="text-xs text-rose-600">{errors.pl}</p>}
        </section>
      )}

      {/* 2. Sales Report */}
      {(showAll || activeTab === "sales") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sales & Invoice Realization
              </h2>
              <p className="text-xs text-slate-500">Order revenue, discounts granted, cash collected, and outstanding client dues.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                exportCSV(
                  ["Metric", "Value"],
                  [
                    ["Total Sales", sales.totalSales],
                    ["Orders Count", sales.count],
                    ["Average Order Value", sales.averageSaleValue],
                    ["Discounts Granted", sales.totalDiscount],
                    ["Total Paid", sales.totalPaid],
                    ["Total Due", sales.totalDue],
                  ],
                  "sales-report-summary.csv"
                )
              }
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Export CSV ↓
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Total Sales" value={loading.sales ? "…" : fmt(sales.totalSales)} highlight="text-blue-600 dark:text-blue-400" />
            <StatTile label="Order Count" value={loading.sales ? "…" : String(sales.count || 0)} />
            <StatTile label="Avg. Order" value={loading.sales ? "…" : fmt(sales.averageSaleValue)} />
            <StatTile label="Discounts" value={loading.sales ? "…" : fmt(sales.totalDiscount)} sub="Promotions" />
            <StatTile label="Collected" value={loading.sales ? "…" : fmt(sales.totalPaid)} highlight="text-emerald-600 dark:text-emerald-400" />
            <StatTile
              label="Outstanding"
              value={loading.sales ? "…" : fmt(sales.totalDue)}
              highlight={sales.totalDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}
              warn={sales.totalDue > 0}
              sub={sales.totalDue > 0 ? "Uncollected" : "Clear"}
            />
          </div>

          {/* Upgraded SVG Sales Trend Chart */}
          {salesTrendList.length > 0 && (
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Sales Trend Across Selected Period
                </p>
                <span className="text-[11px] text-slate-400 font-medium">Daily / Weekly Breakdown</span>
              </div>
              <div className="pt-2">
                <AreaChart data={salesTrendList} valueFormat={fmtCompact} color="#2563eb" height={190} />
              </div>
            </Card>
          )}

          {errors.sales && <p className="text-xs text-rose-600">{errors.sales}</p>}
        </section>
      )}

      {/* 3. Purchases Report */}
      {(showAll || activeTab === "purchases") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Purchase Orders & Supplier Payables
              </h2>
              <p className="text-xs text-slate-500">Restock acquisitions, payments disbursed, and outstanding vendor liability.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                exportCSV(
                  ["Metric", "Value"],
                  [
                    ["Total Purchases", purchases.totalPurchases],
                    ["Purchase Orders Count", purchases.count],
                    ["Disbursed to Suppliers", purchases.totalPaid],
                    ["Supplier Dues", purchases.totalDue],
                  ],
                  "purchases-report-summary.csv"
                )
              }
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Export CSV ↓
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <StatTile label="Total Restock" value={loading.purchases ? "…" : fmt(purchases.totalPurchases)} />
            <StatTile label="PO Count" value={loading.purchases ? "…" : String(purchases.count || 0)} />
            <StatTile label="Disbursed" value={loading.purchases ? "…" : fmt(purchases.totalPaid)} highlight="text-emerald-600 dark:text-emerald-400" />
            <StatTile
              label="Supplier Dues"
              value={loading.purchases ? "…" : fmt(purchases.totalDue)}
              highlight={purchases.totalDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"}
              warn={purchases.totalDue > 0}
              sub={purchases.totalDue > 0 ? "Pending payment" : "Settled"}
            />
          </div>

          {errors.purchases && <p className="text-xs text-rose-600">{errors.purchases}</p>}
        </section>
      )}

      {/* 4. Top Selling Products */}
      {(showAll || activeTab === "products") && (
        <section className="space-y-3">
          <Card>
            <CardHeader
              title="Top Products by Revenue"
              subtitle="Performance rankings by units sold, gross turnover, and item-level margin"
              action={
                topProducts?.products?.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      exportCSV(
                        ["Product", "SKU", "Qty Sold", "Revenue", "COGS", "Gross Profit"],
                        topProducts.products.map((p) => [p.name, p.sku, p.totalQty, p.totalRevenue, p.cogs, p.grossProfit]),
                        "top-products.csv"
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                  >
                    <span>Export CSV</span>
                  </button>
                )
              }
            />
            <TableWrapper>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Units Sold</th>
                    <th className="px-4 py-3 text-right">Gross Revenue</th>
                    <th className="px-4 py-3 text-right">COGS</th>
                    <th className="px-5 py-3 text-right">Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading.products ? (
                    <LoadingRow cols={6} />
                  ) : errors.products ? (
                    <ErrorRow cols={6} message={errors.products} />
                  ) : !topProducts?.products?.length ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                        No product sales recorded in this timeframe.
                      </td>
                    </tr>
                  ) : (
                    topProducts.products.map((p) => (
                      <tr key={String(p.productId)} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{p.sku}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">{p.totalQty}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{fmt(p.totalRevenue)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {p.cogsIncomplete ? <span title="Partial cost tracking">⚠ {fmt(p.cogs)}</span> : fmt(p.cogs)}
                        </td>
                        <td className={`px-5 py-3 text-right font-bold ${p.grossProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                          {fmt(p.grossProfit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </Card>
        </section>
      )}

      {/* 5. Expense Breakdown by Category */}
      {(showAll || activeTab === "expenses") && (
        <section className="space-y-3">
          <Card>
            <CardHeader
              title="Expense Breakdown by Category"
              subtitle="Distribution of operational spending across designated accounting categories"
              action={
                expenseData?.byCategory?.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      exportCSV(
                        ["Category", "Transactions", "Total Amount"],
                        expenseData.byCategory.map((r) => [r._id, r.count, r.total]),
                        "expenses-by-category.csv"
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                  >
                    <span>Export CSV</span>
                  </button>
                )
              }
            />
            <TableWrapper>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3">Expense Category</th>
                    <th className="px-4 py-3 text-right">Transactions</th>
                    <th className="px-5 py-3 text-right">Total Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading.expenses ? (
                    <LoadingRow cols={3} />
                  ) : errors.expenses ? (
                    <ErrorRow cols={3} message={errors.expenses} />
                  ) : !expenseData?.byCategory?.length ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-xs text-slate-400">
                        No operational expenses recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    expenseData.byCategory.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span>{row._id}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">{row.count} records</td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-white">{fmt(row.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </Card>
        </section>
      )}

      {/* 6. Customers & Suppliers Summary */}
      {(showAll || activeTab === "stakeholders") && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Customer Summary Table */}
          <Card>
            <CardHeader
              title="Top Customers by Volume"
              subtitle="Client transaction counts and collection status"
              action={
                customerData?.customers?.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      exportCSV(
                        ["Customer", "Orders", "Total Sales", "Paid", "Due"],
                        customerData.customers.map((c) => [c.customerName, c.count, c.totalSales, c.totalPaid, c.totalDue]),
                        "customer-report.csv"
                      )
                    }
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Export CSV
                  </button>
                )
              }
            />
            <TableWrapper>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-3 py-3 text-right">Orders</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading.customers ? (
                    <LoadingRow cols={5} />
                  ) : errors.customers ? (
                    <ErrorRow cols={5} message={errors.customers} />
                  ) : !customerData?.customers?.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                        No customer transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    customerData.customers.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {c.customerName || "Walk-in Buyer"}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500">{c.count}</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-900 dark:text-white">{fmt(c.totalSales)}</td>
                        <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{fmt(c.totalPaid)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${c.totalDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                          {fmt(c.totalDue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </Card>

          {/* Supplier Summary Table */}
          <Card>
            <CardHeader
              title="Top Suppliers by Volume"
              subtitle="Procurement transactions and payable balances"
              action={
                supplierData?.suppliers?.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      exportCSV(
                        ["Supplier", "Orders", "Total Purchases", "Paid", "Due"],
                        supplierData.suppliers.map((s) => [s.supplierName, s.count, s.totalPurchases, s.totalPaid, s.totalDue]),
                        "supplier-report.csv"
                      )
                    }
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Export CSV
                  </button>
                )
              }
            />
            <TableWrapper>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-3 py-3 text-right">Orders</th>
                    <th className="px-3 py-3 text-right">Purchases</th>
                    <th className="px-3 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading.suppliers ? (
                    <LoadingRow cols={5} />
                  ) : errors.suppliers ? (
                    <ErrorRow cols={5} message={errors.suppliers} />
                  ) : !supplierData?.suppliers?.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                        No supplier procurement recorded.
                      </td>
                    </tr>
                  ) : (
                    supplierData.suppliers.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {s.supplierName}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-500">{s.count}</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-900 dark:text-white">{fmt(s.totalPurchases)}</td>
                        <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{fmt(s.totalPaid)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${s.totalDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                          {fmt(s.totalDue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </Card>
        </section>
      )}
    </div>
  );
}
