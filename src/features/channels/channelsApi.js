import { api, listQuery, toList } from "@/lib/api";

const channelsApi = api.enhanceEndpoints({ addTagTypes: ["Channels", "Channel"] }).injectEndpoints({
  endpoints: (build) => ({
    getChannels: build.query({
      query: ({ page = 1, search = "", strix = false } = {}) => listQuery("/channels", { page, search, is_strix: strix ? 1 : "", limit: 20 }),
      transformResponse: toList,
      providesTags: ["Channels"],
    }),
    saveChannel: build.mutation({
      query: ({ id, formData }) => ({ url: id ? `/channels/${id}` : "/channels", method: "POST", body: formData }),
      invalidatesTags: ["Channels"],
    }),
    getChannelMembers: build.query({
      query: ({ id, page = 1 }) => listQuery(`/channels/${id}/members`, { page, limit: 20 }),
      transformResponse: toList,
      providesTags: (r, e, { id }) => [{ type: "Channel", id }],
    }),
    getJoinRequests: build.query({
      query: ({ id, page = 1 }) => listQuery(`/channels/${id}/requests`, { page, limit: 20 }),
      transformResponse: toList,
      providesTags: (r, e, { id }) => [{ type: "Channel", id }],
    }),
    decideJoinRequest: build.mutation({
      query: ({ id, requestId, accept }) => ({ url: `/channels/${id}/requests/${requestId}/acceptdeny`, params: { accept: accept ? "true" : "false" } }),
      invalidatesTags: (r, e, { id }) => ["Channels", { type: "Channel", id }],
    }),
    getChannelMessages: build.query({
      query: ({ id }) => listQuery(`/channels/${id}/messages`, { limit: 50 }),
      transformResponse: (response) => toList(response).items.slice().reverse(),
      providesTags: (r, e, { id }) => [{ type: "Channel", id }],
    }),
    sendChannelMessage: build.mutation({
      query: ({ id, message }) => ({ url: `/channels/${id}/messages`, method: "POST", body: { message } }),
      invalidatesTags: (r, e, { id }) => [{ type: "Channel", id }],
    }),
  }),
});

export const {
  useGetChannelsQuery,
  useSaveChannelMutation,
  useGetChannelMembersQuery,
  useGetJoinRequestsQuery,
  useDecideJoinRequestMutation,
  useGetChannelMessagesQuery,
  useSendChannelMessageMutation,
} = channelsApi;
