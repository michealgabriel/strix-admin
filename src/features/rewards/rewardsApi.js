import { api } from "@/lib/api";

const rewardsApi = api.enhanceEndpoints({ addTagTypes: ["DailyRewards", "StrixPass"] }).injectEndpoints({
  endpoints: (build) => ({
    getClaimableItems: build.query({
      query: () => "/claimableitems",
      transformResponse: (response) => response.data ?? [],
      keepUnusedDataFor: 3600,
    }),
    getDailyRewards: build.query({
      query: () => "/dailyrewards",
      transformResponse: (response) => ({
        active: withManifest(response.data?.active_reward),
        next: withManifest(response.data?.next_week_reward),
      }),
      providesTags: ["DailyRewards"],
    }),
    // A new week is queued after the last one; `next` replaces the queued week
    saveDailyRewards: build.mutation({
      query: ({ manifest, replaceNext }) => ({
        url: replaceNext ? "/dailyrewards/next" : "/dailyrewards",
        method: replaceNext ? "PUT" : "POST",
        body: { manifest },
      }),
      invalidatesTags: ["DailyRewards"],
    }),
    getStrixPass: build.query({
      query: () => "/strixpass",
      transformResponse: (response) => ({
        active: withManifest(response.data?.active_pass),
        next: withManifest(response.data?.next_month_pass),
      }),
      providesTags: ["StrixPass"],
    }),
    saveStrixPass: build.mutation({
      query: ({ manifest, replaceNext }) => ({
        url: replaceNext ? "/strixpass/next" : "/strixpass",
        method: replaceNext ? "PUT" : "POST",
        body: { manifest },
      }),
      invalidatesTags: ["StrixPass"],
    }),
  }),
});

function withManifest(record) {
  if (!record) return null;
  let manifest = null;
  try {
    manifest = JSON.parse(record.manifest_file);
  } catch {
    manifest = null;
  }
  return { ...record, manifest };
}

export const {
  useGetClaimableItemsQuery,
  useGetDailyRewardsQuery,
  useSaveDailyRewardsMutation,
  useGetStrixPassQuery,
  useSaveStrixPassMutation,
} = rewardsApi;
