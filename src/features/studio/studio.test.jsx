import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudioPage from "./StudioPage";
import { makeStore, renderRoutes } from "@/test/utils";

const AGENT = {
  id: 1,
  user_id: 3,
  display_name: "Nova · Leaks & news",
  tagline: "Leaks & news",
  persona: "Fast, punchy gaming news.",
  favourite_game_ids: [],
  daily_caps: { posts: 2, comments: 6, channel_messages: 12, replies: 15 },
  active: true,
  last_acted_at: null,
  posts_today: 1,
  user: { id: 3, username: "NovaLeaks", bio: "News by AI", profile_image: null, strix_id: "123", suspended: false },
};

function fakeBackend({ agents = [AGENT] } = {}) {
  const calls = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = vi.fn(async (input) => {
    const request = input instanceof Request ? input : new Request(input);
    const path = new URL(request.url).pathname.replace(/^\/api/, "");
    const call = { method: request.method, path };
    if (request.method === "POST" && path !== "/admin/ai-agents/provision") call.form = Object.fromEntries(await request.formData());
    calls.push(call);
    if (path === "/admin/ai-agents" && request.method === "GET") return json(200, { data: agents });
    if (path === "/admin/ai-agents/provision") return json(200, { message: "10 agents created", created: 10 });
    if (path === "/admin/ai-agents/1") return json(200, { agent: AGENT });
    return json(404, { message: "Not found" });
  });
  return calls;
}

const routes = [{ path: "/studio", element: <StudioPage /> }];
const store = () => makeStore({ token: "tok", permissions: ["manage_ai_content"] });

test("with no agents yet, the admin can create them", async () => {
  const calls = fakeBackend({ agents: [] });
  renderRoutes(routes, { store: store(), path: "/studio" });

  await userEvent.click(await screen.findByRole("button", { name: "Create the agents" }));
  await waitFor(() => expect(calls.some((call) => call.path === "/admin/ai-agents/provision")).toBe(true));
});

test("an agent's persona, limits and active switch are saved", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/studio" });

  expect(await screen.findByText(/1 posts today/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Edit Nova · Leaks & news" }));
  const dialog = await screen.findByRole("dialog");
  const persona = within(dialog).getByLabelText(/^Persona/);
  await userEvent.clear(persona);
  await userEvent.type(persona, "Only racing games.");
  const posts = within(dialog).getByRole("spinbutton", { name: "Posts" });
  await userEvent.clear(posts);
  await userEvent.type(posts, "4");
  await userEvent.click(within(dialog).getByRole("switch", { name: "Active" }));
  await userEvent.click(within(dialog).getByRole("button", { name: "Save agent" }));

  await waitFor(() => expect(calls.some((call) => call.path === "/admin/ai-agents/1")).toBe(true));
  expect(calls.find((call) => call.path === "/admin/ai-agents/1").form).toMatchObject({
    persona: "Only racing games.",
    "daily_caps[posts]": "4",
    "daily_caps[comments]": "6",
    active: "0",
  });
});
