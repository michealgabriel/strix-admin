import { useCallback } from "react";
import { useSearchParams } from "react-router";

// Page, search and filters for a list, kept in the URL so lists survive a reload and can be shared.
export function useListParams(defaults = {}) {
  const [params, setParams] = useSearchParams();

  const get = (key) => params.get(key) ?? defaults[key] ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const set = useCallback(
    (changes) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === "" || value === null || value === undefined) next.delete(key);
            else next.set(key, String(value));
          }
          // Any change other than the page itself starts again from page 1
          if (!("page" in changes)) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { page, get, set, setPage: (value) => set({ page: value > 1 ? value : "" }) };
}

// Normalises the backend's { data, pagination: { total, page_limit, current_page } }
export function pageInfo(response) {
  const total = response?.pagination?.total ?? response?.data?.length ?? 0;
  const limit = response?.pagination?.page_limit || total || 1;
  return { total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
