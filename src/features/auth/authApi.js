import { api } from "@/lib/api";
import { disconnectRealtime } from "@/lib/realtime";
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
              realtime: data.realtime,
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
          dispatch(profileLoaded({ admin: data.admin, permissions: data.permissions, realtime: data.realtime }));
        } catch {
          // A 401 already ends the session in the base query
        }
      },
    }),
    changePassword: build.mutation({
      query: (body) => ({ url: "/auth/admin/password", method: "PUT", body }),
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
        disconnectRealtime();
        dispatch(signedOut());
        dispatch(api.util.resetApiState());
      },
    }),
  }),
});

export const { useLoginMutation, useMeQuery, useLogoutMutation, useChangePasswordMutation } = authApi;
