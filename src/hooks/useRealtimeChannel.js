import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectRealtime, selectToken } from "@/features/auth/authSlice";
import { realtimeClient } from "@/lib/realtime";

/**
 * Listens to a private Pusher channel while the component is mounted.
 * handlers: { "event.name": (payload) => … }. onReconnect runs when the connection comes back after a drop,
 * because Pusher doesn't replay what was missed.
 * Returns whether live updates are working, so the page can fall back to polling when they aren't.
 */
export function useRealtimeChannel(channelName, handlers, onReconnect) {
  const token = useSelector(selectToken);
  const settings = useSelector(selectRealtime);
  const [live, setLive] = useState(false);
  const handlersRef = useRef(handlers);
  const reconnectRef = useRef(onReconnect);
  handlersRef.current = handlers;
  reconnectRef.current = onReconnect;

  useEffect(() => {
    const client = realtimeClient({ key: settings?.pusher_key, cluster: settings?.pusher_cluster, token });
    if (!client || !channelName) {
      setLive(false);
      return undefined;
    }

    let subscribed = false;
    let wasLive = false;
    let beenLive = false;
    const update = () => {
      const now = subscribed && client.connection.state === "connected";
      // Back after a drop: whatever happened meanwhile was missed
      if (now && !wasLive && beenLive) reconnectRef.current?.();
      beenLive ||= now;
      wasLive = now;
      setLive(now);
    };

    const channel = client.subscribe(channelName);
    channel.bind("pusher:subscription_succeeded", () => {
      subscribed = true;
      update();
    });
    channel.bind("pusher:subscription_error", () => {
      subscribed = false;
      update();
    });
    channel.bind_global((event, payload) => {
      if (!event.startsWith("pusher:")) handlersRef.current?.[event]?.(payload);
    });
    client.connection.bind("state_change", update);

    return () => {
      client.connection.unbind("state_change", update);
      channel.unbind_all();
      client.unsubscribe(channelName);
      setLive(false);
    };
  }, [channelName, token, settings?.pusher_key, settings?.pusher_cluster]);

  return live;
}
