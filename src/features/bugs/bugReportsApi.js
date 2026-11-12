import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { api, API_URL, listQuery, toList } from "@/lib/api";

// Bug reports players send from the app
const bugReportsApi = api.enhanceEndpoints({ addTagTypes: ["BugReports", "BugReport"] }).injectEndpoints({
  endpoints: (build) => ({
    getBugReports: build.query({
      query: ({ page = 1, status = "", platform = "", source = "", app_version = "", search = "" } = {}) =>
        listQuery("/admin/bug-reports", { page, status, platform, source, app_version, search, limit: 20 }),
      transformResponse: (response) => ({ ...toList(response), counts: response?.counts ?? {}, appVersions: response?.app_versions ?? [] }),
      providesTags: ["BugReports"],
    }),
    getBugReport: build.query({
      query: (id) => `/admin/bug-reports/${id}`,
      transformResponse: (response) => response.report,
      providesTags: (result, error, id) => [{ type: "BugReport", id }],
    }),
    getBugReportCounts: build.query({
      query: () => "/admin/bug-reports/counts",
      providesTags: ["BugReports"],
    }),
    updateBugReport: build.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/bug-reports/${id}`, method: "PATCH", body }),
      invalidatesTags: (result, error, { id }) => ["BugReports", { type: "BugReport", id }],
    }),
  }),
});

export const { useGetBugReportsQuery, useGetBugReportQuery, useGetBugReportCountsQuery, useUpdateBugReportMutation } = bugReportsApi;

// The screenshot has no public URL: it's fetched with the admin's token and shown from memory
export function useScreenshot(reportId, enabled) {
  const token = useSelector((state) => state.auth.token);
  const [state, setState] = useState({ url: null, failed: false });

  useEffect(() => {
    if (!enabled || !reportId) return undefined;
    let url = null;
    let cancelled = false;
    fetch(`${API_URL}/admin/bug-reports/${reportId}/screenshot`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error("failed"))))
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ url, failed: false });
      })
      .catch(() => !cancelled && setState({ url: null, failed: true }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [reportId, enabled, token]);

  return state;
}

export const STATUSES = [
  ["new", "New"],
  ["in_progress", "In progress"],
  ["resolved", "Resolved"],
  ["wont_fix", "Won't fix"],
];
