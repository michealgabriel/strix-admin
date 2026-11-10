import { api, listQuery, toList } from "@/lib/api";

const playersApi = api.enhanceEndpoints({ addTagTypes: ["Players", "Player"] }).injectEndpoints({
  endpoints: (build) => ({
    getPlayers: build.query({
      query: ({ page = 1, search = "", sort = "" } = {}) => listQuery("/players", { page, search, sort, limit: 20 }),
      transformResponse: toList,
      providesTags: ["Players"],
    }),
    getPlayer: build.query({
      query: (id) => `/players/${id}`,
      providesTags: (result, error, id) => [{ type: "Player", id }],
    }),
    getPlayerWallet: build.query({
      query: ({ id, page = 1, currency = "" }) => listQuery(`/admin/players/${id}/wallet`, { page, currency, limit: 15 }),
      transformResponse: toList,
      providesTags: (result, error, { id }) => [{ type: "Player", id }],
    }),
    getPlayerReliability: build.query({
      query: ({ id, page = 1 }) => listQuery(`/admin/players/${id}/reliability`, { page }),
      transformResponse: (response) => ({ ...toList(response), player: response?.player }),
    }),
    suspendPlayer: build.mutation({
      query: ({ id, reason, days }) => ({ url: `/admin/players/${id}/suspend`, method: "POST", body: { reason, ...(days ? { days } : {}) } }),
      invalidatesTags: (r, e, { id }) => ["Players", { type: "Player", id: String(id) }],
    }),
    unsuspendPlayer: build.mutation({
      query: (id) => ({ url: `/admin/players/${id}/unsuspend`, method: "POST" }),
      invalidatesTags: (r, e, id) => ["Players", { type: "Player", id: String(id) }],
    }),
    adjustWallet: build.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/players/${id}/wallet`, method: "POST", body }),
      invalidatesTags: (r, e, { id }) => ["Players", { type: "Player", id: String(id) }],
    }),
  }),
});

export const { useSuspendPlayerMutation, useUnsuspendPlayerMutation, useAdjustWalletMutation } = playersApi;
export const { useGetPlayersQuery, useGetPlayerQuery, useGetPlayerWalletQuery, useGetPlayerReliabilityQuery } = playersApi;
