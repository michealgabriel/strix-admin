import { api, listQuery, toList } from "@/lib/api";

// The AI agents and the Content studio
const studioApi = api.enhanceEndpoints({ addTagTypes: ["AiAgents", "StudioContent", "StudioOverview", "StrixPosts"] }).injectEndpoints({
  endpoints: (build) => ({
    getAgents: build.query({
      query: () => "/admin/ai-agents",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["AiAgents"],
    }),
    provisionAgents: build.mutation({
      query: () => ({ url: "/admin/ai-agents/provision", method: "POST" }),
      invalidatesTags: ["AiAgents"],
    }),
    saveAgent: build.mutation({
      query: ({ id, formData }) => ({ url: `/admin/ai-agents/${id}`, method: "POST", body: formData }),
      invalidatesTags: ["AiAgents"],
    }),
    getContent: build.query({
      query: ({ status = "draft", page = 1 } = {}) => listQuery("/admin/studio/content", { status, page, limit: 20 }),
      transformResponse: (response) => ({ ...toList(response), counts: response?.counts ?? {} }),
      providesTags: ["StudioContent"],
    }),
    saveContent: build.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/studio/content/${id}`, method: "POST", body }),
      invalidatesTags: ["StudioContent"],
    }),
    approveContent: build.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/studio/content/${id}/approve`, method: "POST", body }),
      invalidatesTags: ["StudioContent", "AiAgents", "StrixPosts"],
    }),
    rejectContent: build.mutation({
      query: (id) => ({ url: `/admin/studio/content/${id}/reject`, method: "POST" }),
      invalidatesTags: ["StudioContent"],
    }),
    bulkContent: build.mutation({
      query: (body) => ({ url: "/admin/studio/content/bulk", method: "POST", body }),
      invalidatesTags: ["StudioContent"],
    }),
    getOverview: build.query({
      query: () => "/admin/studio/overview",
      providesTags: ["StudioOverview"],
    }),
    saveSettings: build.mutation({
      query: (body) => ({ url: "/admin/studio/settings", method: "PUT", body }),
      invalidatesTags: ["StudioOverview"],
    }),
    runTask: build.mutation({
      query: (task) => ({ url: "/admin/studio/run", method: "POST", body: { task } }),
      invalidatesTags: ["StudioOverview"],
    }),
    getDelistCounts: build.query({
      query: () => "/admin/studio/delist",
      transformResponse: (response) => response?.counts ?? {},
      providesTags: ["StudioOverview"],
    }),
    delistAll: build.mutation({
      query: () => ({ url: "/admin/studio/delist", method: "POST", body: { confirm: "DELIST" } }),
      invalidatesTags: ["StudioOverview", "StudioContent", "AiAgents", "StrixPosts"],
    }),
  }),
});

export const {
  useGetAgentsQuery,
  useProvisionAgentsMutation,
  useSaveAgentMutation,
  useGetContentQuery,
  useSaveContentMutation,
  useApproveContentMutation,
  useRejectContentMutation,
  useBulkContentMutation,
  useGetOverviewQuery,
  useSaveSettingsMutation,
  useRunTaskMutation,
  useGetDelistCountsQuery,
  useDelistAllMutation,
} = studioApi;

export const CAP_LABELS = [
  ["posts", "Posts"],
  ["comments", "Comments"],
  ["channel_messages", "Channel messages"],
  ["replies", "Replies"],
];
