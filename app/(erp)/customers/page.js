"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { getCustomers, deleteCustomer } from "../../../lib/api";
import { useResource, invalidate } from "../../../lib/useResource";
import ConfirmModal from "../../../components/ConfirmModal";
import Toast from "../../../components/Toast";
import { SkeletonTable } from "../../../components/Skeleton";
import {
  SearchIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  AlertTriangleIcon,
  CloseIcon,
} from "../../../components/Icons";

const CustomerFormModal = dynamic(
  () => import("../../../components/CustomerFormModal"),
  { ssr: false }
);

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState({ message: "", type: "success" });

  const cacheKey = `customers:${appliedSearch}`;
  const {
    data: customers = [],
    loading,
    error,
    refresh,
    refreshing,
  } = useResource(cacheKey, async () => {
    const data = await getCustomers({ search: appliedSearch });
    return data?.customers || [];
  });
  const errorMsg = error ? error.message || "Failed to load customers" : "";

  function reloadAfterMutation() {
    invalidate("customers:");
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

  function handleOpenAdd() {
    setEditingCustomer(null);
    setFormModalOpen(true);
  }

  function handleOpenEdit(customer) {
    setEditingCustomer(customer);
    setFormModalOpen(true);
  }

  function handleOpenDelete(customer) {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  }

  async function handleConfirmDelete() {
    if (!customerToDelete) return;

    setDeleting(true);
    try {
      const res = await deleteCustomer(customerToDelete.id);
      setToast({
        type: "success",
        message:
          res?.message ||
          `Customer "${customerToDelete.name}" processed successfully.`,
      });
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
      reloadAfterMutation();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Failed to delete customer.",
      });
    } finally {
      setDeleting(false);
    }
  }

  function handleFormSuccess(savedCustomer, isEdit) {
    setToast({
      type: "success",
      message: isEdit
        ? `Customer "${savedCustomer.name}" updated successfully.`
        : `Customer "${savedCustomer.name}" registered successfully.`,
    });
    reloadAfterMutation();
  }

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
            Customers
          </h2>
          <p className="mt-1 text-sm text-vendora-text/70">
            Maintain your buyer accounts, distribution partners, and client credit balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-vendora-dark focus:outline-none focus:ring-2 focus:ring-vendora-accent"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-vendora/10 bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-vendora-text/40">
            <SearchIcon className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search customers by name, phone or email..."
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
            Failed to Load Customers
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
        <SkeletonTable rows={6} cols={6} />
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-vendora/20 bg-surface p-12 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-vendora-bg text-vendora">
            <BuildingIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-vendora-text">
            No Customers Found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-vendora-text/70">
            {searchQuery
              ? `No customers matched "${searchQuery}". Try a different keyword.`
              : "Register your customer accounts to track buyer history and manage sales invoicing."}
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
              Add Customer
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
                    Customer Name
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
                {customers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="transition-colors hover:bg-vendora-bg/40"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-vendora-text">
                        {cust.name}
                      </div>
                      {cust.notes ? (
                        <div className="mt-0.5 max-w-xs truncate text-xs text-vendora-text/60">
                          {cust.notes}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {cust.phone ? (
                        <a
                          href={`tel:${cust.phone}`}
                          className="inline-flex items-center gap-1.5 text-sm text-vendora hover:underline"
                        >
                          <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-vendora/70" />
                          <span>{cust.phone}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-vendora-text/40">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {cust.email ? (
                        <a
                          href={`mailto:${cust.email}`}
                          className="inline-flex items-center gap-1.5 text-sm text-vendora hover:underline"
                        >
                          <MailIcon className="h-3.5 w-3.5 shrink-0 text-vendora/70" />
                          <span>{cust.email}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-vendora-text/40">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {cust.address ? (
                        <div className="flex items-start gap-1 text-xs text-vendora-text/80 max-w-xs">
                          <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-vendora/70 mt-0.5" />
                          <span className="line-clamp-2">{cust.address}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-vendora-text/40">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          cust.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {cust.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cust)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-vendora/15 text-vendora hover:bg-vendora-bg transition"
                          title="Edit Customer"
                          aria-label={`Edit ${cust.name}`}
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(cust)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                          title="Delete Customer"
                          aria-label={`Delete ${cust.name}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-vendora/10 bg-vendora-bg/30 px-5 py-3 text-xs text-vendora-text/70">
            <span>
              Showing <strong className="font-semibold text-vendora-text">{customers.length}</strong> {customers.length === 1 ? "customer" : "customers"}
            </span>
            <span className="font-medium text-vendora">VENDORA CRM</span>
          </div>
        </div>
      )}

      {/* Customer Form Modal (lazy: chunk loads on first open) */}
      {formModalOpen && (
        <CustomerFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          customer={editingCustomer}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Confirm Delete / Deactivate Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customerToDelete?.name}"? If this customer has sales history, they will be deactivated to preserve invoice records.`}
        confirmText="Confirm Delete"
        loading={deleting}
      />
    </div>
  );
}
