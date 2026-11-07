"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { createCustomer, updateCustomer } from "../lib/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CustomerFormModal({
  open,
  onClose,
  customer = null,
  onSuccess,
}) {
  const isEdit = Boolean(customer);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        notes: customer.notes || "",
        isActive: customer.isActive !== undefined ? customer.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        isActive: true,
      });
    }
    setErrors({});
    setFormError("");
  }, [customer, open]);

  function handleChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
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
      errs.name = "Customer name is required";
    }

    const trimmedEmail = formData.email.trim();
    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address";
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
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      address: formData.address.trim(),
      notes: formData.notes.trim(),
      isActive: formData.isActive,
    };

    setLoading(true);

    try {
      let result;
      if (isEdit) {
        result = await updateCustomer(customer.id, payload);
      } else {
        result = await createCustomer(payload);
      }

      if (result?.success) {
        onSuccess(result.customer, isEdit);
        onClose();
      } else {
        setFormError(result?.message || "Failed to save customer.");
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
      title={isEdit ? "Edit Customer" : "Add New Customer"}
      description={
        isEdit
          ? `Update profile details for: ${customer?.name || ""}`
          : "Register a buyer or distributor account for sales and invoice management."
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
          {/* Customer Name */}
          <div className="sm:col-span-2">
            <label
              htmlFor="cust-name"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Customer / Business Name <span className="text-red-500">*</span>
            </label>
            <input
              id="cust-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Apex Retailers or Jane Doe"
              disabled={loading}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.name ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            ) : null}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="cust-phone"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Phone Number
            </label>
            <input
              id="cust-phone"
              type="text"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="e.g. +1 (555) 019-2834"
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-vendora/20 px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="cust-email"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Email Address
            </label>
            <input
              id="cust-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="e.g. buyer@apex.com"
              disabled={loading}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.email ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            ) : null}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="cust-status"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Status
            </label>
            <select
              id="cust-status"
              value={formData.isActive ? "true" : "false"}
              onChange={(e) => handleChange("isActive", e.target.value === "true")}
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-vendora/20 bg-white px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label
              htmlFor="cust-address"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Delivery / Billing Address
            </label>
            <input
              id="cust-address"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="e.g. 500 Market Square, Suite 2"
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-vendora/20 px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label
              htmlFor="cust-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Internal Notes
            </label>
            <textarea
              id="cust-notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Credit preferences, preferred payment modes..."
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
              "Update Customer"
            ) : (
              "Create Customer"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
