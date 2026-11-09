import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { sessionEnded } from "@/features/auth/authSlice";

export const API_URL = import.meta.env.VITE_API_URL;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");
    return headers;
  },
});

// Any 401 means the admin token is gone or expired: end the session everywhere
const baseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 && api.endpoint !== "login") {
    api.dispatch(sessionEnded());
  }
  return result;
};

// Every feature adds its endpoints with api.injectEndpoints, next to its pages
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Me", "Dashboard"],
  endpoints: () => ({}),
});

// A readable message from an RTK Query error or a thrown Error
export function errorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  const data = error.data;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  if (data?.message) return String(data.message);
  if (error.status === "FETCH_ERROR") return "Can't reach the Strix server. Check your connection.";
  if (error.message) return error.message;
  return fallback;
}

// Errors per field from a 422 response: { name: "The name field is required." }
export function fieldErrors(error) {
  const errors = error?.data?.errors;
  if (!errors || typeof errors !== "object") return {};
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)]),
  );
}

// Query args for a paginated list. Some list endpoints answer an empty list with a 404,
// so a 404 counts as "nothing here" rather than an error.
export function listQuery(url, params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined),
  );
  return { url, params: clean, validateStatus: (response) => response.ok || response.status === 404 };
}

// { items, total, totalPages } from the backend's { data, pagination }
export function toList(response) {
  const items = Array.isArray(response?.data) ? response.data : [];
  const total = response?.pagination?.total ?? items.length;
  const limit = response?.pagination?.page_limit || total || 1;
  return { items, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

// Builds multipart form data, skipping empty values; booleans become 1/0
export function toFormData(values) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    form.append(key, typeof value === "boolean" ? (value ? "1" : "0") : value);
  }
  return form;
}
