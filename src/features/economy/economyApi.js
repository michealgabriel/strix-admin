import { api } from "@/lib/api";

const economyApi = api.enhanceEndpoints({ addTagTypes: ["Economy", "EconomySettings"] }).injectEndpoints({
  endpoints: (build) => ({
    getEconomy: build.query({
      query: (days = 30) => `/admin/economy?days=${days}`,
      providesTags: ["Economy"],
    }),
    getEconomySettings: build.query({
      query: () => "/admin/economy/settings",
      providesTags: ["EconomySettings"],
    }),
    saveEconomySettings: build.mutation({
      query: (body) => ({ url: "/admin/economy/settings", method: "PUT", body }),
      invalidatesTags: ["EconomySettings", "Economy"],
    }),
  }),
});

export const { useGetEconomyQuery, useGetEconomySettingsQuery, useSaveEconomySettingsMutation } = economyApi;
