"use client";

import { useEffect, useState } from "react";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "../../../lib/api";
import { useResource, invalidate } from "../../../lib/useResource";
import Modal from "../../../components/Modal";
import ConfirmModal from "../../../components/ConfirmModal";
import Toast from "../../../components/Toast";
import { SkeletonTable } from "../../../components/Skeleton";
import {
  SearchIcon, PlusIcon, EditIcon, TrashIcon,
  EyeIcon, CloseIcon, AlertTriangleIcon,
} from "../../../components/Icons";

const CATEGORIES = ["Rent", "Salary", "Transport", "Utilities", "Marketing", "Packaging", "Maintenance", "Other"];
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Mobile Banking", "Card", "Other"];
const STATUSES = ["Paid", "Unpaid"];

const EMPTY_FORM = {
  title: "", category: "Rent", amount: "", paymentMethod: "Cash",
  expenseDate: new Date().toISOString().slice(0, 10), description: "", notes: "", status: "Paid",
};

function fmt(n) { return `$${Number(n || 0).toFixed(2)}`; }
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
    }`}>{status}</span>
  );
}

function ExpenseFormModal({ open, onClose, onSuccess, initial }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      if (initial) {
        setForm({
          title: initial.title || "",
          category: initial.category || "Rent",
          amount: String(initial.amount || ""),
          paymentMethod: initial.paymentMethod || "Cash",
          expenseDate: initial.expenseDate ? new Date(initial.expenseDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          description: initial.description || "",
          notes: initial.notes || "",
          status: initial.status || "Paid",
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, initial]);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      const res = initial
        ? await updateExpense(initial.id, payload)
        : await createExpense(payload);
      if (res?.success) {
        onSuccess(res.expense, !initial);
        onClose();
      } else {
        setError(res?.message || "Failed to save expense.");
      }
    } catch (err) {
      setError(err.message || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-vendora/15 bg-vendora-bg/30 px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:bg-surface focus:ring-2 focus:ring-vendora-accent/20";
  const labelCls = "block text-xs font-semibold text-vendora-text/70 mb-1";

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Expense" : "Add Expense"} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

        <div>
          <label className={labelCls}>Title *</label>
          <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. Office Rent - June" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Category *</label>
            <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Amount *</label>
            <input className={inputCls} type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} required placeholder="0.00" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Payment Method</label>
            <select className={inputCls} value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date *</label>
            <input className={inputCls} type="date" value={form.expenseDate} onChange={(e) => set("expenseDate", e.target.value)} required />
          </div>
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional description..." />
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes..." />
        </div>

        <div className="flex justify-end gap-3 border-t border-vendora/10 pt-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora-text hover:bg-vendora-bg disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-xl bg-vendora px-4 py-2 text-sm font-medium text-white hover:bg-vendora-dark disabled:opacity-50">
            {saving ? "Saving..." : initial ? "Update Expense" : "Add Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ExpenseDetailsModal({ open, onClose, expense, onEdit }) {
  if (!expense) return null;
  const row = (label, val) => (
    <div className="flex justify-between py-2 border-b border-vendora/5 text-sm">
      <span className="text-vendora-text/60 font-medium">{label}</span>
      <span className="text-vendora-text font-semibold text-right">{val}</span>
    </div>
  );
  return (
    <Modal open={open} onClose={onClose} title="Expense Details" maxWidth="max-w-md">
      <div className="space-y-0.5">
        {row("Expense #", <span className="font-mono text-xs bg-vendora-bg px-2 py-0.5 rounded">{expense.expenseNumber}</span>)}
        {row("Title", expense.title)}
        {row("Category", expense.category)}
        {row("Amount", <span className="text-vendora-dark font-bold">{fmt(expense.amount)}</span>)}
        {row("Payment Method", expense.paymentMethod)}
        {row("Date", fmtDate(expense.expenseDate))}
        {row("Status", <StatusBadge status={expense.status} />)}
        {expense.description && row("Description", expense.description)}
        {expense.notes && row("Notes", expense.notes)}
      </div>
      <div className="mt-4 flex justify-end gap-3 border-t border-vendora/10 pt-4">
        <button type="button" onClick={onClose} className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora-text hover:bg-vendora-bg">Close</button>
        <button type="button" onClick={() => { onClose(); onEdit(expense); }} className="rounded-xl bg-vendora px-4 py-2 text-sm font-medium text-white hover:bg-vendora-dark">Edit</button>
      </div>
    </Modal>
  );
}

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "success" });

  // Cached, stale-while-revalidate. Key includes page + all applied filters so
  // paging back/forth or revisiting the module is instant from cache.
  const cacheKey = `expenses:${page}|${appliedSearch}|${categoryFilter}|${methodFilter}|${statusFilter}|${startDate}|${endDate}`;
  const { data, loading, error, refresh, refreshing } = useResource(cacheKey, () =>
    getExpenses({
      page,
      limit: 10,
      search: appliedSearch,
      category: categoryFilter,
      paymentMethod: methodFilter,
      status: statusFilter,
      startDate,
      endDate,
    })
  );

  const expenses = data?.expenses || [];
  const summary = data?.summary || { totalAmount: 0, paidTotal: 0, unpaidTotal: 0 };
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.total || 0;
  const errMsg = error ? error.message || "Failed to load expenses." : "";

  function reloadAfterMutation() {
    invalidate("expenses:");
    invalidate("dashboard");
    setPage(1);
    refresh();
  }

  function handleReset() {
    setSearch(""); setAppliedSearch(""); setCategoryFilter("all"); setMethodFilter("all");
    setStatusFilter("all"); setStartDate(""); setEndDate(""); setPage(1);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteExpense(deleteTarget.id);
      if (res?.success) {
        setToast({ type: "success", message: `Expense "${deleteTarget.expenseNumber}" deleted.` });
        setDeleteTarget(null);
        reloadAfterMutation();
      } else {
        setToast({ type: "error", message: res?.message || "Failed to delete." });
      }
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to delete." });
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved(expense, isNew) {
    setToast({ type: "success", message: isNew ? `Expense "${expense.expenseNumber}" created.` : `Expense "${expense.expenseNumber}" updated.` });
    reloadAfterMutation();
  }

  const hasFilters = Boolean(search) || categoryFilter !== "all" || methodFilter !== "all" || statusFilter !== "all" || Boolean(startDate) || Boolean(endDate);

  return (
    <div className="space-y-6">
      <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: "", type: "success" })} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vendora-text">Expenses</h2>
          <p className="mt-1 text-sm text-vendora-text/70">Track and manage all business operating expenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => { setEditTarget(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2.5 text-sm font-medium text-white hover:bg-vendora-dark">
            <PlusIcon className="h-4 w-4" /><span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Expenses", value: fmt(summary.totalAmount), cls: "text-vendora-dark" },
          { label: "Paid", value: fmt(summary.paidTotal), cls: "text-emerald-700" },
          { label: "Unpaid", value: fmt(summary.unpaidTotal), cls: summary.unpaidTotal > 0 ? "text-amber-700" : "text-vendora-text" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-vendora/10 bg-surface p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-vendora">{c.label}</p>
            <p className={`mt-2 text-2xl font-bold ${c.cls}`}>{loading ? <span className="inline-block h-7 w-24 animate-pulse rounded bg-vendora-bg" /> : c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-2xl border border-vendora/10 bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search); setPage(1); }} className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-vendora-text/40">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by expense number or title..." className="w-full rounded-xl border border-vendora/15 bg-vendora-bg/30 py-2 pl-10 pr-10 text-sm text-vendora-text outline-none focus:border-vendora focus:bg-surface focus:ring-2 focus:ring-vendora-accent/20" />
            {search && (
              <button type="button" onClick={() => { setSearch(""); setAppliedSearch(""); setPage(1); }} className="absolute inset-y-0 right-0 flex items-center pr-3 text-vendora-text/40 hover:text-vendora-text">
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-vendora/10 pt-3 text-xs">
          {[
            { label: "Category:", value: categoryFilter, set: (v) => { setCategoryFilter(v); setPage(1); }, options: [["all", "All"], ...CATEGORIES.map((c) => [c, c])] },
            { label: "Method:", value: methodFilter, set: (v) => { setMethodFilter(v); setPage(1); }, options: [["all", "All"], ...PAYMENT_METHODS.map((m) => [m, m])] },
            { label: "Status:", value: statusFilter, set: (v) => { setStatusFilter(v); setPage(1); }, options: [["all", "All"], ["Paid", "Paid"], ["Unpaid", "Unpaid"]] },
          ].map(({ label, value, set, options }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="font-semibold uppercase tracking-wider text-vendora-text/70">{label}</span>
              <select value={value} onChange={(e) => set(e.target.value)} className="rounded-lg border border-vendora/15 bg-surface px-2.5 py-1.5 text-xs text-vendora-text outline-none">
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}

          <div className="flex items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wider text-vendora-text/70">From:</span>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="rounded-lg border border-vendora/15 bg-surface px-2 py-1 text-xs text-vendora-text outline-none" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wider text-vendora-text/70">To:</span>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="rounded-lg border border-vendora/15 bg-surface px-2 py-1 text-xs text-vendora-text outline-none" />
          </div>

          {hasFilters && (
            <button type="button" onClick={handleReset} className="ml-auto font-medium text-vendora hover:underline">Reset Filters</button>
          )}
        </div>
      </div>

      {/* Table */}
      {errMsg ? (
        <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:bg-red-500/5">
          <AlertTriangleIcon className="h-8 w-8 text-red-600" />
          <h3 className="mt-3 text-base font-semibold text-red-800 dark:text-red-300">Failed to Load Expenses</h3>
          <p className="mt-1 text-sm text-red-600">{errMsg}</p>
          <button type="button" onClick={refresh} className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Retry</button>
        </div>
      ) : loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-vendora/20 bg-surface p-12 text-center shadow-xs">
          <h3 className="text-lg font-semibold text-vendora-text">No Expenses Found</h3>
          <p className="mt-1 text-sm text-vendora-text/70">{hasFilters ? "No expenses match the selected filters." : "Add your first expense to start tracking costs."}</p>
          <div className="mt-6 flex gap-3">
            {hasFilters && <button type="button" onClick={handleReset} className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora hover:bg-vendora-bg">Clear Filters</button>}
            <button type="button" onClick={() => { setEditTarget(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2 text-sm font-medium text-white hover:bg-vendora-dark">
              <PlusIcon className="h-4 w-4" />Add Expense
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-vendora/10 bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-vendora/10 bg-vendora-bg/60 text-xs font-semibold uppercase tracking-wider text-vendora-dark">
                  <th className="px-5 py-3.5">Expense #</th>
                  <th className="px-4 py-3.5">Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5">Payment Method</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vendora/5 text-sm text-vendora-text">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="transition-colors hover:bg-vendora-bg/40">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold bg-vendora-bg px-2.5 py-1 rounded-md border border-vendora/10 text-vendora-dark">{exp.expenseNumber}</span>
                    </td>
                    <td className="px-4 py-4 max-w-[180px]">
                      <div className="font-semibold truncate">{exp.title}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="rounded-full bg-vendora-bg px-2.5 py-0.5 text-xs font-medium text-vendora-dark border border-vendora/10">{exp.category}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right font-bold text-vendora-dark">{fmt(exp.amount)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-vendora-text/80">{exp.paymentMethod}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-vendora-text/80">{fmtDate(exp.expenseDate)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-center"><StatusBadge status={exp.status} /></td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button type="button" onClick={() => { setDetailsTarget(exp); setDetailsOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-vendora/15 text-vendora hover:bg-vendora-bg transition" title="View Details">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => { setEditTarget(exp); setFormOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-vendora/15 text-vendora hover:bg-vendora-bg transition" title="Edit">
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(exp)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-vendora/10 bg-vendora-bg/30 px-5 py-3 text-xs text-vendora-text/80 sm:flex-row sm:items-center sm:justify-between">
            <div>Showing <strong>{expenses.length}</strong> of <strong>{totalCount}</strong> expenses</div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1 || loading} className="rounded-lg border border-vendora/20 bg-surface px-3 py-1.5 font-medium hover:bg-vendora-bg disabled:opacity-40">Previous</button>
                <span className="px-2">Page {page} of {totalPages}</span>
                <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading} className="rounded-lg border border-vendora/20 bg-surface px-3 py-1.5 font-medium hover:bg-vendora-bg disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      <ExpenseFormModal open={formOpen} onClose={() => setFormOpen(false)} onSuccess={handleSaved} initial={editTarget} />
      <ExpenseDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} expense={detailsTarget} onEdit={(e) => { setEditTarget(e); setFormOpen(true); }} />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete expense "${deleteTarget?.expenseNumber}"? This action cannot be undone.`}
        confirmText="Delete Expense"
        loading={deleting}
      />
    </div>
  );
}
