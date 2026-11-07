"use client";

import Modal from "./Modal";
import { AlertTriangleIcon } from "./Icons";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  confirmVariant = "danger",
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangleIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-vendora-text/80">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-vendora/10 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-vendora/20 px-4 py-2 text-sm font-medium text-vendora-text transition hover:bg-vendora-bg disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
            confirmVariant === "danger"
              ? "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/30"
              : "bg-vendora hover:bg-vendora-dark focus:ring-2 focus:ring-vendora/30"
          }`}
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
              <span>Processing...</span>
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
}
