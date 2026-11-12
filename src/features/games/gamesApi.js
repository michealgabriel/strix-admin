import { api, listQuery, toList } from "@/lib/api";

export const gamesApi = api.enhanceEndpoints({ addTagTypes: ["Games", "Objectives", "Genres"] }).injectEndpoints({
  endpoints: (build) => ({
    getGames: build.query({
      query: ({ page = 1, search = "", limit = 12 } = {}) => listQuery("/games", { page, search, limit }),
      transformResponse: toList,
      providesTags: ["Games"],
    }),
    createGame: build.mutation({
      query: (formData) => ({ url: "/games", method: "POST", body: formData }),
      invalidatesTags: ["Games", "Dashboard"],
    }),
    updateGame: build.mutation({
      query: ({ id, formData }) => ({ url: `/games/${id}`, method: "POST", body: formData }),
      invalidatesTags: ["Games"],
    }),
    getObjectives: build.query({
      query: (gameId) => listQuery(`/games/${gameId}/objectives`, { limit: 100 }),
      transformResponse: (response) => toList(response).items,
      providesTags: (result, error, gameId) => [{ type: "Objectives", id: gameId }],
    }),
    addObjective: build.mutation({
      query: ({ gameId, ...body }) => ({ url: `/games/${gameId}/objectives`, method: "POST", body }),
      invalidatesTags: (result, error, { gameId }) => [{ type: "Objectives", id: gameId }],
    }),
    updateObjective: build.mutation({
      query: ({ gameId, objectiveId, ...body }) => ({ url: `/games/${gameId}/objectives/${objectiveId}`, method: "PUT", body }),
      invalidatesTags: (result, error, { gameId }) => [{ type: "Objectives", id: gameId }],
    }),
    // Every game, for matching an imported file by name
    getAllGames: build.query({
      query: () => listQuery("/games", { page: 1, limit: 500 }),
      transformResponse: (response) => toList(response).items,
      providesTags: ["Games"],
    }),
    deleteObjective: build.mutation({
      query: ({ gameId, objectiveId }) => ({ url: `/games/${gameId}/objectives/${objectiveId}`, method: "DELETE" }),
      invalidatesTags: (result, error, { gameId }) => [{ type: "Objectives", id: gameId }],
    }),
    getPlatforms: build.query({
      query: () => listQuery("/platforms"),
      transformResponse: (response) => toList(response).items,
    }),
    getGenres: build.query({
      query: ({ page = 1, search = "", limit = 20 } = {}) => listQuery("/genres", { page, search, limit }),
      transformResponse: toList,
      providesTags: ["Genres"],
    }),
    saveGenre: build.mutation({
      query: ({ id, ...body }) =>
        id ? { url: `/genres/${id}`, method: "PUT", body } : { url: "/genres", method: "POST", body },
      invalidatesTags: ["Genres", "Games"],
    }),
  }),
});

export const {
  useGetGamesQuery,
  useCreateGameMutation,
  useUpdateGameMutation,
  useGetObjectivesQuery,
  useAddObjectiveMutation,
  useUpdateObjectiveMutation,
  useDeleteObjectiveMutation,
  useGetAllGamesQuery,
  useGetPlatformsQuery,
  useGetGenresQuery,
  useSaveGenreMutation,
} = gamesApi;
