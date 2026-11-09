import { createSlice } from "@reduxjs/toolkit";

// Helper functions to safely pull from memory before Redux boots up
const loadToken = () => localStorage.getItem("strix_token") || null;
const loadAdminData = () => {
  const data = localStorage.getItem("strix_adminData");
  return data ? JSON.parse(data) : null;
};

const savedToken = loadToken();

const initialState = {
  isAuthenticated: !!savedToken, // Instantly true if they have a token in storage!
  token: savedToken, 
  adminData: loadAdminData(), 
  permissions: [], // Intentionally NOT saved to storage. This forces the app to re-sync permissions from the backend on every reload for maximum security.
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.adminData = action.payload.adminData;

      // Save credentials into browser storage instantly!
      localStorage.setItem("strix_token", action.payload.token);
      localStorage.setItem("strix_adminData", JSON.stringify(action.payload.adminData));
    },
    logout: (state) => {
      // Reset everything back to logged out
      state.isAuthenticated = false;
      state.token = null;
      state.adminData = null;
      state.permissions = [];

      // Wipe from browser storage so nobody else can get in!
      localStorage.removeItem("strix_token");
      localStorage.removeItem("strix_adminData");
    },
    setPermissions: (state, action) => {
      // Saves the array of permission strings safely into the vault
      state.permissions = action.payload;
    },
  },
});

export const { loginSuccess, logout, setPermissions } = authSlice.actions;

export default authSlice.reducer;
