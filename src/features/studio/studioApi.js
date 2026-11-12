import { api } from "@/lib/api";

// The AI agents and the Content studio
const studioApi = api.enhanceEndpoints({ addTagTypes: ["AiAgents"] }).injectEndpoints({
  endpoints: (build) => ({
    getAgents: build.query({
      query: () => "/admin/ai-agents",
      transformResponse: (response) => response?.data ?? [],
      providesTags: ["AiAgents"],
    }),
    provisionAgents: build.mutation({
      query: () => ({ url: "/admin/ai-agents/provision", method: "POST" }),
      invalidatesTags: ["AiAgents"],
    }),
    saveAgent: build.mutation({
      query: ({ id, formData }) => ({ url: `/admin/ai-agents/${id}`, method: "POST", body: formData }),
      invalidatesTags: ["AiAgents"],
    }),
  }),
});

export const { useGetAgentsQuery, useProvisionAgentsMutation, useSaveAgentMutation } = studioApi;

export const CAP_LABELS = [
  ["posts", "Posts"],
  ["comments", "Comments"],
  ["channel_messages", "Channel messages"],
  ["replies", "Replies"],
];
