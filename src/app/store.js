import { configureStore, isRejectedWithValue } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import authReducer from "@/features/auth/authSlice";
import analyticsReducer from "@/store/analyticsSlice";
import playersListReducer from "@/store/playersListSlice";
import genresListReducer from "@/store/genresListSlice";
import playerProfileReducer from "@/store/playerProfileSlice";
import gamesListReducer from "@/store/gamesListSlice";
import dailyRewardsReducer from "@/store/dailyRewardsSlice";

// A failed change (create, update, delete…) always tells the admin why
const mutationErrorToasts = () => (next) => (action) => {
  if (
    isRejectedWithValue(action) &&
    action.meta?.arg?.type === "mutation" &&
    action.payload?.status !== 401 &&
    action.meta.arg.endpointName !== "login"
  ) {
    toast.error(errorMessage(action.payload));
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    // Slices from the first version; each goes away as its page moves to RTK Query
    analytics: analyticsReducer,
    playersList: playersListReducer,
    genresList: genresListReducer,
    playerProfile: playerProfileReducer,
    gamesList: gamesListReducer,
    dailyRewards: dailyRewardsReducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware, mutationErrorToasts),
});
