import { api, listQuery, toList } from "@/lib/api";

// Adds a message to a chat's cached list unless it's already there (the socket and the send response can both deliver it)
export function upsertMessage(messages, message) {
  if (!message?.id || messages.some((m) => m.id === message.id)) return;
  messages.push(message);
  messages.sort((a, b) => a.id - b.id);
}

const supportApi = api.enhanceEndpoints({ addTagTypes: ["Support", "SupportChat", "SupportMessages"] }).injectEndpoints({
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
      providesTags: (r, e, id) => [{ type: "SupportChat", id: String(id) }],
    }),
    getSupportMessages: build.query({
      query: (id) => listQuery(`/support/sessions/${id}/messages`, { limit: 100 }),
      transformResponse: (response) => toList(response).items.slice().reverse(),
      providesTags: (r, e, id) => [{ type: "SupportMessages", id: String(id) }],
    }),
    sendSupportMessage: build.mutation({
      query: ({ id, message }) => ({ url: `/support/sessions/${id}/messages`, method: "POST", body: { message } }),
      // Show the saved message straight away; the first reply also takes the chat
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(supportApi.util.updateQueryData("getSupportMessages", id, (draft) => upsertMessage(draft, data.support_message)));
        } catch {
          // toast from the store
        }
      },
      invalidatesTags: (r, e, { id }) => ["Support", { type: "SupportChat", id: String(id) }],
    }),
    joinSupportSession: build.mutation({
      query: (id) => ({ url: `/support/sessions/${id}/adminjoin`, method: "POST" }),
      invalidatesTags: (r, e, id) => ["Support", { type: "SupportChat", id: String(id) }],
    }),
    closeSupportSession: build.mutation({
      query: (id) => ({ url: `/support/sessions/${id}/close`, method: "PATCH" }),
      invalidatesTags: (r, e, id) => ["Support", "Dashboard", { type: "SupportChat", id: String(id) }],
    }),
  }),
});

export { supportApi };

export const {
  useGetSupportSessionsQuery,
  useGetSupportSessionQuery,
  useGetSupportMessagesQuery,
  useSendSupportMessageMutation,
  useJoinSupportSessionMutation,
  useCloseSupportSessionMutation,
} = supportApi;
