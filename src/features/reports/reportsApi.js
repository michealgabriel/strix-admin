import { api, listQuery, toList } from "@/lib/api";

const reportsApi = api.enhanceEndpoints({ addTagTypes: ["PostReports"] }).injectEndpoints({
  endpoints: (build) => ({
    getPostReports: build.query({
      query: ({ page = 1, status = "open" } = {}) => listQuery("/admin/posts/reports", { page, status }),
      transformResponse: toList,
      providesTags: ["PostReports"],
    }),
    resolvePostReports: build.mutation({
      query: ({ id, action }) => ({ url: `/admin/posts/${id}/reports/resolve`, method: "POST", body: { action } }),
      invalidatesTags: ["PostReports", "Dashboard"],
    }),
  }),
});

export const { useGetPostReportsQuery, useResolvePostReportsMutation } = reportsApi;
