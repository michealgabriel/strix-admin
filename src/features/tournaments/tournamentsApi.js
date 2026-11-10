import { api, listQuery, toList } from "@/lib/api";

const tournamentsApi = api.enhanceEndpoints({ addTagTypes: ["Tournaments", "Tournament"] }).injectEndpoints({
  endpoints: (build) => ({
    getTournaments: build.query({
      query: ({ page = 1, type = "all", search = "" } = {}) => listQuery("/tournaments", { page, type, search, limit: 20 }),
      transformResponse: toList,
      providesTags: ["Tournaments"],
    }),
    getTournament: build.query({
      query: (id) => `/tournaments/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Tournament", id }],
    }),
    getTournamentTeams: build.query({
      query: (id) => listQuery(`/tournaments/${id}/teams`),
      transformResponse: (response) => toList(response).items,
      providesTags: (result, error, id) => [{ type: "Tournament", id }],
    }),
    getTournamentBrackets: build.query({
      query: (id) => listQuery(`/tournaments/${id}/brackets`),
      transformResponse: (response) => toList(response).items,
      providesTags: (result, error, id) => [{ type: "Tournament", id }],
    }),
    saveTournament: build.mutation({
      query: ({ id, formData }) => ({ url: id ? `/tournaments/${id}` : "/tournaments", method: "POST", body: formData }),
      invalidatesTags: (result, error, { id }) => ["Tournaments", { type: "Tournament", id }],
    }),
    setTeamStatus: build.mutation({
      query: ({ id, team, status }) => ({ url: `/tournaments/${id}/teams/${team}/status`, method: "POST", body: { status } }),
      invalidatesTags: (result, error, { id }) => [{ type: "Tournament", id }],
    }),
    startTournament: build.mutation({
      query: (id) => ({ url: `/tournaments/${id}/start`, method: "POST" }),
      invalidatesTags: (result, error, id) => ["Tournaments", { type: "Tournament", id }],
    }),
    eliminate: build.mutation({
      query: ({ id, positions }) => ({
        url: `/tournaments/${id}/brackets/eliminations`,
        method: "PATCH",
        body: { position_eliminations: positions },
      }),
      invalidatesTags: (result, error, { id }) => ["Tournaments", { type: "Tournament", id }],
    }),
  }),
});

export const {
  useGetTournamentsQuery,
  useGetTournamentQuery,
  useGetTournamentTeamsQuery,
  useGetTournamentBracketsQuery,
  useSaveTournamentMutation,
  useSetTeamStatusMutation,
  useStartTournamentMutation,
  useEliminateMutation,
} = tournamentsApi;

// "upcoming" | "live" | "completed"
export const stageOf = (t) => (t.is_completed ? "completed" : t.is_live ? "live" : "upcoming");
