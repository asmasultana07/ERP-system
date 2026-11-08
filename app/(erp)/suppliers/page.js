"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  getSuppliers,
  deleteSupplier,
} from "../../../lib/api";
import { useResource, invalidate } from "../../../lib/useResource";
import ConfirmModal from "../../../components/ConfirmModal";
import Toast from "../../../components/Toast";
import { SkeletonTable } from "../../../components/Skeleton";
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  RefreshIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  AlertTriangleIcon,
  CloseIcon,
} from "../../../components/Icons";

const SupplierFormModal = dynamic(
  () => import("../../../components/SupplierFormModal"),
  { ssr: false }
);

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState({ message: "", type: "success" });

  const cacheKey = `suppliers:${appliedSearch}`;
  const {
    data: suppliers = [],
    loading,
    error,
    refresh,
    refreshing,
  } = useResource(cacheKey, async () => {
    const data = await getSuppliers({ search: appliedSearch });
    return data?.suppliers || [];
  });
  const errorMsg = error ? error.message || "Failed to load suppliers" : "";

  function reloadAfterMutation() {
    invalidate("suppliers:");
    invalidate("dashboard");
    refresh();
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(searchQuery);
  }

  function handleClearSearch() {
    setSearchQuery("");
    setAppliedSearch("");
  }

  // Open Add Supplier Modal
  function handleOpenAdd() {
    setEditingSupplier(null);
    setFormModalOpen(true);
  }

  // Open Edit Supplier Modal
  function handleOpenEdit(supplier) {
    setEditingSupplier(supplier);
    setFormModalOpen(true);
  }

  // Open Delete Confirmation
  function handleOpenDelete(supplier) {
    setSupplierToDelete(supplier);
    setDeleteModalOpen(true);
  }

  // Confirm Delete
  async function handleConfirmDelete() {
    if (!supplierToDelete) return;

    setDeleting(true);
    try {
      const res = await deleteSupplier(supplierToDelete.id);
      const fallbackMessage = res?.deactivated
        ? `Supplier "${supplierToDelete.name}" was deactivated because it has purchase history.`
        : `Supplier "${supplierToDelete.name}" deleted successfully.`;
      setToast({
        type: "success",
        message: res?.message || fallbackMessage,
      });
      setDeleteModalOpen(false);
      setSupplierToDelete(null);
      reloadAfterMutation();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Failed to delete supplier.",
      });
    } finally {
      setDeleting(false);
    }
  }

  // Form submit success callback
  function handleFormSuccess(savedSupplier, isEdit) {
    setToast({
      type: "success",
      message: isEdit
        ? `Supplier "${savedSupplier.name}" updated successfully.`
        : `Supplier "${savedSupplier.name}" registered successfully.`,
    });
    reloadAfterMutation();
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vendora-text">
            Suppliers
          </h2>
          <p className="mt-1 text-sm text-vendora-text/70">
            Maintain your vendor directory, contact details, and partnership records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-vendora/20 bg-surface px-3.5 py-2.5 text-sm font-medium text-vendora-text transition hover:bg-vendora-bg focus:outline-none focus:ring-2 focus:ring-vendora disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-vendora-dark focus:outline-none focus:ring-2 focus:ring-vendora-accent"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-vendora/10 bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-vendora-text/40">
            <SearchIcon className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search suppliers by name, phone or email..."
            className="w-full rounded-xl border border-vendora/15 bg-vendora-bg/30 py-2 pl-10 pr-10 text-sm text-vendora-text outline-none transition focus:border-vendora focus:bg-surface focus:ring-2 focus:ring-vendora-accent/20"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-vendora-text/40 hover:text-vendora-text"
              aria-label="Clear search"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </form>

        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-xs font-medium text-vendora hover:underline"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {errorMsg ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:bg-red-500/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-red-800 dark:text-red-300">
            Failed to Load Suppliers
          </h3>
          <p className="mt-1 max-w-md text-sm text-red-600">{errorMsg}</p>
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
        <SkeletonTable rows={6} cols={7} />
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-vendora/20 bg-surface p-12 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-vendora-bg text-vendora">
            <BuildingIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-vendora-text">
            No Suppliers Found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-vendora-text/70">
            {searchQuery
              ? `No suppliers matched "${searchQuery}". Try a different keyword.`
              : "Keep all your vendor contacts organized by adding your first supplier."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora transition hover:bg-vendora-bg"
              >
                Clear Search
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2 text-sm font-medium text-white transition hover:bg-vendora-dark"
            >
              <PlusIcon className="h-4 w-4" />
              Add Supplier
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
                    Supplier Name
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Contact Person
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Phone
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Address
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
                {suppliers.map((supplier) => {
                  return (
                    <tr
                      key={supplier.id}
                      className="transition-colors hover:bg-vendora-bg/40"
                    >
                      {/* Name & Notes */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-vendora-text">
                          {supplier.name}
                        </div>
                        {supplier.notes ? (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-vendora-text/60">
                            {supplier.notes}
                          </div>
                        ) : null}
                      </td>

                      {/* Contact Person */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {supplier.contactPerson ? (
                          <span className="font-medium text-vendora-text">
                            {supplier.contactPerson}
                          </span>
                        ) : (
                          <span className="text-xs text-vendora-text/40">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {supplier.phone ? (
                          <a
                            href={`tel:${supplier.phone}`}
                            className="inline-flex items-center gap-1.5 text-sm text-vendora hover:underline"
                          >
                            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-vendora/70" />
                            <span>{supplier.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-vendora-text/40">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {supplier.email ? (
                          <a
                            href={`mailto:${supplier.email}`}
                            className="inline-flex items-center gap-1.5 text-sm text-vendora hover:underline"
                          >
                            <MailIcon className="h-3.5 w-3.5 shrink-0 text-vendora/70" />
                            <span>{supplier.email}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-vendora-text/40">—</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="px-4 py-4">
                        {supplier.address ? (
                          <div className="flex items-start gap-1 text-xs text-vendora-text/80 max-w-xs">
                            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-vendora/70 mt-0.5" />
                            <span className="line-clamp-2">{supplier.address}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-vendora-text/40">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            supplier.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {supplier.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(supplier)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-vendora/15 text-vendora hover:bg-vendora-bg transition"
                            title="Edit Supplier"
                            aria-label={`Edit ${supplier.name}`}
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(supplier)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                            title="Delete Supplier"
                            aria-label={`Delete ${supplier.name}`}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="flex items-center justify-between border-t border-vendora/10 bg-vendora-bg/30 px-5 py-3 text-xs text-vendora-text/70">
            <span>
              Showing <strong className="font-semibold text-vendora-text">{suppliers.length}</strong> {suppliers.length === 1 ? "supplier" : "suppliers"}
            </span>
            <span className="font-medium text-vendora">
              VENDORA Directory
            </span>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal (lazy: chunk loads on first open) */}
      {formModalOpen && (
        <SupplierFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          supplier={editingSupplier}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${supplierToDelete?.name}"? If this supplier appears in any purchase history, it will be deactivated instead of permanently removed to protect your records.`}
        confirmText="Delete Supplier"
        loading={deleting}
      />
    </div>
  );
}
