"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getReportSales, getReportPurchases, getReportProfitLoss,
  getReportTopProducts, getReportCustomers, getReportSuppliers, getReportExpenses,
} from "../../../lib/api";
import { RefreshIcon, AlertTriangleIcon } from "../../../components/Icons";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

function fmt(n) { return `$${Number(n || 0).toFixed(2)}`; }

function SummaryCard({ label, value, sub, highlight = "text-vendora-dark", warn }) {
  return (
    <div className={`rounded-2xl border bg-surface p-4 shadow-xs ${warn ? "border-amber-200" : "border-vendora/10"}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-vendora">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-vendora-text/60">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title }) {
  return <h3 className="text-base font-bold text-vendora-dark border-b border-vendora/10 pb-2 mb-3">{title}</h3>;
}

function TableWrapper({ children }) {
  return <div className="overflow-x-auto rounded-xl border border-vendora/10 bg-surface shadow-xs">{children}</div>;
}

function exportCSV(headers, rows, filename) {
  const lines = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-6 text-center text-sm text-vendora-text/60">
        <div className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-vendora/20 border-t-vendora mr-2" />Loading...
      </td>
    </tr>
  );
}

function ErrorRow({ cols, message }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-4 text-center text-sm text-red-600">{message}</td>
    </tr>
  );
}

export default function ReportsPage() {
  const [preset, setPreset] = useState("month");
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

    tasks.forEach(({ key }) => { setL(key, true); setE(key, ""); });

    await Promise.all(tasks.map(async ({ key, fn, set }) => {
      try {
        const res = await fn();
        if (res?.success) set(res);
        else setE(key, res?.message || "Failed to load.");
      } catch (err) {
        setE(key, err.message || "Failed to load.");
      } finally {
        setL(key, false);
      }
    }));
  }, [preset, customStart, customEnd]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pl = plData?.profitLoss || {};
  const sales = salesData?.summary || {};
  const purchases = purchaseData?.summary || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vendora-text">Reports & Analytics</h2>
          <p className="mt-1 text-sm text-vendora-text/70">Real-time business intelligence from verified database records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchAll} className="inline-flex items-center gap-2 rounded-xl border border-vendora/20 bg-surface px-3.5 py-2.5 text-sm font-medium text-vendora-text hover:bg-vendora-bg">
            <RefreshIcon className="h-4 w-4" /><span className="hidden sm:inline">Refresh</span>
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-vendora/20 bg-surface px-3.5 py-2.5 text-sm font-medium text-vendora-text hover:bg-vendora-bg">
            🖨 <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-vendora/10 bg-surface p-4 shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-vendora-text/70">Period:</span>
        {PRESETS.map((p) => (
          <button key={p.value} type="button" onClick={() => setPreset(p.value)}
            className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${preset === p.value ? "bg-vendora text-white" : "border border-vendora/20 text-vendora-text hover:bg-vendora-bg"}`}>
            {p.label}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2 text-xs">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-lg border border-vendora/15 bg-surface px-2 py-1.5 text-xs text-vendora-text outline-none" />
            <span className="text-vendora-text/60">to</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-lg border border-vendora/15 bg-surface px-2 py-1.5 text-xs text-vendora-text outline-none" />
          </div>
        )}
      </div>

      {/* Sales Report */}
      <section>
        <SectionHeader title="Sales Report" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-4">
          <SummaryCard label="Total Sales" value={loading.sales ? "…" : fmt(sales.totalSales)} highlight="text-emerald-700" />
          <SummaryCard label="Orders" value={loading.sales ? "…" : String(sales.count || 0)} />
          <SummaryCard label="Avg. Sale" value={loading.sales ? "…" : fmt(sales.averageSaleValue)} />
          <SummaryCard label="Discount" value={loading.sales ? "…" : fmt(sales.totalDiscount)} />
          <SummaryCard label="Collected" value={loading.sales ? "…" : fmt(sales.totalPaid)} highlight="text-emerald-700" />
          <SummaryCard label="Outstanding" value={loading.sales ? "…" : fmt(sales.totalDue)} highlight={sales.totalDue > 0 ? "text-amber-700" : "text-vendora-text"} warn={sales.totalDue > 0} />
        </div>
        {errors.sales && <p className="text-sm text-red-600">{errors.sales}</p>}

        {/* Sales Trend */}
        {salesData?.trend?.length > 0 && (
          <div className="rounded-2xl border border-vendora/10 bg-surface p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-vendora mb-3">Sales Trend</p>
            <div className="flex items-end gap-1 h-24 overflow-x-auto">
              {(() => {
                const trend = salesData.trend;
                const max = Math.max(...trend.map((t) => t.total), 1);
                return trend.map((t, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 min-w-[28px]">
                    <div className="w-5 rounded-t bg-vendora-accent/70 transition-all" style={{ height: `${Math.max(4, (t.total / max) * 80)}px` }} title={fmt(t.total)} />
                    <span className="text-[9px] text-vendora-text/50 rotate-45 origin-left">{t._id?.day || t._id?.week || t._id?.month}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </section>

      {/* Purchase Report */}
      <section>
        <SectionHeader title="Purchase Report" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
          <SummaryCard label="Total Purchases" value={loading.purchases ? "…" : fmt(purchases.totalPurchases)} />
          <SummaryCard label="Orders" value={loading.purchases ? "…" : String(purchases.count || 0)} />
          <SummaryCard label="Paid to Suppliers" value={loading.purchases ? "…" : fmt(purchases.totalPaid)} highlight="text-emerald-700" />
          <SummaryCard label="Supplier Dues" value={loading.purchases ? "…" : fmt(purchases.totalDue)} highlight={purchases.totalDue > 0 ? "text-amber-700" : "text-vendora-text"} warn={purchases.totalDue > 0} />
        </div>
        {errors.purchases && <p className="text-sm text-red-600">{errors.purchases}</p>}
      </section>

      {/* Profit & Loss */}
      <section>
        <SectionHeader title="Profit & Loss" />
        {pl.cogsIncomplete && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangleIcon className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Some sales in this period were created before cost tracking was enabled. COGS and profit figures may be incomplete for those historical records.</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="Revenue" value={loading.pl ? "…" : fmt(pl.revenue)} highlight="text-emerald-700" />
          <SummaryCard label="COGS" value={loading.pl ? "…" : fmt(pl.cogs)} sub={pl.cogsIncomplete ? "⚠ Incomplete" : undefined} />
          <SummaryCard label="Gross Profit" value={loading.pl ? "…" : fmt(pl.grossProfit)} highlight={pl.grossProfit >= 0 ? "text-emerald-700" : "text-red-700"} />
          <SummaryCard label="Operating Expenses" value={loading.pl ? "…" : fmt(pl.operatingExpenses)} />
          <SummaryCard label="Net Profit" value={loading.pl ? "…" : fmt(pl.netProfit)} highlight={pl.netProfit >= 0 ? "text-emerald-700" : "text-red-700"} />
        </div>
        <p className="mt-2 text-xs text-vendora-text/60">Cash collected from customers: <strong>{fmt(pl.totalPaidByCustomers)}</strong> — Unpaid sales are not counted as collected cash.</p>
        {errors.pl && <p className="text-sm text-red-600 mt-2">{errors.pl}</p>}
      </section>

      {/* Expense Breakdown */}
      <section>
        <SectionHeader title="Expense Breakdown by Category" />
        <TableWrapper>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-vendora/10 bg-vendora-bg/60 text-xs font-semibold uppercase tracking-wider text-vendora-dark">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Count</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vendora/5">
              {loading.expenses ? <LoadingRow cols={3} /> :
               errors.expenses ? <ErrorRow cols={3} message={errors.expenses} /> :
               !expenseData?.byCategory?.length ? <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-vendora-text/60">No expense data for this period.</td></tr> :
               expenseData.byCategory.map((row) => (
                <tr key={row._id} className="hover:bg-vendora-bg/30">
                  <td className="px-4 py-3 font-medium">{row._id}</td>
                  <td className="px-4 py-3 text-right text-vendora-text/70">{row.count}</td>
                  <td className="px-4 py-3 text-right font-bold text-vendora-dark">{fmt(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
        {expenseData?.byCategory?.length > 0 && (
          <button type="button" onClick={() => exportCSV(["Category", "Count", "Total"], expenseData.byCategory.map((r) => [r._id, r.count, r.total]), "expenses-by-category.csv")} className="mt-2 text-xs font-medium text-vendora hover:underline">Export CSV</button>
        )}
      </section>

      {/* Top Products */}
      <section>
        <SectionHeader title="Top Products by Revenue" />
        <TableWrapper>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-vendora/10 bg-vendora-bg/60 text-xs font-semibold uppercase tracking-wider text-vendora-dark">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Qty Sold</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">COGS</th>
                <th className="px-4 py-3 text-right">Gross Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vendora/5">
              {loading.products ? <LoadingRow cols={6} /> :
               errors.products ? <ErrorRow cols={6} message={errors.products} /> :
               !topProducts?.products?.length ? <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-vendora-text/60">No product sales in this period.</td></tr> :
               topProducts.products.map((p) => (
                <tr key={String(p.productId)} className="hover:bg-vendora-bg/30">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-vendora-text/70">{p.sku}</td>
                  <td className="px-4 py-3 text-right">{p.totalQty}</td>
                  <td className="px-4 py-3 text-right font-bold text-vendora-dark">{fmt(p.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-vendora-text/70">{p.cogsIncomplete ? <span title="Incomplete data">⚠ {fmt(p.cogs)}</span> : fmt(p.cogs)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.grossProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{p.cogsIncomplete ? <span title="Incomplete">⚠ {fmt(p.grossProfit)}</span> : fmt(p.grossProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
        {topProducts?.products?.length > 0 && (
          <button type="button" onClick={() => exportCSV(["Product", "SKU", "Qty Sold", "Revenue", "COGS", "Gross Profit"], topProducts.products.map((p) => [p.name, p.sku, p.totalQty, p.totalRevenue, p.cogs, p.grossProfit]), "top-products.csv")} className="mt-2 text-xs font-medium text-vendora hover:underline">Export CSV</button>
        )}
      </section>

      {/* Customer Report */}
      <section>
        <SectionHeader title="Customer Summary" />
        <TableWrapper>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-vendora/10 bg-vendora-bg/60 text-xs font-semibold uppercase tracking-wider text-vendora-dark">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">Total Sales</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vendora/5">
              {loading.customers ? <LoadingRow cols={5} /> :
               errors.customers ? <ErrorRow cols={5} message={errors.customers} /> :
               !customerData?.customers?.length ? <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-vendora-text/60">No customer sales in this period.</td></tr> :
               customerData.customers.map((c, i) => (
                <tr key={i} className="hover:bg-vendora-bg/30">
                  <td className="px-4 py-3 font-medium">{c.customerName || "Walk-in Customer"}</td>
                  <td className="px-4 py-3 text-right">{c.count}</td>
                  <td className="px-4 py-3 text-right font-bold text-vendora-dark">{fmt(c.totalSales)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{fmt(c.totalPaid)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${c.totalDue > 0 ? "text-amber-700" : "text-vendora-text/60"}`}>{fmt(c.totalDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
        {customerData?.customers?.length > 0 && (
          <button type="button" onClick={() => exportCSV(["Customer", "Orders", "Total Sales", "Paid", "Due"], customerData.customers.map((c) => [c.customerName, c.count, c.totalSales, c.totalPaid, c.totalDue]), "customer-report.csv")} className="mt-2 text-xs font-medium text-vendora hover:underline">Export CSV</button>
        )}
      </section>

      {/* Supplier Report */}
      <section>
        <SectionHeader title="Supplier Summary" />
        <TableWrapper>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-vendora/10 bg-vendora-bg/60 text-xs font-semibold uppercase tracking-wider text-vendora-dark">
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Orders</th>
                <th className="px-4 py-3 text-right">Total Purchases</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vendora/5">
              {loading.suppliers ? <LoadingRow cols={5} /> :
               errors.suppliers ? <ErrorRow cols={5} message={errors.suppliers} /> :
               !supplierData?.suppliers?.length ? <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-vendora-text/60">No supplier purchases in this period.</td></tr> :
               supplierData.suppliers.map((s, i) => (
                <tr key={i} className="hover:bg-vendora-bg/30">
                  <td className="px-4 py-3 font-medium">{s.supplierName}</td>
                  <td className="px-4 py-3 text-right">{s.count}</td>
                  <td className="px-4 py-3 text-right font-bold text-vendora-dark">{fmt(s.totalPurchases)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{fmt(s.totalPaid)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${s.totalDue > 0 ? "text-amber-700" : "text-vendora-text/60"}`}>{fmt(s.totalDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrapper>
        {supplierData?.suppliers?.length > 0 && (
          <button type="button" onClick={() => exportCSV(["Supplier", "Orders", "Total Purchases", "Paid", "Due"], supplierData.suppliers.map((s) => [s.supplierName, s.count, s.totalPurchases, s.totalPaid, s.totalDue]), "supplier-report.csv")} className="mt-2 text-xs font-medium text-vendora hover:underline">Export CSV</button>
        )}
      </section>
    </div>
  );
}
