import { api, listQuery, toList } from "@/lib/api";

const dashboardApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query({
      query: () => "/admin/dashboard",
      providesTags: ["Dashboard"],
    }),
    getNewestPlayers: build.query({
      query: () => listQuery("/players", { limit: 8 }),
      transformResponse: (response) => toList(response).items,
    }),
  }),
});

export const { useGetDashboardQuery, useGetNewestPlayersQuery } = dashboardApi;
