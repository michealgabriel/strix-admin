import { api, listQuery, toList } from "@/lib/api";

const campaignsApi = api.enhanceEndpoints({ addTagTypes: ["Campaigns", "Campaign"] }).injectEndpoints({
  endpoints: (build) => ({
    getCampaigns: build.query({
      query: ({ page = 1 } = {}) => listQuery("/admin/push-campaigns", { page, limit: 20 }),
      transformResponse: toList,
      providesTags: ["Campaigns"],
    }),
    getCampaign: build.query({
      query: (id) => `/admin/push-campaigns/${id}`,
      transformResponse: (r) => r.campaign ?? r.data ?? r,
      providesTags: (r, e, id) => [{ type: "Campaign", id: String(id) }],
    }),
    saveCampaign: build.mutation({
      query: ({ id, ...body }) => (id ? { url: `/admin/push-campaigns/${id}`, method: "PUT", body } : { url: "/admin/push-campaigns", method: "POST", body }),
      invalidatesTags: (r, e, { id }) => ["Campaigns", ...(id ? [{ type: "Campaign", id: String(id) }] : [])],
    }),
    campaignAudience: build.mutation({
      query: (segment) => ({ url: "/admin/push-campaigns/audience", method: "POST", body: { segment } }),
    }),
    testCampaign: build.mutation({
      query: ({ id, userId }) => ({ url: `/admin/push-campaigns/${id}/test`, method: "POST", body: { user_id: userId } }),
    }),
    scheduleCampaign: build.mutation({
      query: ({ id, broadcast }) => ({ url: `/admin/push-campaigns/${id}/schedule`, method: "POST", body: broadcast ? { confirm: "BROADCAST" } : {} }),
      invalidatesTags: (r, e, { id }) => ["Campaigns", { type: "Campaign", id: String(id) }],
    }),
    cancelCampaign: build.mutation({
      query: (id) => ({ url: `/admin/push-campaigns/${id}/cancel`, method: "POST" }),
      invalidatesTags: (r, e, id) => ["Campaigns", { type: "Campaign", id: String(id) }],
    }),
    getPushStats: build.query({
      query: (days = 7) => `/admin/notifications/stats?days=${days}`,
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignQuery,
  useSaveCampaignMutation,
  useCampaignAudienceMutation,
  useTestCampaignMutation,
  useScheduleCampaignMutation,
  useCancelCampaignMutation,
  useGetPushStatsQuery,
} = campaignsApi;
