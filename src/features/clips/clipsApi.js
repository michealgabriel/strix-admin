import { api, listQuery, toList } from "@/lib/api";

const clipsApi = api.enhanceEndpoints({ addTagTypes: ["Clips", "ClipReports"] }).injectEndpoints({
  endpoints: (build) => ({
    getClips: build.query({
      query: ({ page = 1, sort = "latest", gameId } = {}) =>
        listQuery("/epicclips/submissions", { page, sort, game_id: gameId, limit: 12 }),
      transformResponse: toList,
      providesTags: ["Clips"],
    }),
    getLeaderClip: build.query({
      query: () => "/epicclips/leader",
      transformResponse: (response) => response.epic_clip ?? null,
      providesTags: ["Clips"],
    }),
    crownClip: build.mutation({
      query: (id) => ({ url: `/admin/epicclips/submissions/${id}/crown-winner`, method: "POST" }),
      invalidatesTags: ["Clips"],
    }),
    getClipReports: build.query({
      query: ({ page = 1, status = "open" } = {}) => listQuery("/admin/epicclips/reports", { page, status }),
      transformResponse: toList,
      providesTags: ["ClipReports"],
    }),
    resolveClipReports: build.mutation({
      query: ({ id, action }) => ({ url: `/admin/epicclips/${id}/reports/resolve`, method: "POST", body: { action } }),
      invalidatesTags: ["ClipReports", "Clips", "Dashboard"],
    }),
  }),
});

export const {
  useGetClipsQuery,
  useGetLeaderClipQuery,
  useCrownClipMutation,
  useGetClipReportsQuery,
  useResolveClipReportsMutation,
} = clipsApi;
