"use client";

import { useEffect, useState, useMemo } from "react";
import Modal from "./Modal";
import { updatePurchase } from "../lib/api";

export default function EditPurchaseModal({ open, onClose, purchase, onSuccess }) {
  const [purchaseDate, setPurchaseDate] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Populate form from existing purchase data when modal opens
  useEffect(() => {
    if (!open || !purchase) return;
    setPurchaseDate(
      purchase.purchaseDate
        ? new Date(purchase.purchaseDate).toISOString().slice(0, 10)
        : new Date(purchase.createdAt).toISOString().slice(0, 10)
    );
    setDiscount(String(purchase.discount ?? 0));
    setPaidAmount(String(purchase.paidAmount ?? 0));
    setNotes(purchase.notes ?? "");
    setErrors({});
    setFormError("");
  }, [open, purchase]);

  // Live-calculated financials (read-only preview)
  const { totalAmount, dueAmount, paymentStatus } = useMemo(() => {
    const sub = Number(purchase?.subtotal ?? 0);
    const disc = Math.max(0, Number(discount) || 0);
    const total = Math.max(0, Math.round((sub - disc) * 100) / 100);
    const paid = Math.max(0, Number(paidAmount) || 0);
    const due = Math.max(0, Math.round((total - paid) * 100) / 100);
    let status = "Unpaid";
    if (paid >= total && total > 0) status = "Paid";
    else if (paid > 0) status = "Partial";
    return { totalAmount: total, dueAmount: due, paymentStatus: status };
  }, [purchase, discount, paidAmount]);

  function validate() {
    const errs = {};
    if (!purchaseDate) errs.purchaseDate = "Purchase date is required";

    const disc = Number(discount);
    if (isNaN(disc) || disc < 0) errs.discount = "Discount cannot be negative";
    else if (disc > Number(purchase?.subtotal ?? 0))
      errs.discount = "Discount cannot exceed subtotal";

    const paid = Number(paidAmount);
    if (isNaN(paid) || paid < 0) errs.paidAmount = "Paid amount cannot be negative";
    else if (paid > totalAmount) errs.paidAmount = "Paid amount cannot exceed total";

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

    setSubmitting(true);
    try {
      const res = await updatePurchase(purchase.id, {
        purchaseDate: new Date(purchaseDate).toISOString(),
        discount: parseFloat(discount) || 0,
        paidAmount: parseFloat(paidAmount) || 0,
        notes: notes.trim(),
      });
      if (res?.success) {
        onSuccess(res.purchase);
        onClose();
      } else {
        setFormError(res?.message || "Failed to update purchase.");
      }
    } catch (err) {
      setFormError(err.message || "Failed to update purchase.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!purchase) return null;

  const fieldClass = (hasErr) =>
    `mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
      hasErr ? "border-red-400 bg-red-50/30" : "border-vendora/20 bg-surface"
    }`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Purchase: ${purchase.purchaseNumber}`}
      description="Update payment, discount, date or notes. Items are locked as stock has already been adjusted."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
          >
            {formError}
          </div>
        )}

        {/* Locked items info */}
        <div className="rounded-xl border border-vendora/10 bg-vendora-bg/40 px-4 py-3 text-sm text-vendora-text/70">
          <span className="font-semibold text-vendora-text">
            {purchase.items?.length || 0} item{purchase.items?.length !== 1 ? "s" : ""}
          </span>{" "}
          · Supplier:{" "}
          <span className="font-semibold text-vendora-text">
            {purchase.supplier?.name || "Unknown"}
          </span>{" "}
          · Items subtotal:{" "}
          <span className="font-semibold text-vendora-dark">
            ${Number(purchase.subtotal || 0).toFixed(2)}
          </span>
        </div>

        {/* Purchase Date */}
        <div>
          <label
            htmlFor="edit-purchase-date"
            className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
          >
            Purchase Date <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-purchase-date"
            type="date"
            value={purchaseDate}
            onChange={(e) => {
              setPurchaseDate(e.target.value);
              if (errors.purchaseDate) setErrors((p) => { const n = { ...p }; delete n.purchaseDate; return n; });
            }}
            disabled={submitting}
            className={fieldClass(errors.purchaseDate)}
          />
          {errors.purchaseDate && (
            <p className="mt-1 text-xs text-red-600">{errors.purchaseDate}</p>
          )}
        </div>

        {/* Discount & Paid Amount */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="edit-discount"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Discount ($)
            </label>
            <input
              id="edit-discount"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => {
                setDiscount(e.target.value);
                if (errors.discount) setErrors((p) => { const n = { ...p }; delete n.discount; return n; });
              }}
              disabled={submitting}
              className={fieldClass(errors.discount)}
            />
            {errors.discount && (
              <p className="mt-1 text-xs text-red-600">{errors.discount}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-paid"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Paid Amount ($)
            </label>
            <input
              id="edit-paid"
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => {
                setPaidAmount(e.target.value);
                if (errors.paidAmount) setErrors((p) => { const n = { ...p }; delete n.paidAmount; return n; });
              }}
              disabled={submitting}
              className={fieldClass(errors.paidAmount)}
            />
            {errors.paidAmount && (
              <p className="mt-1 text-xs text-red-600">{errors.paidAmount}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="edit-notes"
            className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
          >
            Notes &amp; Terms
          </label>
          <textarea
            id="edit-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Invoice number, carrier details, terms..."
            disabled={submitting}
            className="mt-1.5 w-full rounded-xl border border-vendora/20 bg-surface px-3.5 py-2 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
          />
        </div>

        {/* Live Financial Summary */}
        <div className="rounded-xl border border-vendora/15 bg-vendora-bg/30 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-vendora-text/80">
            <span>Items Subtotal:</span>
            <span className="font-semibold text-vendora-text">
              ${Number(purchase.subtotal || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-vendora-text/80">
            <span>Discount:</span>
            <span className="font-semibold text-vendora-text">
              -${(Number(discount) || 0).toFixed(2)}
            </span>
          </div>
          <div className="border-t border-vendora/10 pt-2 flex justify-between font-bold text-vendora-dark text-base">
            <span>Total Amount:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Amount Paid:</span>
            <span className="font-semibold">${(Number(paidAmount) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-amber-800">
            <span>Amount Due:</span>
            <span className="font-semibold">${dueAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-1 items-center">
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

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-vendora/10 pt-4">
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
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
