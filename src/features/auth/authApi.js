import { api } from "@/lib/api";
import { profileLoaded, signedIn, signedOut } from "./authSlice";

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({
      query: (credentials) => ({ url: "/auth/admin/login", method: "POST", body: credentials }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            signedIn({
              token: data.admin_access_token,
              admin: data.admin,
              permissions: data.permissions,
            }),
          );
        } catch {
          // The login form shows the error
        }
      },
    }),
    me: build.query({
      query: () => "/auth/admin/me",
      providesTags: ["Me"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(profileLoaded({ admin: data.admin, permissions: data.permissions }));
        } catch {
          // A 401 already ends the session in the base query
        }
      },
    }),
    logout: build.mutation({
      query: () => ({ url: "/auth/logout" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        // Sign out locally whether or not the server answers
        try {
          await queryFulfilled;
        } catch {
          // ignore
        }
        dispatch(signedOut());
        dispatch(api.util.resetApiState());
      },
    }),
  }),
});

export const { useLoginMutation, useMeQuery, useLogoutMutation } = authApi;
