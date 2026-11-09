"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { getSales, getCustomers, cancelSale } from "../../../lib/api";
import { useResource, invalidate } from "../../../lib/useResource";
import ConfirmModal from "../../../components/ConfirmModal";
import Toast from "../../../components/Toast";
import { SkeletonTable } from "../../../components/Skeleton";

const CreateSaleModal = dynamic(() => import("../../../components/CreateSaleModal"), { ssr: false });
const SaleDetailsModal = dynamic(() => import("../../../components/SaleDetailsModal"), { ssr: false });
import {
  SearchIcon,
  PlusIcon,
  ReceiptIcon,
  EyeIcon,
  BanIcon,
  CloseIcon,
  AlertTriangleIcon,
} from "../../../components/Icons";

export default function SalesPage() {
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Customers for the filter dropdown (shares cache with the Customers module).
  const customersRes = useResource("customers:", async () => {
    const res = await getCustomers();
    return res?.customers || [];
  });
  const customers = customersRes.data || [];

  // Cached list keyed by page + all applied filters → instant paging/revisits.
  const cacheKey = `sales:${page}|${appliedSearch}|${customerFilter}|${paymentStatusFilter}|${statusFilter}|${startDate}|${endDate}`;
  const { data, loading, error, refresh, refreshing } = useResource(cacheKey, () =>
    getSales({
      page,
      limit: 10,
      search: appliedSearch,
      customer: customerFilter,
      paymentStatus: paymentStatusFilter,
      status: statusFilter,
      startDate,
      endDate,
    })
  );
  const sales = data?.sales || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.total || 0;
  const errMsg = error ? error.message || "Failed to load sales" : "";

  function reloadAfterMutation() {
    invalidate("sales:");
    invalidate("dashboard");
    refresh();
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(searchQuery);
    setPage(1);
  }

  function handleResetFilters() {
    setSearchQuery("");
    setAppliedSearch("");
    setCustomerFilter("all");
    setPaymentStatusFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function handleViewDetails(sale) {
    setSelectedSale(sale);
    setDetailsModalOpen(true);
  }

  function handleRequestCancel(sale) {
    setSaleToCancel(sale);
    setCancelModalOpen(true);
  }

  async function handleConfirmCancel() {
    if (!saleToCancel) return;

    setCancelling(true);
    try {
      const res = await cancelSale(saleToCancel.id);
      if (res?.success) {
        setToast({
          type: "success",
          message: `Sale "${saleToCancel.invoiceNumber}" cancelled and stock restored to inventory.`,
        });
        setCancelModalOpen(false);
        setSaleToCancel(null);
        reloadAfterMutation();
      } else {
        setToast({
          type: "error",
          message: res?.message || "Failed to cancel sale.",
        });
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Failed to cancel sale.",
      });
    } finally {
      setCancelling(false);
    }
  }

  function handleSaleCreated(newSale) {
    setToast({
      type: "success",
      message: `Invoice "${newSale.invoiceNumber}" generated and inventory updated.`,
    });
    setPage(1);
    reloadAfterMutation();
  }

  const hasActiveFilters =
    Boolean(searchQuery) ||
    customerFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    statusFilter !== "all" ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="space-y-6">
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vendora-text">
            Sales & Invoicing
          </h2>
          <p className="mt-1 text-sm text-vendora-text/70">
            Generate customer invoices, track walk-in sales, and oversee revenue balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-vendora-dark focus:outline-none focus:ring-2 focus:ring-vendora-accent"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 rounded-2xl border border-vendora/10 bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search by Invoice # or Customer */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-vendora-text/40">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number (INV-...) or customer name..."
              className="w-full rounded-xl border border-vendora/15 bg-vendora-bg/30 py-2 pl-10 pr-10 text-sm text-vendora-text outline-none transition focus:border-vendora focus:bg-surface focus:ring-2 focus:ring-vendora-accent/20"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setAppliedSearch("");
                  setPage(1);
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-vendora-text/40 hover:text-vendora-text"
                aria-label="Clear search"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            ) : null}
          </form>

          {/* Customer Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-customer"
              className="text-xs font-semibold uppercase tracking-wider text-vendora-text/70"
            >
              Customer:
            </label>
            <select
              id="filter-customer"
              value={customerFilter}
              onChange={(e) => {
                const val = e.target.value;
                setCustomerFilter(val);
                setPage(1);
              }}
              className="rounded-xl border border-vendora/15 bg-surface px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/20"
            >
              <option value="all">All Customers</option>
              <option value="walk-in">Walk-in Customers Only</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Payment, Status, Date Range */}
        <div className="flex flex-wrap items-center gap-3 border-t border-vendora/10 pt-3 text-xs">
          {/* Payment Status */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wider text-vendora-text/70">
              Payment:
            </span>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setPaymentStatusFilter(val);
                setPage(1);
              }}
              className="rounded-lg border border-vendora/15 bg-surface px-2.5 py-1.5 text-xs text-vendora-text outline-none"
            >
              <option value="all">All</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Order Status */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wider text-vendora-text/70">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                setPage(1);
              }}
              className="rounded-lg border border-vendora/15 bg-surface px-2.5 py-1.5 text-xs text-vendora-text outline-none"
            >
              <option value="all">All</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wider text-vendora-text/70">
              From:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const val = e.target.value;
                setStartDate(val);
                setPage(1);
              }}
              className="rounded-lg border border-vendora/15 bg-surface px-2 py-1 text-xs text-vendora-text outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold uppercase tracking-wider text-vendora-text/70">
              To:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                const val = e.target.value;
                setEndDate(val);
                setPage(1);
              }}
              className="rounded-lg border border-vendora/15 bg-surface px-2 py-1 text-xs text-vendora-text outline-none"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto font-medium text-vendora hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {errMsg ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:bg-red-500/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-red-800 dark:text-red-300">
            Failed to Load Sales
          </h3>
          <p className="mt-1 max-w-md text-sm text-red-600">{errMsg}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <RefreshIcon className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-vendora/20 bg-surface p-12 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-vendora-bg text-vendora">
            <ReceiptIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-vendora-text">
            No Sales Invoices Found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-vendora-text/70">
            {hasActiveFilters
              ? "No sales records match the selected filters."
              : "Generate your first customer sale or walk-in transaction to record revenue."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora transition hover:bg-vendora-bg"
              >
                Clear Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2 text-sm font-medium text-white transition hover:bg-vendora-dark"
            >
              <PlusIcon className="h-4 w-4" />
              New Sale
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-vendora/10 bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-vendora/10 bg-vendora-bg/60 text-xs font-semibold uppercase tracking-wider text-vendora-dark">
                  <th scope="col" className="px-5 py-3.5">
                    Invoice #
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Paid
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Due
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Payment
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vendora/5 text-sm text-vendora-text">
                {sales.map((sale) => {
                  const isCancelled = sale.status === "Cancelled";

                  return (
                    <tr
                      key={sale.id}
                      className="transition-colors hover:bg-vendora-bg/40"
                    >
                      {/* Invoice # */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-xs text-vendora-dark bg-vendora-bg px-2.5 py-1 rounded-md border border-vendora/10">
                          {sale.invoiceNumber}
                        </span>
                        <div className="mt-1 text-[11px] text-vendora-text/60">
                          {sale.items?.length || 0} {sale.items?.length === 1 ? "item" : "items"}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-semibold text-vendora-text">
                          {sale.customerName || (sale.customer ? sale.customer.name : "Walk-in Customer")}
                        </div>
                        <div className="text-xs text-vendora-text/60">
                          {sale.customer ? "Registered" : "Walk-in Buyer"}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-vendora-text/80">
                        {new Date(sale.saleDate || sale.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-4 whitespace-nowrap text-right font-bold text-vendora-dark">
                        ${Number(sale.totalAmount || 0).toFixed(2)}
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-4 whitespace-nowrap text-right font-medium text-emerald-700">
                        ${Number(sale.paidAmount || 0).toFixed(2)}
                      </td>

                      {/* Due */}
                      <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                        <span
                          className={
                            sale.dueAmount > 0
                              ? "text-amber-800 font-semibold"
                              : "text-vendora-text/70"
                          }
                        >
                          ${Number(sale.dueAmount || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            sale.paymentStatus === "Paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : sale.paymentStatus === "Partial"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>

                      {/* Order Status */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isCancelled
                              ? "bg-gray-100 text-gray-600 border border-gray-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(sale)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-vendora/15 text-vendora hover:bg-vendora-bg transition"
                            title="View Invoice Details"
                            aria-label={`View details for ${sale.invoiceNumber}`}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleRequestCancel(sale)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                              title="Cancel Sale & Restore Stock"
                              aria-label={`Cancel sale ${sale.invoiceNumber}`}
                            >
                              <BanIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex flex-col gap-3 border-t border-vendora/10 bg-vendora-bg/30 px-5 py-3 text-xs text-vendora-text/80 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing <strong className="font-semibold text-vendora-text">{sales.length}</strong> of{" "}
              <strong className="font-semibold text-vendora-text">{totalCount}</strong> recorded invoices
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-lg border border-vendora/20 bg-surface px-3 py-1.5 font-medium transition hover:bg-vendora-bg disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-lg border border-vendora/20 bg-surface px-3 py-1.5 font-medium transition hover:bg-vendora-bg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Sale Modal (lazy) */}
      {createModalOpen && (
        <CreateSaleModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleSaleCreated}
        />
      )}

      {/* Sale Details Modal (lazy) */}
      {detailsModalOpen && (
        <SaleDetailsModal
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          sale={selectedSale}
          onCancelRequest={(s) => handleRequestCancel(s)}
        />
      )}

      {/* Confirm Cancellation Modal */}
      <ConfirmModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Sales Invoice"
        message={`Are you sure you want to cancel invoice "${saleToCancel?.invoiceNumber}"? This will automatically restore the sold quantities back to current product inventory. This action cannot be reversed.`}
        confirmText="Cancel Invoice & Restore Stock"
        loading={cancelling}
      />
    </div>
  );
}
