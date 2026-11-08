"use client";

import { useEffect, useState, useMemo } from "react";
import Modal from "./Modal";
import { getCustomers, getProducts, createSale } from "../lib/api";
import { PlusIcon, TrashIcon, AlertTriangleIcon } from "./Icons";

export default function CreateSaleModal({ open, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [isWalkIn, setIsWalkIn] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [saleDate, setSaleDate] = useState("");

  const [items, setItems] = useState([
    { product: "", quantity: 1, unitPrice: 0, subtotal: 0 },
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
        const [custRes, prodRes] = await Promise.all([
          getCustomers({ isActive: true }),
          getProducts(),
        ]);
        if (custRes?.success) {
          setCustomers(custRes.customers || []);
        }
        if (prodRes?.success) {
          setProducts((prodRes.products || []).filter((p) => p.isActive !== false));
        }
      } catch (err) {
        setFormError("Failed to load customers or products list.");
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();

    // Reset Form
    setIsWalkIn(true);
    setCustomerId("");
    setCustomerName("Walk-in Customer");
    setSaleDate(new Date().toISOString().slice(0, 10));
    setItems([{ product: "", quantity: 1, unitPrice: 0, subtotal: 0 }]);
    setDiscount("0");
    setPaidAmount("0");
    setNotes("");
    setErrors({});
    setFormError("");
  }, [open]);

  function handleProductChange(index, productId) {
    const prod = products.find((p) => p.id === productId);
    const price = prod ? Number(prod.sellingPrice || 0) : 0;

    setItems((prev) => {
      const copy = [...prev];
      const cur = copy[index] || {};
      const qty = Number(cur.quantity) || 1;
      copy[index] = {
        ...cur,
        product: productId,
        unitPrice: price,
        subtotal: Math.round(qty * price * 100) / 100,
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

  function handleQuantityChange(index, value) {
    setItems((prev) => {
      const copy = [...prev];
      const cur = copy[index] || {};
      const qty = value === "" ? "" : Number(value);
      const price = Number(cur.unitPrice) || 0;
      copy[index] = {
        ...cur,
        quantity: value,
        subtotal:
          typeof qty === "number" && !isNaN(qty)
            ? Math.round(qty * price * 100) / 100
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

  function handlePriceChange(index, value) {
    setItems((prev) => {
      const copy = [...prev];
      const cur = copy[index] || {};
      const price = value === "" ? "" : Number(value);
      const qty = Number(cur.quantity) || 0;
      copy[index] = {
        ...cur,
        unitPrice: value,
        subtotal:
          typeof price === "number" && !isNaN(price)
            ? Math.round(qty * price * 100) / 100
            : 0,
      };
      return copy;
    });

    if (errors[`item_${index}_unitPrice`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`item_${index}_unitPrice`];
        return next;
      });
    }
  }

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      { product: "", quantity: 1, unitPrice: 0, subtotal: 0 },
    ]);
  }

  function handleRemoveItem(index) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  // Calculated Totals
  const { subtotal, totalAmount, dueAmount, paymentStatus } = useMemo(() => {
    const rawSub = items.reduce((acc, it) => {
      const q = Number(it.quantity) || 0;
      const p = Number(it.unitPrice) || 0;
      return acc + q * p;
    }, 0);
    const sub = Math.round(rawSub * 100) / 100;

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

    if (!isWalkIn && !customerId) {
      errs.customer = "Please select a registered customer";
    }

    if (isWalkIn && !customerName.trim()) {
      errs.customerName = "Walk-in customer name is required";
    }

    if (!saleDate) {
      errs.saleDate = "Sale date is required";
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
            "Duplicate product. Please update quantity instead.";
        }
        seenProducts.add(item.product);
      }

      const prod = products.find((p) => p.id === item.product);
      const availableStock = prod ? Number(prod.stockQuantity || 0) : 0;

      const q = Number(item.quantity);
      if (item.quantity === "" || isNaN(q) || !Number.isInteger(q) || q <= 0) {
        errs[`item_${index}_quantity`] = "Quantity must be an integer (>= 1)";
      } else if (prod && q > availableStock) {
        errs[`item_${index}_quantity`] = `Exceeds stock (${availableStock} available)`;
      }

      const p = Number(item.unitPrice);
      if (item.unitPrice === "" || isNaN(p) || p < 0) {
        errs[`item_${index}_unitPrice`] = "Unit price must be >= 0";
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
      customer: isWalkIn ? null : customerId,
      customerName: isWalkIn
        ? customerName.trim()
        : customers.find((c) => c.id === customerId)?.name || customerName.trim(),
      saleDate: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
      items: items.map((it) => ({
        product: it.product,
        quantity: parseInt(it.quantity, 10),
        unitPrice: parseFloat(it.unitPrice),
      })),
      discount: parseFloat(discount) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      notes: notes.trim(),
    };

    setSubmitting(true);
    try {
      const res = await createSale(payload);
      if (res?.success) {
        onSuccess(res.sale);
        onClose();
      } else {
        setFormError(res?.message || "Failed to record sale.");
      }
    } catch (err) {
      setFormError(err.message || "Failed to record sale.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Sales Invoice"
      description="Record a customer sale or walk-in order. Stock quantities will be deducted immediately."
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

        {/* Customer Type & Selection */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-vendora-text">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsWalkIn(true);
                    setCustomerId("");
                    setCustomerName("Walk-in Customer");
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    isWalkIn
                      ? "bg-vendora text-white"
                      : "bg-vendora-bg text-vendora hover:bg-vendora-bg/80"
                  }`}
                >
                  Walk-in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsWalkIn(false);
                    setCustomerName("");
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    !isWalkIn
                      ? "bg-vendora text-white"
                      : "bg-vendora-bg text-vendora hover:bg-vendora-bg/80"
                  }`}
                >
                  Registered
                </button>
              </div>
            </div>

            {isWalkIn ? (
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer name"
                disabled={submitting}
                className={`mt-1.5 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                  errors.customerName ? "border-red-400 bg-red-50/30" : "border-vendora/20"
                }`}
              />
            ) : (
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  const found = customers.find((c) => c.id === e.target.value);
                  if (found) setCustomerName(found.name);
                  if (errors.customer) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.customer;
                      return next;
                    });
                  }
                }}
                disabled={loadingData || submitting}
                className={`mt-1.5 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                  errors.customer ? "border-red-400 bg-red-50/30" : "border-vendora/20"
                }`}
              >
                <option value="">Select registered customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            )}

            {errors.customer && (
              <p className="mt-1 text-xs text-red-600">{errors.customer}</p>
            )}
            {errors.customerName && (
              <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="sale-date"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Sale Date <span className="text-red-500">*</span>
            </label>
            <input
              id="sale-date"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              disabled={submitting}
              className={`mt-1.5 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.saleDate ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.saleDate && (
              <p className="mt-1 text-xs text-red-600">{errors.saleDate}</p>
            )}
          </div>
        </div>

        {/* Product Items List */}
        <div className="rounded-2xl border border-vendora/15 bg-vendora-bg/30 p-4">
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-sm font-bold text-vendora-dark">
                Sold Products
              </h3>
              <p className="text-xs text-vendora-text/70">
                Stock is verified before deduction. Quantity cannot exceed available inventory.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={submitting || products.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-vendora/20 bg-surface px-3 py-1.5 text-xs font-medium text-vendora transition hover:bg-vendora-bg"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const selectedProduct = products.find((p) => p.id === item.product);
              const available = selectedProduct
                ? Number(selectedProduct.stockQuantity || 0)
                : 0;

              return (
                <div
                  key={index}
                  className="rounded-xl border border-vendora/10 bg-surface p-3.5 shadow-2xs"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center">
                    {/* Product Selection */}
                    <div className="sm:col-span-5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-vendora-text/80">
                          Product #{index + 1}
                        </label>
                        {selectedProduct && (
                          <span
                            className={`text-[11px] font-medium ${
                              available <= 0
                                ? "text-red-600 font-bold"
                                : available <= (selectedProduct.lowStockThreshold || 5)
                                ? "text-amber-700"
                                : "text-emerald-700"
                            }`}
                          >
                            Stock: {available} {selectedProduct.unit || "pcs"}
                          </span>
                        )}
                      </div>
                      <select
                        value={item.product}
                        onChange={(e) =>
                          handleProductChange(index, e.target.value)
                        }
                        disabled={submitting}
                        className={`mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-1 focus:ring-vendora ${
                          errors[`item_${index}_product`]
                            ? "border-red-400 bg-red-50/30"
                            : "border-vendora/20"
                        }`}
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={p.stockQuantity <= 0}
                          >
                            {p.name} [{p.sku}] — Avail: {p.stockQuantity}{" "}
                            {p.unit || "pcs"} {p.stockQuantity <= 0 ? "(Out of Stock)" : ""}
                          </option>
                        ))}
                      </select>
                      {errors[`item_${index}_product`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`item_${index}_product`]}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-vendora-text/80">
                        Qty {selectedProduct?.unit ? `(${selectedProduct.unit})` : ""}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={available > 0 ? available : undefined}
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(index, e.target.value)
                        }
                        disabled={submitting}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-1 focus:ring-vendora ${
                          errors[`item_${index}_quantity`]
                            ? "border-red-400 bg-red-50/30"
                            : "border-vendora/20"
                        }`}
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`item_${index}_quantity`]}
                        </p>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-vendora-text/80">
                        Unit Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handlePriceChange(index, e.target.value)
                        }
                        disabled={submitting}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-1 focus:ring-vendora ${
                          errors[`item_${index}_unitPrice`]
                            ? "border-red-400 bg-red-50/30"
                            : "border-vendora/20"
                        }`}
                      />
                      {errors[`item_${index}_unitPrice`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors[`item_${index}_unitPrice`]}
                        </p>
                      )}
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

        {/* Financial Inputs & Summary Panel */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="sale-discount"
                className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
              >
                Discount ($)
              </label>
              <input
                id="sale-discount"
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
              {errors.discount && (
                <p className="mt-1 text-xs text-red-600">{errors.discount}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sale-paid"
                className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
              >
                Received Payment ($)
              </label>
              <input
                id="sale-paid"
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
              {errors.paidAmount && (
                <p className="mt-1 text-xs text-red-600">{errors.paidAmount}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sale-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
              >
                Notes & Terms
              </label>
              <textarea
                id="sale-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment mode, delivery address, receipt info..."
                disabled={submitting}
                className="mt-1.5 w-full rounded-xl border border-vendora/20 px-3.5 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
              />
            </div>
          </div>

          {/* Real-time Calculation Panel */}
          <div className="flex flex-col justify-between rounded-2xl border border-vendora/15 bg-vendora-bg/50 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-vendora-dark">
              Invoice Summary
            </h4>

            <div className="my-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-vendora-text/80">
                <span>Subtotal:</span>
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
                <span>Total Due:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-vendora-text/80">
                <span>Paid Amount:</span>
                <span className="font-medium text-emerald-700">
                  ${(Number(paidAmount) || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-vendora-text/80">
                <span>Balance Due:</span>
                <span
                  className={`font-semibold ${
                    dueAmount > 0 ? "text-amber-800" : "text-vendora-text"
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
              Product stock is deducted immediately upon invoice generation.
            </p>
          </div>
        </div>

        {/* Modal Buttons */}
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
                <span>Recording Sale & Deducting Stock...</span>
              </>
            ) : (
              "Confirm & Generate Invoice"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
