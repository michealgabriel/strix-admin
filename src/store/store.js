import { configureStore } from "@reduxjs/toolkit";
import settingsReducer from "./settingsSlice";
import authReducer from "./authSlice";
import analyticsReducer from "./analyticsSlice";
import playersListReducer from "./playersListSlice";
import genresListReducer from "./genresListSlice";
import playerProfileReducer from "./playerProfileSlice";
import gamesListReducer from "./gamesListSlice";
import dailyRewardsReducer from "./dailyRewardsSlice";

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    auth: authReducer,
    analytics: analyticsReducer,
    playersList: playersListReducer,
    genresList: genresListReducer,
    playerProfile: playerProfileReducer,
    gamesList: gamesListReducer,
    dailyRewards: dailyRewardsReducer,
  },
});
