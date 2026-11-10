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
  }),
});

export const { useGetPlayersQuery, useGetPlayerQuery, useGetPlayerWalletQuery, useGetPlayerReliabilityQuery } = playersApi;
