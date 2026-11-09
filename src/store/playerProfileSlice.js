import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { secureFetch } from "../utils/api";

export const fetchPlayerProfile = createAsyncThunk(
  "playerProfile/fetchPlayerProfile",
  async (playerId, { rejectWithValue }) => {
    try {
      const response = await secureFetch(`/players/${playerId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch player profile");
      }
      const data = await response.json();
      return data.player; // Response has { message, player: {...} }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  playerData: null,
  loading: false,
  error: null,
};

export const playerProfileSlice = createSlice({
  name: "playerProfile",
  initialState,
  reducers: {
    clearPlayerProfile: (state) => {
      state.playerData = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayerProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.playerData = action.payload;
      })
      .addCase(fetchPlayerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPlayerProfile } = playerProfileSlice.actions;
export default playerProfileSlice.reducer;
