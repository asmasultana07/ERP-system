"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  getPurchases,
  getSuppliers,
  cancelPurchase,
} from "../../../lib/api";
import { useResource, invalidate } from "../../../lib/useResource";
import ConfirmModal from "../../../components/ConfirmModal";
import Toast from "../../../components/Toast";
import { SkeletonTable } from "../../../components/Skeleton";

const CreatePurchaseModal = dynamic(() => import("../../../components/CreatePurchaseModal"), { ssr: false });
const PurchaseDetailsModal = dynamic(() => import("../../../components/PurchaseDetailsModal"), { ssr: false });
const EditPurchaseModal = dynamic(() => import("../../../components/EditPurchaseModal"), { ssr: false });
import {
  SearchIcon,
  PlusIcon,
  ReceiptIcon,
  EyeIcon,
  EditIcon,
  BanIcon,
  CloseIcon,
  AlertTriangleIcon,
} from "../../../components/Icons";

export default function PurchasesPage() {
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [purchaseToCancel, setPurchaseToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Suppliers for the filter dropdown (shares cache with the Suppliers module).
  const suppliersRes = useResource("suppliers:", async () => {
    const res = await getSuppliers();
    return res?.suppliers || [];
  });
  const suppliers = suppliersRes.data || [];

  // Cached list keyed by page + all applied filters → instant paging/revisits.
  const cacheKey = `purchases:${page}|${appliedSearch}|${supplierFilter}|${paymentStatusFilter}|${statusFilter}|${startDate}|${endDate}`;
  const { data, loading, error, refresh, refreshing } = useResource(cacheKey, () =>
    getPurchases({
      page,
      limit: 10,
      search: appliedSearch,
      supplier: supplierFilter,
      paymentStatus: paymentStatusFilter,
      status: statusFilter,
      startDate,
      endDate,
    })
  );
  const purchases = data?.purchases || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.total || 0;
  const errMsg = error ? error.message || "Failed to load purchases" : "";

  function reloadAfterMutation() {
    invalidate("purchases:");
    invalidate("dashboard");
    refresh();
  }

  // Handle Search & Filter Changes
  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(searchQuery);
    setPage(1);
  }

  function handleResetFilters() {
    setSearchQuery("");
    setAppliedSearch("");
    setSupplierFilter("all");
    setPaymentStatusFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  // Handle Purchase View Details
  function handleViewDetails(purchase) {
    setSelectedPurchase(purchase);
    setDetailsModalOpen(true);
  }

  // Handle Edit Purchase
  function handleEditPurchase(purchase) {
    setPurchaseToEdit(purchase);
    setEditModalOpen(true);
  }

  function handlePurchaseUpdated(updatedPurchase) {
    setToast({
      type: "success",
      message: `Purchase "${updatedPurchase.purchaseNumber}" updated successfully.`,
    });
    reloadAfterMutation();
  }

  // Handle Cancel Request
  function handleRequestCancel(purchase) {
    setPurchaseToCancel(purchase);
    setCancelModalOpen(true);
  }

  async function handleConfirmCancel() {
    if (!purchaseToCancel) return;

    setCancelling(true);
    try {
      const res = await cancelPurchase(purchaseToCancel.id);
      if (res?.success) {
        setToast({
          type: "success",
          message: `Purchase "${purchaseToCancel.purchaseNumber}" cancelled and stock reversed.`,
        });
        setCancelModalOpen(false);
        setPurchaseToCancel(null);
        reloadAfterMutation();
      } else {
        setToast({
          type: "error",
          message: res?.message || "Failed to cancel purchase.",
        });
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Failed to cancel purchase.",
      });
    } finally {
      setCancelling(false);
    }
  }

  function handlePurchaseCreated(newPurchase) {
    setToast({
      type: "success",
      message: `Purchase "${newPurchase.purchaseNumber}" recorded successfully.`,
    });
    setPage(1);
    reloadAfterMutation();
  }

  const hasActiveFilters =
    Boolean(searchQuery) ||
    supplierFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    statusFilter !== "all" ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      {/* Header & Main Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vendora-text">
            Purchases & Inventory Restock
          </h2>
          <p className="mt-1 text-sm text-vendora-text/70">
            Track vendor purchase orders, receive inventory stock, and oversee payment balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-vendora-dark focus:outline-none focus:ring-2 focus:ring-vendora-accent"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 rounded-2xl border border-vendora/10 bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search by Purchase Number */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-vendora-text/40">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by purchase number (e.g. PUR-20261107-0001)..."
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

          {/* Supplier Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="filter-supplier"
              className="text-xs font-semibold uppercase tracking-wider text-vendora-text/70"
            >
              Supplier:
            </label>
            <select
              id="filter-supplier"
              value={supplierFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSupplierFilter(val);
                setPage(1);
              }}
              className="rounded-xl border border-vendora/15 bg-surface px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/20"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Payment status, Status, Date Range */}
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

          {/* Status */}
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

      {/* Purchases Content Table */}
      {errMsg ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:bg-red-500/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-red-800 dark:text-red-300">
            Failed to Load Purchases
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
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-vendora/20 bg-surface p-12 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-vendora-bg text-vendora">
            <ReceiptIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-vendora-text">
            No Purchases Found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-vendora-text/70">
            {hasActiveFilters
              ? "No purchase orders match your specified filters."
              : "Record your first wholesale purchase order to replenish stock."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora transition hover:bg-vendora-bg"
              >
                Clear Filters
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2 text-sm font-medium text-white transition hover:bg-vendora-dark"
            >
              <PlusIcon className="h-4 w-4" />
              New Purchase
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
                    Purchase #
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Supplier
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
                {purchases.map((purchase) => {
                  const isCancelled = purchase.status === "Cancelled";

                  return (
                    <tr
                      key={purchase.id}
                      className="transition-colors hover:bg-vendora-bg/40"
                    >
                      {/* Purchase Number */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-xs text-vendora-dark bg-vendora-bg px-2.5 py-1 rounded-md border border-vendora/10">
                          {purchase.purchaseNumber}
                        </span>
                        <div className="mt-1 text-[11px] text-vendora-text/60">
                          {purchase.items?.length || 0} {purchase.items?.length === 1 ? "item" : "items"}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-semibold text-vendora-text">
                          {purchase.supplier?.name || "Unknown Supplier"}
                        </div>
                        {purchase.supplier?.contactPerson && (
                          <div className="text-xs text-vendora-text/60">
                            {purchase.supplier.contactPerson}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-vendora-text/80">
                        {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-4 whitespace-nowrap text-right font-bold text-vendora-dark">
                        ${Number(purchase.totalAmount || 0).toFixed(2)}
                      </td>

                      {/* Paid Amount */}
                      <td className="px-4 py-4 whitespace-nowrap text-right font-medium text-emerald-700">
                        ${Number(purchase.paidAmount || 0).toFixed(2)}
                      </td>

                      {/* Due Amount */}
                      <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                        <span
                          className={
                            purchase.dueAmount > 0
                              ? "text-amber-800 font-semibold"
                              : "text-vendora-text/70"
                          }
                        >
                          ${Number(purchase.dueAmount || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            purchase.paymentStatus === "Paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : purchase.paymentStatus === "Partial"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {purchase.paymentStatus}
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
                          {purchase.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(purchase)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-vendora/15 text-vendora hover:bg-vendora-bg transition"
                            title="View Purchase Details"
                            aria-label={`View details for ${purchase.purchaseNumber}`}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleEditPurchase(purchase)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-vendora/15 text-vendora-text hover:bg-vendora-bg transition"
                              title="Edit Purchase"
                              aria-label={`Edit purchase ${purchase.purchaseNumber}`}
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleRequestCancel(purchase)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                              title="Cancel Purchase & Reverse Stock"
                              aria-label={`Cancel purchase ${purchase.purchaseNumber}`}
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
              Showing <strong className="font-semibold text-vendora-text">{purchases.length}</strong> of{" "}
              <strong className="font-semibold text-vendora-text">{totalCount}</strong> recorded purchases
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

      {/* Record Purchase Modal (lazy) */}
      {createModalOpen && (
        <CreatePurchaseModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handlePurchaseCreated}
        />
      )}

      {/* Purchase Details Modal (lazy) */}
      {detailsModalOpen && (
        <PurchaseDetailsModal
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          purchase={selectedPurchase}
          onCancelRequest={(p) => handleRequestCancel(p)}
        />
      )}

      {/* Edit Purchase Modal (lazy) */}
      {editModalOpen && (
        <EditPurchaseModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          purchase={purchaseToEdit}
          onSuccess={handlePurchaseUpdated}
        />
      )}

      {/* Confirm Cancellation Modal */}
      <ConfirmModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Purchase Order"
        message={`Are you sure you want to cancel purchase order "${purchaseToCancel?.purchaseNumber}"? This will automatically deduct the received quantities from current product inventory. This action cannot be reversed.`}
        confirmText="Cancel Order & Deduct Stock"
        loading={cancelling}
      />
    </div>
  );
}
