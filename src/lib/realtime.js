import Pusher from "pusher-js";
import { API_URL } from "@/lib/api";

// One Pusher connection for the signed-in admin, rebuilt when the token or settings change
let client = null;
let clientId = null;

export function realtimeClient({ key, cluster, token }) {
  if (!key || !token) {
    disconnectRealtime();
    return null;
  }

  const id = `${key}|${cluster}|${token}`;
  if (client && clientId === id) return client;

  disconnectRealtime();
  client = new Pusher(key, {
    cluster,
    forceTLS: true,
    // Private channels are authorized by the backend with the admin's token
    channelAuthorization: {
      endpoint: `${API_URL}/broadcasting/auth`,
      transport: "ajax",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    },
  });
  clientId = id;
  return client;
}

export function disconnectRealtime() {
  client?.disconnect();
  client = null;
  clientId = null;
}
