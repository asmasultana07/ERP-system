"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { createSupplier, updateSupplier } from "../lib/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SupplierFormModal({
  open,
  onClose,
  supplier = null,
  onSuccess,
}) {
  const isEdit = Boolean(supplier);

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
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
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        notes: supplier.notes || "",
        isActive: supplier.isActive !== undefined ? supplier.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        isActive: true,
      });
    }
    setErrors({});
    setFormError("");
  }, [supplier, open]);

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
      errs.name = "Supplier name is required";
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
      contactPerson: formData.contactPerson.trim(),
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
        result = await updateSupplier(supplier.id, payload);
      } else {
        result = await createSupplier(payload);
      }

      if (result?.success) {
        onSuccess(result.supplier, isEdit);
        onClose();
      } else {
        setFormError(result?.message || "Failed to save supplier.");
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
      title={isEdit ? "Edit Supplier" : "Add New Supplier"}
      description={
        isEdit
          ? `Update details for supplier: ${supplier?.name || ""}`
          : "Fill in the details below to register a new vendor/supplier."
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
          {/* Supplier Name */}
          <div className="sm:col-span-2">
            <label
              htmlFor="sup-name"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Supplier / Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="sup-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Acme Wholesale Ltd."
              disabled={loading}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30 ${
                errors.name ? "border-red-400 bg-red-50/30" : "border-vendora/20"
              }`}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            ) : null}
          </div>

          {/* Contact Person */}
          <div>
            <label
              htmlFor="sup-contact"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Contact Person
            </label>
            <input
              id="sup-contact"
              type="text"
              value={formData.contactPerson}
              onChange={(e) => handleChange("contactPerson", e.target.value)}
              placeholder="e.g. John Doe"
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-vendora/20 px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
            />
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="sup-phone"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Phone Number
            </label>
            <input
              id="sup-phone"
              type="text"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="e.g. +1 (555) 012-3456"
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-vendora/20 px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="sup-email"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Email Address
            </label>
            <input
              id="sup-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="e.g. orders@acme.com"
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
              htmlFor="sup-status"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Status
            </label>
            <select
              id="sup-status"
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
              htmlFor="sup-address"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Address
            </label>
            <input
              id="sup-address"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="e.g. 742 Evergreen Terrace, Industrial Zone 4"
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-vendora/20 px-3.5 py-2.5 text-sm text-vendora-text outline-none transition focus:border-vendora focus:ring-2 focus:ring-vendora-accent/30"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label
              htmlFor="sup-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-vendora-text"
            >
              Notes
            </label>
            <textarea
              id="sup-notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Delivery terms, account numbers, or special notes..."
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
              "Update Supplier"
            ) : (
              "Create Supplier"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
