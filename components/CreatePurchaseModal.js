"use client";

import { useEffect, useState, useMemo } from "react";
import Modal from "./Modal";
import { getSuppliers, getProducts, createPurchase } from "../lib/api";
import { PlusIcon, TrashIcon } from "./Icons";

export default function CreatePurchaseModal({ open, onClose, onSuccess }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [items, setItems] = useState([
    { product: "", quantity: 1, unitCost: 0, subtotal: 0 },
  ]);
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function fetchData() {
      setLoadingData(true);
      try {
        const [supRes, prodRes] = await Promise.all([
          getSuppliers(),
          getProducts(),
        ]);
        if (supRes?.success) {
          setSuppliers((supRes.suppliers || []).filter((s) => s.isActive !== false));
        }
        if (prodRes?.success) {
          setProducts((prodRes.products || []).filter((p) => p.isActive !== false));
        }
      } catch (err) {
        setFormError("Failed to load suppliers or products list.");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();

    // Reset form
    setSupplierId("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setItems([{ product: "", quantity: 1, unitCost: 0, subtotal: 0 }]);
    setDiscount("0");
    setPaidAmount("0");
    setNotes("");
    setErrors({});
    setFormError("");
  }, [open]);

  // Handle item change
  function handleItemProductChange(index, productId) {
    const selectedProd = products.find((p) => p.id === productId);
    const cost = selectedProd ? Number(selectedProd.costPrice || 0) : 0;

    setItems((prev) => {
      const copy = [...prev];
      const cur = copy[index] || {};
      const qty = Number(cur.quantity) || 1;
      copy[index] = {
        ...cur,
        product: productId,
        unitCost: cost,
        subtotal: Math.round(qty * cost * 100) / 100,
      };
      return copy;
    });

    if (errors[`item_${index}_product`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`item_${index}_product`];
        return next;
      });
    }
  }

  function handleItemQuantityChange(index, value) {
    setItems((prev) => {
      const copy = [...prev];
      const cur = copy[index] || {};
      const qty = value === "" ? "" : Number(value);
      const cost = Number(cur.unitCost) || 0;
      copy[index] = {
        ...cur,
        quantity: value,
        subtotal:
          typeof qty === "number" && !isNaN(qty)
            ? Math.round(qty * cost * 100) / 100
            : 0,
      };
      return copy;
    });

    if (errors[`item_${index}_quantity`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`item_${index}_quantity`];
        return next;
      });
    }
  }

  function handleItemCostChange(index, value) {
    setItems((prev) => {
      const copy = [...prev];
      const cur = copy[index] || {};
      const cost = value === "" ? "" : Number(value);
      const qty = Number(cur.quantity) || 0;
      copy[index] = {
        ...cur,
        unitCost: value,
        subtotal:
          typeof cost === "number" && !isNaN(cost)
            ? Math.round(qty * cost * 100) / 100
            : 0,
      };
      return copy;
    });

    if (errors[`item_${index}_unitCost`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`item_${index}_unitCost`];
        return next;
      });
    }
  }

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      { product: "", quantity: 1, unitCost: 0, subtotal: 0 },
    ]);
  }

  function handleRemoveItem(index) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  // Calculated Totals
  const { subtotal, totalAmount, dueAmount, paymentStatus } = useMemo(() => {
    const rawSubtotal = items.reduce((acc, it) => {
      const q = Number(it.quantity) || 0;
      const c = Number(it.unitCost) || 0;
      return acc + q * c;
    }, 0);
    const sub = Math.round(rawSubtotal * 100) / 100;

    const disc = Math.max(0, Number(discount) || 0);
    const total = Math.max(0, Math.round((sub - disc) * 100) / 100);

    const paid = Math.max(0, Number(paidAmount) || 0);
    const due = Math.max(0, Math.round((total - paid) * 100) / 100);

    let status = "Unpaid";
    if (paid >= total && total > 0) {
      status = "Paid";
    } else if (paid > 0) {
      status = "Partial";
    }

    return {
      subtotal: sub,
      totalAmount: total,
      dueAmount: due,
      paymentStatus: status,
    };
  }, [items, discount, paidAmount]);

  function validate() {
    const errs = {};

    if (!supplierId) {
      errs.supplier = "Supplier is required";
    }

    if (!purchaseDate) {
      errs.purchaseDate = "Purchase date is required";
    }

    if (!items || items.length === 0) {
      errs.general = "Add at least one product item";
    }

    const seenProducts = new Set();
    items.forEach((item, index) => {
      if (!item.product) {
        errs[`item_${index}_product`] = "Product is required";
      } else {
        if (seenProducts.has(item.product)) {
          errs[`item_${index}_product`] =
            "Duplicate product. Adjust quantity instead.";
        }
        seenProducts.add(item.product);
      }

      const q = Number(item.quantity);
      if (item.quantity === "" || isNaN(q) || !Number.isInteger(q) || q <= 0) {
        errs[`item_${index}_quantity`] = "Quantity must be an integer (>= 1)";
      }

      const c = Number(item.unitCost);
      if (item.unitCost === "" || isNaN(c) || c < 0) {
        errs[`item_${index}_unitCost`] = "Unit cost must be >= 0";
      }
    });

    const disc = Number(discount);
    if (isNaN(disc) || disc < 0) {
      errs.discount = "Discount cannot be negative";
    } else if (disc > subtotal) {
      errs.discount = "Discount cannot exceed subtotal";
    }

    const paid = Number(paidAmount);
    if (isNaN(paid) || paid < 0) {
      errs.paidAmount = "Paid amount cannot be negative";
    } else if (paid > totalAmount) {
      errs.paidAmount = "Paid amount cannot exceed total amount";
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
      supplier: supplierId,
      purchaseDate: new Date(purchaseDate).toISOString(),
      items: items.map((it) => ({
        product: it.product,
        quantity: parseInt(it.quantity, 10),
        unitCost: parseFloat(it.unitCost),
      })),
      discount: parseFloat(discount) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      notes: notes.trim(),
    };

    setSubmitting(true);
    try {
      const res = await createPurchase(payload);
      if (res?.success) {
        onSuccess(res.purchase);
        onClose();
      } else {
        setFormError(res?.message || "Failed to record purchase.");
      }
    } catch (err) {
      setFormError(err.message || "Failed to record purchase.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Purchase Order"
      description="Record stock acquisition from a verified supplier. Product inventory will update automatically."
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
          >
            {formError}
          </div>
        ) : null}

        {/* Supplier & Purchase Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="purchase-supplier"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              id="purchase-supplier"
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                if (errors.supplier) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.supplier;
                    return next;
                  });
                }
              }}
              disabled={loadingData || submitting}
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.supplier ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            >
              <option value="">Select a supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.contactPerson ? `(${s.contactPerson})` : ""}
                </option>
              ))}
            </select>
            {errors.supplier ? (
              <p className="mt-1 text-xs text-red-600">{errors.supplier}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="purchase-date"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Purchase Date <span className="text-red-500">*</span>
            </label>
            <input
              id="purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              disabled={submitting}
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.purchaseDate ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.purchaseDate ? (
              <p className="mt-1 text-xs text-red-600">{errors.purchaseDate}</p>
            ) : null}
          </div>
        </div>

        {/* Purchase Items List */}
        <div className="rounded-2xl border border-vendora/15 bg-vendora-bg/30 p-4">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-sm font-bold text-vendora-dark">
                Purchase Items
              </h3>
              <p className="text-xs text-vendora-text/70">
                Specify product quantities and agreed unit purchase costs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={submitting || products.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-vendora/20 bg-white px-3 py-1.5 text-xs font-medium text-vendora transition hover:bg-vendora-bg focus:outline-none focus:ring-2 focus:ring-vendora"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const selectedProduct = products.find((p) => p.id === item.product);

              return (
                <div
                  key={index}
                  className="rounded-xl border border-vendora/10 bg-white p-3.5 shadow-2xs"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
                    {/* Product Selection */}
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-vendora-text/80">
                        Product #{index + 1}
                      </label>
                      <select
                        value={item.product}
                        onChange={(e) =>
                          handleItemProductChange(index, e.target.value)
                        }
                        disabled={submitting}
                        className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-1 focus:ring-vendora ${
                          errors[`item_${index}_product`]
                            ? "border-red-400 bg-red-50/30"
                            : "border-vendora/20"
                        }`}
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.sku}] (Current Stock: {p.stockQuantity}{" "}
                            {p.unit || "pcs"})
                          </option>
                        ))}
                      </select>
                      {errors[`item_${index}_product`] ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`item_${index}_product`]}
                        </p>
                      ) : null}
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-vendora-text/80">
                        Qty {selectedProduct?.unit ? `(${selectedProduct.unit})` : ""}
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemQuantityChange(index, e.target.value)
                        }
                        disabled={submitting}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-1 focus:ring-vendora ${
                          errors[`item_${index}_quantity`]
                            ? "border-red-400 bg-red-50/30"
                            : "border-vendora/20"
                        }`}
                      />
                      {errors[`item_${index}_quantity`] ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`item_${index}_quantity`]}
                        </p>
                      ) : null}
                    </div>

                    {/* Unit Cost */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-vendora-text/80">
                        Unit Cost ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) =>
                          handleItemCostChange(index, e.target.value)
                        }
                        disabled={submitting}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-1 focus:ring-vendora ${
                          errors[`item_${index}_unitCost`]
                            ? "border-red-400 bg-red-50/30"
                            : "border-vendora/20"
                        }`}
                      />
                      {errors[`item_${index}_unitCost`] ? (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`item_${index}_unitCost`]}
                        </p>
                      ) : null}
                    </div>

                    {/* Subtotal */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-vendora-text/80">
                        Subtotal ($)
                      </label>
                      <div className="mt-1 flex h-[38px] items-center rounded-lg bg-vendora-bg/60 px-3 font-semibold text-vendora-dark text-sm">
                        ${Number(item.subtotal || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Remove Action */}
                    <div className="sm:col-span-1 flex items-end justify-center pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1 || submitting}
                        title="Remove product line"
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 transition"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discounts, Paid Amount, and Totals */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Financial Inputs & Notes */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="purchase-discount"
                className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
              >
                Discount ($)
              </label>
              <input
                id="purchase-discount"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                disabled={submitting}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                  errors.discount ? "border-red-400 bg-red-50/30" : "border-vendora/20"
                }`}
              />
              {errors.discount ? (
                <p className="mt-1 text-xs text-red-600">{errors.discount}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="purchase-paid"
                className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
              >
                Paid Amount ($)
              </label>
              <input
                id="purchase-paid"
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                disabled={submitting}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                  errors.paidAmount ? "border-red-400 bg-red-50/30" : "border-vendora/20"
                }`}
              />
              {errors.paidAmount ? (
                <p className="mt-1 text-xs text-red-600">{errors.paidAmount}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="purchase-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
              >
                Notes & Terms
              </label>
              <textarea
                id="purchase-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Invoice number, carrier details, terms..."
                disabled={submitting}
                className="mt-1.5 w-full rounded-xl border border-vendora/20 px-3.5 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
              />
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-vendora/15 bg-vendora-bg/50 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-vendora-dark">
              Financial Summary
            </h4>

            <div className="my-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-vendora-text/80">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-vendora-text">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-vendora-text/80">
                <span>Discount:</span>
                <span className="font-semibold text-vendora-text">
                  -${(Number(discount) || 0).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-vendora/10 pt-2 flex items-center justify-between text-base font-bold text-vendora-dark">
                <span>Total Amount:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-vendora-text/80">
                <span>Paid Amount:</span>
                <span className="font-medium text-emerald-700">
                  ${(Number(paidAmount) || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-vendora-text/80">
                <span>Due Amount:</span>
                <span
                  className={`font-semibold ${
                    dueAmount > 0 ? "text-amber-700" : "text-vendora-text"
                  }`}
                >
                  ${dueAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-vendora-text/70">Payment Status:</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    paymentStatus === "Paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : paymentStatus === "Partial"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-vendora-text/60 italic">
              Inventory will increment upon submission. You cannot edit items after completion.
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-vendora/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora-text transition hover:bg-vendora-bg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-vendora px-5 py-2 text-sm font-medium text-white transition hover:bg-vendora-dark focus:ring-2 focus:ring-vendora-accent/40 disabled:cursor-not-allowed disabled:bg-vendora/70"
          >
            {submitting ? (
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
                <span>Recording Purchase...</span>
              </>
            ) : (
              "Confirm & Record Purchase"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
