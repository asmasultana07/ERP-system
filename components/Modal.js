"use client";

import { useEffect } from "react";
import { CloseIcon } from "./Icons";

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-2xl",
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-vendora-dark/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} overflow-hidden rounded-2xl bg-surface shadow-2xl transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-vendora/10 px-6 py-4">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-vendora-dark"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-vendora-text/70">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-vendora-text/60 transition hover:bg-vendora-bg hover:text-vendora-dark focus:outline-none focus:ring-2 focus:ring-vendora"
            aria-label="Close dialog"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
