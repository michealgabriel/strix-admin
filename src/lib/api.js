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
