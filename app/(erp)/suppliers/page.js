"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getSuppliers,
  deleteSupplier,
} from "../../../lib/api";
import SupplierFormModal from "../../../components/SupplierFormModal";
import ConfirmModal from "../../../components/ConfirmModal";
import Toast from "../../../components/Toast";
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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState({ message: "", type: "success" });

  const loadSuppliers = useCallback(async (search = searchQuery) => {
    setLoading(true);
    setError("");

    try {
      const data = await getSuppliers({ search });
      if (data?.success) {
        setSuppliers(data.suppliers || []);
      } else {
        setError(data?.message || "Failed to load suppliers");
      }
    } catch (err) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchQuery(val);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadSuppliers(searchQuery);
  }

  function handleClearSearch() {
    setSearchQuery("");
    loadSuppliers("");
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
      await deleteSupplier(supplierToDelete.id);
      setToast({
        type: "success",
        message: `Supplier "${supplierToDelete.name}" deleted successfully.`,
      });
      setDeleteModalOpen(false);
      setSupplierToDelete(null);
      loadSuppliers();
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
    loadSuppliers();
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
            onClick={() => loadSuppliers()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-vendora/20 bg-white px-3.5 py-2.5 text-sm font-medium text-vendora-text transition hover:bg-vendora-bg focus:outline-none focus:ring-2 focus:ring-vendora disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
      <div className="flex flex-col gap-3 rounded-2xl border border-vendora/10 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
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
            className="w-full rounded-xl border border-vendora/15 bg-vendora-bg/30 py-2 pl-10 pr-10 text-sm text-vendora-text outline-none transition focus:border-vendora focus:bg-white focus:ring-2 focus:ring-vendora-accent/20"
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
      {error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-red-800">
            Failed to Load Suppliers
          </h3>
          <p className="mt-1 max-w-md text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => loadSuppliers()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <RefreshIcon className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : loading && suppliers.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-vendora/10 bg-white shadow-xs">
          <div className="p-8 text-center">
            <div className="inline-flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-vendora/20 border-t-vendora"></div>
            <p className="mt-4 text-sm font-medium text-vendora-text/80">
              Loading suppliers...
            </p>
          </div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-vendora/20 bg-white p-12 text-center shadow-xs">
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
        <div className="overflow-hidden rounded-2xl border border-vendora/10 bg-white shadow-xs">
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

      {/* Add / Edit Supplier Modal */}
      <SupplierFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        supplier={editingSupplier}
        onSuccess={handleFormSuccess}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${supplierToDelete?.name}"? All associated supplier contact records will be removed.`}
        confirmText="Delete Supplier"
        loading={deleting}
      />
    </div>
  );
}
