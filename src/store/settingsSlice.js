import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUserRole: "Base Super Admin",
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    changeRole: (state, action) => {
      state.currentUserRole = action.payload; 
    },
  },
});

export const { changeRole } = settingsSlice.actions;

export default settingsSlice.reducer;
