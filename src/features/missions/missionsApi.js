import { api } from "@/lib/api";

const missionsApi = api.enhanceEndpoints({ addTagTypes: ["Missions"] }).injectEndpoints({
  endpoints: (build) => ({
    getPowerMissions: build.query({
      query: () => "/powermissions",
      transformResponse: (response) => ({
        active: response.data?.active_power_missions ?? [],
        next: response.data?.next_week_power_missions ?? [],
        seasonEndsAt: response.data?.season_ends_at ?? null,
        nextSeasonEndsAt: response.data?.next_season_ends_at ?? null,
      }),
      providesTags: ["Missions"],
    }),
    getDailyMissions: build.query({
      query: () => "/dailymissions",
      transformResponse: (response) => response.data ?? [],
      providesTags: ["Missions"],
    }),
    getMissionActions: build.query({
      query: () => "/missionactionitems",
      transformResponse: (response) => response.data ?? [],
      keepUnusedDataFor: 3600,
    }),
    savePowerMissions: build.mutation({
      query: ({ missions, replaceNext }) => ({
        url: replaceNext ? "/powermissions/next" : "/powermissions",
        method: replaceNext ? "PUT" : "POST",
        body: { manifest: { name: "Power Missions Manifest", data: missions } },
      }),
      invalidatesTags: ["Missions"],
    }),
  }),
});

export const { useGetPowerMissionsQuery, useGetDailyMissionsQuery, useGetMissionActionsQuery, useSavePowerMissionsMutation } =
  missionsApi;
