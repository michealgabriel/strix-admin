import { api, listQuery, toList } from "@/lib/api";

const topupsApi = api.enhanceEndpoints({ addTagTypes: ["TopupPurchases", "TopupGames"] }).injectEndpoints({
  endpoints: (build) => ({
    getTopupPurchases: build.query({
      query: ({ page = 1, status = "pending", kind = "purchases", search = "" } = {}) =>
        listQuery("/topuppurchases", { page, status: status === "all" ? "" : status, kind, search, limit: 20 }),
      transformResponse: toList,
      providesTags: ["TopupPurchases"],
    }),
    decideTopup: build.mutation({
      query: ({ id, approve, message }) => ({
        url: `/topuppurchases/${id}/approvedecline`,
        method: "POST",
        params: { approve: approve ? "true" : "false" },
        body: message ? { message } : {},
      }),
      invalidatesTags: ["TopupPurchases", "Dashboard"],
    }),
    getTopupGames: build.query({
      query: ({ page = 1 } = {}) => listQuery("/topupgames", { page, limit: 20 }),
      transformResponse: toList,
      providesTags: ["TopupGames"],
    }),
    saveTopupGame: build.mutation({
      query: ({ id, formData }) => ({ url: id ? `/topupgames/${id}` : "/topupgames", method: "POST", body: formData }),
      invalidatesTags: ["TopupGames"],
    }),
  }),
});

export const { useGetTopupPurchasesQuery, useDecideTopupMutation, useGetTopupGamesQuery, useSaveTopupGameMutation } = topupsApi;
