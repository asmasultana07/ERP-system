"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  getProducts,
  deleteProduct,
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
  PackageIcon,
  AlertTriangleIcon,
  CloseIcon,
} from "../../../components/Icons";

// Lazy-loaded: the form modal chunk is fetched only when first opened.
const ProductFormModal = dynamic(
  () => import("../../../components/ProductFormModal"),
  { ssr: false }
);

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Cached, stale-while-revalidate data. Returning to this page with the same
  // filters renders instantly from cache while revalidating in the background.
  const cacheKey = `products:${appliedSearch}|${selectedCategory}`;
  const {
    data: products = [],
    loading,
    error,
    refresh,
    refreshing,
  } = useResource(cacheKey, async () => {
    const data = await getProducts({ search: appliedSearch, category: selectedCategory });
    return data?.products || [];
  });
  const errorMsg = error ? error.message || "Failed to load products" : "";

  function reloadAfterMutation() {
    invalidate("products:");
    invalidate("dashboard");
    refresh();
  }

  // Extract unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(searchQuery);
  }

  function handleCategoryChange(e) {
    setSelectedCategory(e.target.value);
  }

  function handleClearFilters() {
    setSearchQuery("");
    setAppliedSearch("");
    setSelectedCategory("all");
  }

  // Open Add Product Modal
  function handleOpenAdd() {
    setEditingProduct(null);
    setFormModalOpen(true);
  }

  // Open Edit Product Modal
  function handleOpenEdit(product) {
    setEditingProduct(product);
    setFormModalOpen(true);
  }

  // Open Delete Confirmation
  function handleOpenDelete(product) {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  }

  // Confirm Delete
  async function handleConfirmDelete() {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      const res = await deleteProduct(productToDelete.id);
      const fallbackMessage = res?.deactivated
        ? `Product "${productToDelete.name}" was deactivated because it has transaction history.`
        : `Product "${productToDelete.name}" deleted successfully.`;
      setToast({
        type: "success",
        message: res?.message || fallbackMessage,
      });
      setDeleteModalOpen(false);
      setProductToDelete(null);
      reloadAfterMutation();
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || "Failed to delete product.",
      });
    } finally {
      setDeleting(false);
    }
  }

  // After form create / update success
  function handleFormSuccess(savedProduct, isEdit) {
    setToast({
      type: "success",
      message: isEdit
        ? `Product "${savedProduct.name}" updated successfully.`
        : `Product "${savedProduct.name}" added successfully.`,
    });
    reloadAfterMutation();
  }

  // Stock status helper
  function getStockStatus(stock, threshold) {
    const qty = Number(stock) || 0;
    const thresh = Number(threshold) || 0;

    if (qty <= 0) {
      return {
        label: "Out of Stock",
        className: "bg-red-50 text-red-700 border-red-200",
        isLow: true,
      };
    }
    if (qty <= thresh) {
      return {
        label: "Low Stock",
        className: "bg-amber-50 text-amber-800 border-amber-200",
        isLow: true,
      };
    }
    return {
      label: "In Stock",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      isLow: false,
    };
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
            Products
          </h2>
          <p className="mt-1 text-sm text-vendora-text/70">
            Manage your inventory, monitor stock thresholds, and track pricing.
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
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search by product name or SKU..."
            className="w-full rounded-xl border border-vendora/15 bg-vendora-bg/30 py-2 pl-10 pr-10 text-sm text-vendora-text outline-none transition focus:border-vendora focus:bg-surface focus:ring-2 focus:ring-vendora-accent/20"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setAppliedSearch("");
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-vendora-text/40 hover:text-vendora-text"
              aria-label="Clear search"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="category-filter"
              className="text-xs font-semibold uppercase tracking-wider text-vendora-text/70"
            >
              Category:
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="rounded-xl border border-vendora/15 bg-surface px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/20"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedCategory !== "all") && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-medium text-vendora hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
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
            Failed to Load Products
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
        <SkeletonTable rows={6} cols={8} />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-vendora/20 bg-surface p-12 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-vendora-bg text-vendora">
            <PackageIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-vendora-text">
            No Products Found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-vendora-text/70">
            {searchQuery || selectedCategory !== "all"
              ? "No products match your current search or category filter."
              : "Get started by adding your first product to the inventory."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {searchQuery || selectedCategory !== "all" ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora transition hover:bg-vendora-bg"
              >
                Clear Filters
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-vendora px-4 py-2 text-sm font-medium text-white transition hover:bg-vendora-dark"
            >
              <PlusIcon className="h-4 w-4" />
              Add Product
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
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    SKU
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Cost Price
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Selling Price
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Stock
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
                {products.map((product) => {
                  const stockStatus = getStockStatus(
                    product.stockQuantity,
                    product.lowStockThreshold
                  );

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-vendora-bg/40"
                    >
                      {/* Name & Description */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-vendora-text">
                          {product.name}
                        </div>
                        {product.description ? (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-vendora-text/60">
                            {product.description}
                          </div>
                        ) : null}
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-vendora-bg px-2 py-1 font-mono text-xs font-semibold text-vendora-dark border border-vendora/10">
                          {product.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {product.category ? (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-xs text-vendora-text/40">—</span>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-4 whitespace-nowrap text-right font-medium text-vendora-text/80">
                        ${Number(product.costPrice || 0).toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-4 whitespace-nowrap text-right font-semibold text-vendora-dark">
                        ${Number(product.sellingPrice || 0).toFixed(2)}
                      </td>

                      {/* Stock & Low-stock indicator */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium text-vendora-text">
                            {product.stockQuantity ?? 0}{" "}
                            <span className="text-xs text-vendora-text/60">
                              {product.unit || "pcs"}
                            </span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${stockStatus.className}`}
                          >
                            {stockStatus.isLow && (
                              <AlertTriangleIcon className="h-3 w-3 shrink-0" />
                            )}
                            {stockStatus.label}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            product.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-vendora/15 text-vendora hover:bg-vendora-bg transition"
                            title="Edit Product"
                            aria-label={`Edit ${product.name}`}
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(product)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                            title="Delete Product"
                            aria-label={`Delete ${product.name}`}
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
              Showing <strong className="font-semibold text-vendora-text">{products.length}</strong> {products.length === 1 ? "product" : "products"}
            </span>
            <span className="font-medium text-vendora">
              VENDORA Inventory
            </span>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal (lazy: chunk loads on first open) */}
      {formModalOpen && (
        <ProductFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          product={editingProduct}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}" (${productToDelete?.sku})? If this product appears in any purchase or sale history, it will be deactivated instead of permanently removed to protect your records.`}
        confirmText="Delete Product"
        loading={deleting}
      />
    </div>
  );
}
