import { store } from "../store/store";
import { logout } from "../store/authSlice";

// Think of this as the "Bouncer" for all your API requests.
// You simply provide the endpoint (e.g. "/systemroles") and it does the rest!
export const secureFetch = async (endpoint, options = {}) => {
  // 1. Look inside the Redux Vault and grab your active JWT Token
  const token = store.getState().auth.token;

  const defaultHeaders = {};
  
  // Only force JSON if we aren't uploading a multipart file buffer!
  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // 2. If you are logged in, perfectly format the "Bearer" token header
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers, // Allow overriding headers if necessary
    },
  };

  // 3. Automatically attach your base API URL and fire the request!
  const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, mergedOptions);
  
  // EXTRA SECURITY: If any API request ever returns 401 Unauthorized (e.g. your token expired),
  // this will instantly wipe your vault and force you back to the login screen!
  if (response.status === 401) {
    store.dispatch(logout());
  }

  return response;
};
