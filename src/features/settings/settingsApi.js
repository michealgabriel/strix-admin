import { api, listQuery, toList } from "@/lib/api";

const settingsApi = api.enhanceEndpoints({ addTagTypes: ["Countries", "Admins", "Roles"] }).injectEndpoints({
  endpoints: (build) => ({
    getCountries: build.query({
      query: () => "/systemcountries",
      transformResponse: (response) => response.data ?? [],
      providesTags: ["Countries"],
    }),
    saveCountry: build.mutation({
      query: ({ id, ...body }) =>
        id
          ? { url: `/systemcountries/${id}/update`, method: "POST", body }
          : { url: "/systemcountries", method: "POST", body },
      invalidatesTags: ["Countries"],
    }),
    getAdmins: build.query({
      query: ({ page = 1 } = {}) => listQuery("/systemadmins", { page, limit: 20 }),
      transformResponse: toList,
      providesTags: ["Admins"],
    }),
    saveAdmin: build.mutation({
      query: ({ id, ...body }) =>
        id ? { url: `/systemadmins/${id}`, method: "PUT", body } : { url: "/systemadmins", method: "POST", body },
      invalidatesTags: ["Admins"],
    }),
    deleteAdmin: build.mutation({
      query: (id) => ({ url: `/systemadmins/${id}`, method: "DELETE" }),
      invalidatesTags: ["Admins"],
    }),
    resetAdminPassword: build.mutation({
      query: (id) => ({ url: `/systemadmins/${id}/reset-password`, method: "POST" }),
    }),
    getRoles: build.query({
      query: () => listQuery("/systemroles", { limit: 100 }),
      transformResponse: (response) => toList(response).items,
      providesTags: ["Roles"],
    }),
    getPermissions: build.query({
      query: () => listQuery("/systempermissions", { limit: 500 }),
      transformResponse: (response) => toList(response).items,
      keepUnusedDataFor: 3600,
    }),
    saveRole: build.mutation({
      query: ({ id, ...body }) =>
        id ? { url: `/systemroles/${id}`, method: "PUT", body } : { url: "/systemroles", method: "POST", body },
      invalidatesTags: ["Roles", "Admins", "Me"],
    }),
    deleteRole: build.mutation({
      query: (id) => ({ url: `/systemroles/${id}`, method: "DELETE" }),
      invalidatesTags: ["Roles"],
    }),
  }),
});

export const {
  useGetCountriesQuery,
  useSaveCountryMutation,
  useGetAdminsQuery,
  useSaveAdminMutation,
  useDeleteAdminMutation,
  useResetAdminPasswordMutation,
  useGetRolesQuery,
  useGetPermissionsQuery,
  useSaveRoleMutation,
  useDeleteRoleMutation,
} = settingsApi;
