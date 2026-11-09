import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { secureFetch } from "../utils/api";

export const fetchGenresList = createAsyncThunk(
  "genresList/fetchGenresList",
  async ({ page, search }, { rejectWithValue }) => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append("page", page);
      urlParams.append("limit", 3);
      if (search) {
        urlParams.append("search", search);
      }

      const response = await secureFetch(`/genres?${urlParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch genres list");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  genres: [],
  totalPages: 1,
  currentPage: 1,
  loading: false,
  error: null,
};

export const genresListSlice = createSlice({
  name: "genresList",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGenresList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGenresList.fulfilled, (state, action) => {
        state.loading = false;
        state.genres = action.payload.data || [];
        const totalItems = action.payload.pagination?.total || 0;
        state.totalPages = Math.ceil(totalItems / 3) || 1;
      })
      .addCase(fetchGenresList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentPage } = genresListSlice.actions;
export default genresListSlice.reducer;
