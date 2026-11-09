import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { secureFetch } from "../utils/api";

export const fetchPlayersList = createAsyncThunk(
  "playersList/fetchPlayersList",
  async ({ page, search }, { rejectWithValue }) => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append("page", page);
      urlParams.append("limit", 3); // 3 items per page explicitly requested
      if (search) {
        urlParams.append("search", search);
      }

      const response = await secureFetch(`/players?${urlParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch players list");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  players: [],
  totalPages: 1,
  currentPage: 1,
  loading: false,
  error: null,
};

export const playersListSlice = createSlice({
  name: "playersList",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayersList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayersList.fulfilled, (state, action) => {
        state.loading = false;
        state.players = action.payload.data || [];
        const totalItems = action.payload.pagination?.total || 0;
        state.totalPages = Math.ceil(totalItems / 3) || 1;
      })
      .addCase(fetchPlayersList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentPage } = playersListSlice.actions;
export default playersListSlice.reducer;
