import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { secureFetch } from "../utils/api";

export const fetchGamesList = createAsyncThunk(
  "gamesList/fetchGamesList",
  async ({ page = 1, limit = 12, search = "" }, { rejectWithValue }) => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append("page", page);
      urlParams.append("limit", limit);
      if (search) {
        urlParams.append("search", search);
      }

      const response = await secureFetch(`/games?${urlParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch games list");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createGame = createAsyncThunk(
  "gamesList/createGame",
  async (gameData, { rejectWithValue, dispatch, getState }) => {
    try {
      const formData = new FormData();
      formData.append("system_game_platform_id", gameData.system_game_platform_id);
      formData.append("system_game_genre_id", gameData.system_game_genre_id);
      formData.append("name", gameData.name);
      formData.append("status", gameData.status);
      
      if (gameData.image) {
        formData.append("cover_image", gameData.image);
      }

      const response = await secureFetch("/games", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create game");
      }
      
      const data = await response.json();
      
      // Auto-refresh the current page to perfectly see the new game appear!
      const currentPage = getState().gamesList.currentPage;
      dispatch(fetchGamesList({ page: currentPage, limit: 12 }));
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateGame = createAsyncThunk(
  "gamesList/updateGame",
  async (gameData, { rejectWithValue, dispatch, getState }) => {
    try {
      if (!gameData.id) {
        throw new Error("CRITICAL FRONTEND ERROR: gameData.id is undefined!");
      }

      const formData = new FormData();
      formData.append("system_game_platform_id", gameData.system_game_platform_id);
      formData.append("system_game_genre_id", gameData.system_game_genre_id);
      formData.append("name", gameData.name);
      formData.append("status", gameData.status);
      
      if (gameData.image) {
        formData.append("cover_image", gameData.image);
      }

      // Send a clean POST request directly to /games/{id} as instructed
      const response = await secureFetch(`/games/${gameData.id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update game");
      }
      
      const data = await response.json();
      
      // Auto-refresh the page to fetch the newly edited data!
      const currentPage = getState().gamesList.currentPage;
      dispatch(fetchGamesList({ page: currentPage, limit: 12 }));
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  games: [],
  totalPages: 1,
  currentPage: 1,
  loading: false,
  error: null,
};

export const gamesListSlice = createSlice({
  name: "gamesList",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGamesList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGamesList.fulfilled, (state, action) => {
        state.loading = false;
        state.games = action.payload.data || [];
        const totalItems = action.payload.pagination?.total || 0;
        const pageLimit = action.payload.pagination?.page_limit || 12;
        state.totalPages = Math.ceil(totalItems / pageLimit) || 1;
      })
      .addCase(fetchGamesList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentPage } = gamesListSlice.actions;
export default gamesListSlice.reducer;
