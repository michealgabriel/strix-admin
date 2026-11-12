import { api, listQuery, toList } from "@/lib/api";

// Strix's own posts in the community feed
const postsApi = api.enhanceEndpoints({ addTagTypes: ["StrixPosts", "Campaigns"] }).injectEndpoints({
  endpoints: (build) => ({
    getStrixPosts: build.query({
      query: ({ page = 1, search = "", status = "" } = {}) => listQuery("/admin/posts", { page, search, status, limit: 20 }),
      transformResponse: toList,
      providesTags: ["StrixPosts"],
    }),
    saveStrixPost: build.mutation({
      query: ({ id, formData }) => ({ url: id ? `/admin/posts/${id}` : "/admin/posts", method: "POST", body: formData }),
      invalidatesTags: ["StrixPosts", "Campaigns"],
    }),
    deleteStrixPost: build.mutation({
      query: (id) => ({ url: `/admin/posts/${id}`, method: "DELETE" }),
      invalidatesTags: ["StrixPosts", "Campaigns"],
    }),
  }),
});

export const { useGetStrixPostsQuery, useSaveStrixPostMutation, useDeleteStrixPostMutation } = postsApi;

// The multipart body for a post. Arrays go as tagged_games[]; an emptied list is sent as clear_tagged_games.
export function postFormData(values, { creating }) {
  const form = new FormData();
  form.append("post_title", values.post_title.trim());
  form.append("post_text_content", values.post_text_content.trim());
  form.append("is_draft", values.is_draft ? "1" : "0");
  if (values.tagged_games.length) values.tagged_games.forEach((id) => form.append("tagged_games[]", String(id)));
  else if (!creating) form.append("clear_tagged_games", "1");
  if (values.media instanceof File) form.append(values.media.type === "video/mp4" ? "post_video" : "post_image", values.media);
  else if (values.removeMedia) form.append("remove_media", "1");
  if (values.notify && !values.is_draft) {
    form.append("notify", "1");
    if (values.push_title.trim()) form.append("push_title", values.push_title.trim());
    if (values.push_body.trim()) form.append("push_body", values.push_body.trim());
  }
  return form;
}
