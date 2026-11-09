import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { secureFetch } from "../utils/api";

export const fetchDailyRewards = createAsyncThunk(
  "dailyRewards/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await secureFetch("/dailyrewards");
      if (!response.ok) throw new Error("Failed to fetch daily rewards");
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createDailyRewards = createAsyncThunk(
  "dailyRewards/create",
  async (manifestData, { rejectWithValue, dispatch }) => {
    try {
      const response = await secureFetch("/dailyrewards", {
        method: "POST",
        body: JSON.stringify({ manifest: manifestData }),
      });
      if (!response.ok) {
         const err = await response.json().catch(() => ({}));
         throw new Error(err.message || "Failed to create daily rewards");
      }
      const data = await response.json();
      dispatch(fetchDailyRewards()); // Refresh the state seamlessly!
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  activeReward: null,
  nextWeekReward: null,
  loading: false,
  error: null,
};

export const dailyRewardsSlice = createSlice({
  name: "dailyRewards",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyRewards.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDailyRewards.fulfilled, (state, action) => {
        state.loading = false;
        state.activeReward = action.payload.data?.active_reward || null;
        state.nextWeekReward = action.payload.data?.next_week_reward || null;
      })
      .addCase(fetchDailyRewards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dailyRewardsSlice.reducer;
