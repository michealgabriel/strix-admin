import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { secureFetch } from "../utils/api";

export const fetchTotalGames = createAsyncThunk(
  "analytics/fetchTotalGames",
  async (_, { rejectWithValue }) => {
    try {
      const response = await secureFetch("/games");
      if (!response.ok) {
        throw new Error("Failed to fetch games data");
      }
      const data = await response.json();
      
      // Look for the total in pagination first, fallback to data length if pagination isn't present when limits are omitted
      const total = data.pagination?.total ?? data.data?.length ?? 0;
      return total;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPlayersData = createAsyncThunk(
  "analytics/fetchPlayersData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await secureFetch("/players");
      if (!response.ok) {
        throw new Error("Failed to fetch players data");
      }
      const data = await response.json();
      
      const totalPlayers = data.pagination?.total ?? data.data?.length ?? 0;
      
      // Calculate how many players registered this month
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const playersThisMonth = (data.data || []).filter(player => {
        if (!player.created_at) return false;
        const createdDate = new Date(player.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length;

      return { totalPlayers, playersThisMonth };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  totalGames: 0,
  loading: false,
  error: null,
  totalPlayers: 0,
  playersThisMonth: 0,
  loadingPlayers: false,
  errorPlayers: null,
};

export const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTotalGames.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTotalGames.fulfilled, (state, action) => {
        state.loading = false;
        state.totalGames = action.payload;
      })
      .addCase(fetchTotalGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Players data cases
      .addCase(fetchPlayersData.pending, (state) => {
        state.loadingPlayers = true;
        state.errorPlayers = null;
      })
      .addCase(fetchPlayersData.fulfilled, (state, action) => {
        state.loadingPlayers = false;
        state.totalPlayers = action.payload.totalPlayers;
        state.playersThisMonth = action.payload.playersThisMonth;
      })
      .addCase(fetchPlayersData.rejected, (state, action) => {
        state.loadingPlayers = false;
        state.errorPlayers = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
