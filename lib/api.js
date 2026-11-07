import { getToken, clearSession } from "./auth";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body,
    });
  } catch (networkError) {
    throw new Error(
      "Unable to connect to the server. Please verify the backend is running."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      clearSession();
      // Only redirect if not already on the login page
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    const message = data?.message || "Session expired. Please sign in again.";
    throw new Error(message);
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (Array.isArray(data?.errors) ? data.errors[0] : null) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ----------------- Product APIs -----------------

export async function getProducts({ search = "", category = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category && category !== "all") params.set("category", category);

  const query = params.toString();
  const endpoint = `/api/products${query ? `?${query}` : ""}`;
  return request(endpoint, { method: "GET" });
}

export async function getProduct(id) {
  return request(`/api/products/${id}`, { method: "GET" });
}

export async function createProduct(productData) {
  return request("/api/products", {
    method: "POST",
    body: productData,
  });
}

export async function updateProduct(id, productData) {
  return request(`/api/products/${id}`, {
    method: "PUT",
    body: productData,
  });
}

export async function deleteProduct(id) {
  return request(`/api/products/${id}`, {
    method: "DELETE",
  });
}

// ----------------- Supplier APIs -----------------

export async function getSuppliers({ search = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const query = params.toString();
  const endpoint = `/api/suppliers${query ? `?${query}` : ""}`;
  return request(endpoint, { method: "GET" });
}

export async function getSupplier(id) {
  return request(`/api/suppliers/${id}`, { method: "GET" });
}

export async function createSupplier(supplierData) {
  return request("/api/suppliers", {
    method: "POST",
    body: supplierData,
  });
}

export async function updateSupplier(id, supplierData) {
  return request(`/api/suppliers/${id}`, {
    method: "PUT",
    body: supplierData,
  });
}

export async function deleteSupplier(id) {
  return request(`/api/suppliers/${id}`, {
    method: "DELETE",
  });
}

// ----------------- Purchase APIs -----------------

export async function getPurchases({
  search = "",
  supplier = "",
  paymentStatus = "",
  status = "",
  startDate = "",
  endDate = "",
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (supplier && supplier !== "all") params.set("supplier", supplier);
  if (paymentStatus && paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
  if (status && status !== "all") params.set("status", status);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));

  const query = params.toString();
  const endpoint = `/api/purchases${query ? `?${query}` : ""}`;
  return request(endpoint, { method: "GET" });
}

export async function getPurchase(id) {
  return request(`/api/purchases/${id}`, { method: "GET" });
}

export async function createPurchase(purchaseData) {
  return request("/api/purchases", {
    method: "POST",
    body: purchaseData,
  });
}

export async function cancelPurchase(id) {
  return request(`/api/purchases/${id}/cancel`, {
    method: "PATCH",
  });
}

// ----------------- Customer APIs -----------------

export async function getCustomers({ search = "", isActive = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (isActive !== "") params.set("isActive", String(isActive));

  const query = params.toString();
  const endpoint = `/api/customers${query ? `?${query}` : ""}`;
  return request(endpoint, { method: "GET" });
}

export async function getCustomer(id) {
  return request(`/api/customers/${id}`, { method: "GET" });
}

export async function createCustomer(customerData) {
  return request("/api/customers", {
    method: "POST",
    body: customerData,
  });
}

export async function updateCustomer(id, customerData) {
  return request(`/api/customers/${id}`, {
    method: "PUT",
    body: customerData,
  });
}

export async function deleteCustomer(id) {
  return request(`/api/customers/${id}`, {
    method: "DELETE",
  });
}

// ----------------- Sale APIs -----------------

export async function getSales({
  search = "",
  customer = "",
  paymentStatus = "",
  status = "",
  startDate = "",
  endDate = "",
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (customer && customer !== "all") params.set("customer", customer);
  if (paymentStatus && paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
  if (status && status !== "all") params.set("status", status);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));

  const query = params.toString();
  const endpoint = `/api/sales${query ? `?${query}` : ""}`;
  return request(endpoint, { method: "GET" });
}

export async function getSale(id) {
  return request(`/api/sales/${id}`, { method: "GET" });
}

export async function createSale(saleData) {
  return request("/api/sales", {
    method: "POST",
    body: saleData,
  });
}

export async function cancelSale(id) {
  return request(`/api/sales/${id}/cancel`, {
    method: "PATCH",
  });
}

// ----------------- Dashboard APIs -----------------

export async function getDashboardStats() {
  return request("/api/dashboard/stats", { method: "GET" });
}
