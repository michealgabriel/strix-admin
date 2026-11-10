import { api } from "@/lib/api";

const shopApi = api.enhanceEndpoints({ addTagTypes: ["Shop"] }).injectEndpoints({
  endpoints: (build) => ({
    getGoldPacks: build.query({ query: () => "/shop/currencypricing", transformResponse: (r) => r.data ?? [], providesTags: ["Shop"] }),
    getChests: build.query({ query: () => "/shop/chestpricing", transformResponse: (r) => r.data ?? [], providesTags: ["Shop"] }),
    saveGoldPacks: build.mutation({
      query: (data) => ({ url: "/shop/updateCurrencyPricings", method: "PUT", body: { data } }),
      invalidatesTags: ["Shop"],
    }),
    saveChests: build.mutation({
      query: (data) => ({ url: "/shop/updateChestPricings", method: "PUT", body: { data } }),
      invalidatesTags: ["Shop"],
    }),
  }),
});

export const { useGetGoldPacksQuery, useGetChestsQuery, useSaveGoldPacksMutation, useSaveChestsMutation } = shopApi;
