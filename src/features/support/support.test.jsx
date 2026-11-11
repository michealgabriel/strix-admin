import { act, screen, waitFor } from "@testing-library/react";
import SupportPage from "./SupportPage";
import { makeStore, renderRoutes, stubApi } from "@/test/utils";

// A stand-in for pusher-js that lets the test deliver events
const pusher = vi.hoisted(() => ({ instances: [] }));
vi.mock("pusher-js", () => ({
  default: class FakePusher {
    constructor(key, options) {
      this.key = key;
      this.options = options;
      this.channels = {};
      this.connection = { state: "connected", bind: vi.fn(), unbind: vi.fn() };
      pusher.instances.push(this);
    }
    subscribe(name) {
      const handlers = {};
      const channel = {
        global: null,
        bind: (event, fn) => { handlers[event] = fn; },
        bind_global: (fn) => { channel.global = fn; },
        unbind_all: vi.fn(),
        trigger: (event, payload) => (handlers[event] ? handlers[event](payload) : channel.global?.(event, payload)),
      };
      this.channels[name] = channel;
      return channel;
    }
    unsubscribe() {}
    disconnect() {}
  },
}));

const admin = { id: 1, name: "Mike", is_base: true };
const player = { id: 7, username: "onyx" };
const session = { id: 5, user: player, support_status: "open", joined_admin_id: null, created_at: "2026-11-11T10:00:00Z", updated_at: "2026-11-11T10:00:00Z" };
const first = { id: 100, support_session_id: 5, message: "My gold is missing", message_user_id: 7, user: player, created_at: "2026-11-11T10:00:00Z" };

function renderSupport(realtime) {
  const calls = stubApi({
    "/support/sessions": [200, { data: [session], pagination: { total: 1, page_limit: 30 } }],
    "/support/sessions/5": [200, { session }],
    "/support/sessions/5/messages": [200, { data: [first], pagination: { total: 1, page_limit: 100 } }],
  });
  const store = makeStore({ token: "tok", admin, permissions: [], realtime });
  renderRoutes([{ path: "/support", element: <SupportPage /> }], { store, path: "/support?chat=5" });
  return calls;
}

// jsdom has no layout, so no scrolling
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  pusher.instances.length = 0;
});

test("a player's message arrives live in the open chat without polling", async () => {
  renderSupport({ pusher_key: "pk", pusher_cluster: "eu" });
  expect(await screen.findByText("My gold is missing")).toBeInTheDocument();

  const client = pusher.instances.at(-1);
  expect(client.key).toBe("pk");
  expect(client.options.channelAuthorization.headers.Authorization).toBe("Bearer tok");
  const inbox = client.channels["private-support-inbox"];
  act(() => inbox.trigger("pusher:subscription_succeeded"));
  expect(await screen.findByText("Live")).toBeInTheDocument();

  const reply = { id: 101, support_session_id: 5, message: "It was a top-up from yesterday", message_user_id: 7, user: player, created_at: "2026-11-11T10:01:00Z" };
  act(() => inbox.trigger("support.message.sent", reply));
  expect(await screen.findByText("It was a top-up from yesterday")).toBeInTheDocument();

  // The same message again (another device, a retry) shows once
  act(() => inbox.trigger("support.message.sent", reply));
  await waitFor(() => expect(screen.getAllByText("It was a top-up from yesterday")).toHaveLength(1));
});

test("without Pusher settings the page says it is refreshing instead", async () => {
  renderSupport(null);
  expect(await screen.findByText("My gold is missing")).toBeInTheDocument();
  expect(screen.getByText("Refreshing")).toBeInTheDocument();
  expect(pusher.instances).toHaveLength(0);
});
