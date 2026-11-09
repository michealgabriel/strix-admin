import { store } from "@/app/store";
import { sessionEnded } from "@/features/auth/authSlice";

// Kept for pages from the first version that still call the API by hand.
// New code uses RTK Query (src/lib/api.js) instead.
export const secureFetch = async (endpoint, options = {}) => {
  const token = store.getState().auth.token;

  const headers = { Accept: "application/json" };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (response.status === 401) store.dispatch(sessionEnded());

  return response;
};
