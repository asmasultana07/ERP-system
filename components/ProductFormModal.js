"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { createProduct, updateProduct } from "../lib/api";

const COMMON_UNITS = ["pcs", "kg", "g", "box", "carton", "pack", "liter", "meter"];

export default function ProductFormModal({
  open,
  onClose,
  product = null,
  onSuccess,
}) {
  const isEdit = Boolean(product);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    costPrice: "",
    sellingPrice: "",
    stockQuantity: "0",
    lowStockThreshold: "5",
    unit: "pcs",
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        category: product.category || "",
        description: product.description || "",
        costPrice: product.costPrice !== undefined ? String(product.costPrice) : "",
        sellingPrice: product.sellingPrice !== undefined ? String(product.sellingPrice) : "",
        stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : "0",
        lowStockThreshold: product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : "5",
        unit: product.unit || "pcs",
        isActive: product.isActive !== undefined ? product.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        category: "",
        description: "",
        costPrice: "",
        sellingPrice: "",
        stockQuantity: "0",
        lowStockThreshold: "5",
        unit: "pcs",
        isActive: true,
      });
    }
    setErrors({});
    setFormError("");
  }, [product, open]);

  function handleChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "sku" ? value.toUpperCase() : value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate() {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = "Product name is required";
    }

    if (!formData.sku.trim()) {
      errs.sku = "SKU is required";
    }

    if (formData.costPrice === "" || formData.costPrice === undefined) {
      errs.costPrice = "Cost price is required";
    } else {
      const num = Number(formData.costPrice);
      if (isNaN(num) || num < 0) {
        errs.costPrice = "Cost price must be a non-negative number";
      }
    }

    if (formData.sellingPrice === "" || formData.sellingPrice === undefined) {
      errs.sellingPrice = "Selling price is required";
    } else {
      const num = Number(formData.sellingPrice);
      if (isNaN(num) || num < 0) {
        errs.sellingPrice = "Selling price must be a non-negative number";
      }
    }

    if (formData.stockQuantity !== "") {
      const num = Number(formData.stockQuantity);
      if (isNaN(num) || num < 0) {
        errs.stockQuantity = "Stock quantity must be a non-negative number";
      }
    }

    if (formData.lowStockThreshold !== "") {
      const num = Number(formData.lowStockThreshold);
      if (isNaN(num) || num < 0) {
        errs.lowStockThreshold = "Threshold must be a non-negative number";
      }
    }

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      costPrice: Number(formData.costPrice),
      sellingPrice: Number(formData.sellingPrice),
      stockQuantity: formData.stockQuantity === "" ? 0 : Number(formData.stockQuantity),
      lowStockThreshold: formData.lowStockThreshold === "" ? 5 : Number(formData.lowStockThreshold),
      unit: formData.unit.trim() || "pcs",
      isActive: formData.isActive,
    };

    setLoading(true);

    try {
      let result;
      if (isEdit) {
        result = await updateProduct(product.id, payload);
      } else {
        result = await createProduct(payload);
      }

      if (result?.success) {
        onSuccess(result.product, isEdit);
        onClose();
      } else {
        setFormError(result?.message || "Failed to save product.");
      }
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Product" : "Add New Product"}
      description={
        isEdit
          ? `Update details for SKU: ${product?.sku || ""}`
          : "Fill in the details below to add a new inventory item."
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
          >
            {formError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Product Name */}
          <div className="sm:col-span-2">
            <label
              htmlFor="prod-name"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="prod-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Basmati Rice 5kg"
              disabled={loading}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.name ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            ) : null}
          </div>

          {/* SKU */}
          <div>
            <label
              htmlFor="prod-sku"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              id="prod-sku"
              type="text"
              value={formData.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              placeholder="e.g. RICE-01"
              disabled={loading}
              className={`mt-1.5 w-full font-mono rounded-xl border px-3.5 py-2.5 text-sm uppercase text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.sku ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.sku ? (
              <p className="mt-1 text-xs text-red-600">{errors.sku}</p>
            ) : null}
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="prod-category"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Category
            </label>
            <input
              id="prod-category"
              type="text"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              placeholder="e.g. Grocery, Beverages, Hardware"
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-vendora/20 px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
            />
          </div>

          {/* Cost Price */}
          <div>
            <label
              htmlFor="prod-cost"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Cost Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              id="prod-cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.costPrice}
              onChange={(e) => handleChange("costPrice", e.target.value)}
              placeholder="0.00"
              disabled={loading}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.costPrice ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.costPrice ? (
              <p className="mt-1 text-xs text-red-600">{errors.costPrice}</p>
            ) : null}
          </div>

          {/* Selling Price */}
          <div>
            <label
              htmlFor="prod-selling"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Selling Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              id="prod-selling"
              type="number"
              step="0.01"
              min="0"
              value={formData.sellingPrice}
              onChange={(e) => handleChange("sellingPrice", e.target.value)}
              placeholder="0.00"
              disabled={loading}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.sellingPrice ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.sellingPrice ? (
              <p className="mt-1 text-xs text-red-600">{errors.sellingPrice}</p>
            ) : null}
          </div>

          {/* Stock Quantity */}
          <div>
            <label
              htmlFor="prod-stock"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Stock Quantity
            </label>
            <input
              id="prod-stock"
              type="number"
              min="0"
              step="1"
              value={formData.stockQuantity}
              onChange={(e) => handleChange("stockQuantity", e.target.value)}
              placeholder="0"
              disabled={loading}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.stockQuantity ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.stockQuantity ? (
              <p className="mt-1 text-xs text-red-600">{errors.stockQuantity}</p>
            ) : null}
          </div>

          {/* Low Stock Threshold */}
          <div>
            <label
              htmlFor="prod-threshold"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Low Stock Threshold
            </label>
            <input
              id="prod-threshold"
              type="number"
              min="0"
              step="1"
              value={formData.lowStockThreshold}
              onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
              placeholder="5"
              disabled={loading}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.lowStockThreshold ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.lowStockThreshold ? (
              <p className="mt-1 text-xs text-red-600">{errors.lowStockThreshold}</p>
            ) : null}
          </div>

          {/* Unit */}
          <div>
            <label
              htmlFor="prod-unit"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Unit of Measure
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="prod-unit"
                type="text"
                value={formData.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="pcs"
                disabled={loading}
                className="w-full rounded-xl border border-vendora/20 px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
              />
              <select
                aria-label="Select common unit"
                onChange={(e) => {
                  if (e.target.value) handleChange("unit", e.target.value);
                }}
                value={COMMON_UNITS.includes(formData.unit) ? formData.unit : ""}
                className="rounded-xl border border-vendora/20 bg-surface px-2 py-2.5 text-sm text-vendora-text outline-none"
              >
                <option value="">Select...</option>
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status (isActive) */}
          <div>
            <label
              htmlFor="prod-status"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Status
            </label>
            <select
              id="prod-status"
              value={formData.isActive ? "true" : "false"}
              onChange={(e) => handleChange("isActive", e.target.value === "true")}
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-vendora/20 bg-surface px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label
              htmlFor="prod-description"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Description
            </label>
            <textarea
              id="prod-description"
              rows={2}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Optional notes or product specifications..."
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-vendora/20 px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-vendora/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora-text transition hover:bg-vendora-bg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-vendora px-5 py-2 text-sm font-medium text-white transition hover:bg-vendora-dark focus:ring-2 focus:ring-vendora-accent/40 disabled:cursor-not-allowed disabled:bg-vendora/70"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>{isEdit ? "Updating..." : "Creating..."}</span>
              </>
            ) : isEdit ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
