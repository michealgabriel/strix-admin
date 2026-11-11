import { createSlice } from "@reduxjs/toolkit";

const TOKEN_KEY = "strix_token";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    // Left over from the first version of the dashboard
    localStorage.removeItem("strix_adminData");
  } catch {
    // Storage blocked: the session simply won't survive a reload
  }
}

const initialState = {
  token: readToken(),
  admin: null,
  // Permission names from the server; the base admin gets all of them
  permissions: [],
  // Pusher settings from the server; null key means live updates are off
  realtime: null,
  // Set when the server ends the session, so the login page can say why
  endedReason: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedIn: (state, { payload }) => {
      state.token = payload.token;
      state.admin = payload.admin;
      state.permissions = payload.permissions ?? [];
      state.realtime = payload.realtime ?? null;
      state.endedReason = null;
      writeToken(payload.token);
    },
    profileLoaded: (state, { payload }) => {
      state.admin = payload.admin;
      state.permissions = payload.permissions ?? [];
      state.realtime = payload.realtime ?? null;
    },
    signedOut: (state) => {
      state.token = null;
      state.admin = null;
      state.permissions = [];
      state.realtime = null;
      state.endedReason = null;
      writeToken(null);
    },
    sessionEnded: (state) => {
      if (!state.token) return;
      state.token = null;
      state.admin = null;
      state.permissions = [];
      state.realtime = null;
      state.endedReason = "Your session has ended. Please sign in again.";
      writeToken(null);
    },
  },
});

export const { signedIn, profileLoaded, signedOut, sessionEnded } = authSlice.actions;
export default authSlice.reducer;

export const selectToken = (state) => state.auth.token;
export const selectAdmin = (state) => state.auth.admin;
export const selectPermissions = (state) => state.auth.permissions;
export const selectRealtime = (state) => state.auth.realtime;
