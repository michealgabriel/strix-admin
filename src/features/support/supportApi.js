import { api, listQuery, toList } from "@/lib/api";

const supportApi = api.enhanceEndpoints({ addTagTypes: ["Support", "SupportChat"] }).injectEndpoints({
  endpoints: (build) => ({
    getSupportSessions: build.query({
      query: ({ page = 1, status = "open", assigned = "", search = "" } = {}) =>
        listQuery("/support/sessions", { page, status: status === "all" ? "" : status, assigned, search, limit: 30 }),
      transformResponse: toList,
      providesTags: ["Support"],
    }),
    getSupportSession: build.query({
      query: (id) => `/support/sessions/${id}`,
      transformResponse: (response) => response.session,
      providesTags: (r, e, id) => [{ type: "SupportChat", id }],
    }),
    getSupportMessages: build.query({
      query: (id) => listQuery(`/support/sessions/${id}/messages`, { limit: 100 }),
      transformResponse: (response) => toList(response).items.slice().reverse(),
      providesTags: (r, e, id) => [{ type: "SupportChat", id }],
    }),
    sendSupportMessage: build.mutation({
      query: ({ id, message }) => ({ url: `/support/sessions/${id}/messages`, method: "POST", body: { message } }),
      invalidatesTags: (r, e, { id }) => ["Support", { type: "SupportChat", id }],
    }),
    joinSupportSession: build.mutation({
      query: (id) => ({ url: `/support/sessions/${id}/adminjoin`, method: "POST" }),
      invalidatesTags: (r, e, id) => ["Support", { type: "SupportChat", id }],
    }),
    closeSupportSession: build.mutation({
      query: (id) => ({ url: `/support/sessions/${id}/close`, method: "PATCH" }),
      invalidatesTags: (r, e, id) => ["Support", "Dashboard", { type: "SupportChat", id }],
    }),
  }),
});

export const {
  useGetSupportSessionsQuery,
  useGetSupportSessionQuery,
  useGetSupportMessagesQuery,
  useSendSupportMessageMutation,
  useJoinSupportSessionMutation,
  useCloseSupportSessionMutation,
} = supportApi;
