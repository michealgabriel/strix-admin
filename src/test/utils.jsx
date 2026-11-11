import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { api } from "@/lib/api";
import authReducer from "@/features/auth/authSlice";

export function makeStore(auth = {}) {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer, auth: authReducer },
    preloadedState: {
      auth: { token: null, admin: null, permissions: [], realtime: null, endedReason: null, ...auth },
    },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
}

export function renderRoutes(routes, { store = makeStore(), path = "/" } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { store, router, ...render(<Provider store={store}><RouterProvider router={router} /></Provider>) };
}

// Replies to fetch calls by URL path: { "/auth/admin/me": [200, body] }
export function stubApi(routes) {
  const calls = [];
  globalThis.fetch = vi.fn(async (input) => {
    const request = input instanceof Request ? input : new Request(input);
    const path = new URL(request.url).pathname.replace(/^\/api/, "");
    calls.push({ path, method: request.method, auth: request.headers.get("Authorization") });
    const [status, body] = routes[path] ?? [404, { message: "Not found" }];
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
  return calls;
}
