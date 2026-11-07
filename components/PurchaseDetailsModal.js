"use client";

import Modal from "./Modal";
import { BanIcon } from "./Icons";

export default function PurchaseDetailsModal({
  open,
  onClose,
  purchase,
  onCancelRequest,
}) {
  if (!purchase) return null;

  const isCancelled = purchase.status === "Cancelled";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Purchase Order: ${purchase.purchaseNumber}`}
      description={`Recorded on ${new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Status Banners */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-vendora/10 bg-vendora-bg/40 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-vendora-text/70">
              Order Status:
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isCancelled
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {purchase.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-vendora-text/70">
              Payment:
            </span>
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
          </div>
        </div>

        {/* Supplier Info */}
        <div className="rounded-xl border border-vendora/10 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-vendora">
            Supplier Details
          </h4>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold text-vendora-text">
                {purchase.supplier?.name || "Unknown Supplier"}
              </p>
              {purchase.supplier?.contactPerson && (
                <p className="text-xs text-vendora-text/70">
                  Contact: {purchase.supplier.contactPerson}
                </p>
              )}
            </div>
            <div className="text-xs text-vendora-text/70 space-y-0.5">
              {purchase.supplier?.phone && <p>Phone: {purchase.supplier.phone}</p>}
              {purchase.supplier?.email && <p>Email: {purchase.supplier.email}</p>}
              {purchase.supplier?.address && <p>Address: {purchase.supplier.address}</p>}
            </div>
          </div>
        </div>

        {/* Purchased Items Table */}
        <div className="overflow-hidden rounded-xl border border-vendora/10">
          <div className="bg-vendora-bg/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-vendora-dark">
            Purchased Line Items
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-vendora/10 bg-white text-xs font-semibold text-vendora-text/70">
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5 text-center">Quantity</th>
                  <th className="px-4 py-2.5 text-right">Unit Cost</th>
                  <th className="px-4 py-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vendora/5 bg-white">
                {(purchase.items || []).map((it, idx) => (
                  <tr key={idx} className="hover:bg-vendora-bg/20">
                    <td className="px-4 py-3 font-medium text-vendora-text">
                      {it.product?.name || "Product"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-vendora-dark">
                      {it.product?.sku || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-vendora-text">
                      {it.quantity} {it.product?.unit || "pcs"}
                    </td>
                    <td className="px-4 py-3 text-right text-vendora-text">
                      ${Number(it.unitCost || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-vendora-dark">
                      ${Number(it.subtotal || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Notes */}
          <div className="rounded-xl border border-vendora/10 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-vendora-text/70">
              Notes & Memo
            </h4>
            <p className="mt-2 text-sm text-vendora-text/80 whitespace-pre-wrap">
              {purchase.notes || "No notes entered for this purchase order."}
            </p>
          </div>

          {/* Totals Summary */}
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
                -${Number(purchase.discount || 0).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-vendora/10 pt-2 flex justify-between font-bold text-vendora-dark text-base">
              <span>Total Amount:</span>
              <span>${Number(purchase.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Amount Paid:</span>
              <span className="font-semibold">
                ${Number(purchase.paidAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-amber-800">
              <span>Amount Due:</span>
              <span className="font-semibold">
                ${Number(purchase.dueAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between border-t border-vendora/10 pt-4">
          <div>
            {!isCancelled && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCancelRequest(purchase);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                <BanIcon className="h-4 w-4" />
                <span>Cancel Purchase & Reverse Stock</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora-text hover:bg-vendora-bg transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
