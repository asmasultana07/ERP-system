"use client";

import { useEffect } from "react";
import { CheckCircleIcon, AlertTriangleIcon, CloseIcon } from "./Icons";

export default function Toast({
  type = "success",
  message,
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!message || !duration) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-2xl border bg-surface p-4 shadow-xl transition-all animate-in slide-in-from-bottom-5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        }`}
      >
        {isSuccess ? (
          <CheckCircleIcon className="h-5 w-5" />
        ) : (
          <AlertTriangleIcon className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-vendora-text">{message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 text-vendora-text/40 hover:bg-vendora-bg hover:text-vendora-text"
        aria-label="Dismiss notification"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
