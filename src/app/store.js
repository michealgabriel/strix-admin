import { configureStore, isRejectedWithValue } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import authReducer from "@/features/auth/authSlice";

// A failed change (create, update, delete…) always tells the admin why.
// Validation errors on fields are left to the form, which shows them next to each field.
const mutationErrorToasts = () => (next) => (action) => {
  const payload = action.payload;
  const fieldErrors = payload?.status === 422 && payload?.data?.errors && Object.keys(payload.data.errors).length > 0;
  if (
    isRejectedWithValue(action) &&
    action.meta?.arg?.type === "mutation" &&
    payload?.status !== 401 &&
    !fieldErrors &&
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
  },
  middleware: (getDefault) => getDefault().concat(api.middleware, mutationErrorToasts),
});
