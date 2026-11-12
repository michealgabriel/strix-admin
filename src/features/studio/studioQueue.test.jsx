import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudioPage from "./StudioPage";
import { makeStore, renderRoutes } from "@/test/utils";

const DRAFT = {
  id: 7,
  kind: "image_post",
  status: "draft",
  publish_as: "agent",
  agent: { id: 1, display_name: "Nova · Leaks & news", username: "NovaLeaks" },
  game: { id: 3, name: "GTA 6" },
  payload: { title: "Trailer 3 is here", text: "Rockstar dropped it, via IGN. Thoughts? #GTA6", card_headline: "Trailer 3 is here", source_name: "IGN", source_url: "https://ign.com/x", tagged_game_ids: [3] },
  tagged_games: [{ id: 3, name: "GTA 6" }],
  media: { image_url: "https://cdn.test/card.png" },
  scheduled_at: null,
  published_at: null,
  error: null,
  created_at: "2026-11-13T08:00:00Z",
};

const OVERVIEW = {
  settings: {
    pipeline: { enabled: false, news_hour: 6 },
    autopilot: { posts: { enabled: false, per_day: 6, start_hour: 8, end_hour: 22, publish_as: "agent" } },
    timezone: "Africa/Lagos",
  },
  budget: { limit: 1, spent_today: 0.42, remaining: 0.58, days: [{ date: "2026-11-13", cost: 0.42 }], by_purpose: { news: 0.3, write: 0.12 } },
  ai_configured: true,
  stories: { new: 3 },
  batches_running: [],
};

function fakeBackend() {
  const calls = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = vi.fn(async (input) => {
    const request = input instanceof Request ? input : new Request(input);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "");
    const body = ["POST", "PUT"].includes(request.method) ? await request.json().catch(() => null) : null;
    calls.push({ method: request.method, path, body });
    if (path === "/admin/studio/content" && request.method === "GET") {
      return json(200, { data: url.searchParams.get("status") === "draft" ? [DRAFT] : [], counts: { draft: 1 }, pagination: { total: 1, page_limit: 20, current_page: 1 } });
    }
    if (path === "/admin/studio/content/7/approve") return json(200, { message: "Published", item: { ...DRAFT, status: "published" } });
    if (path === "/admin/studio/content/7") return json(200, { item: DRAFT });
    if (path === "/admin/studio/content/bulk") return json(200, { message: "1 scheduled", count: 1 });
    if (path === "/admin/studio/overview") return json(200, OVERVIEW);
    if (path === "/admin/studio/settings") return json(200, { settings: OVERVIEW.settings });
    if (path === "/admin/studio/run") return json(200, { message: "News search sent.", sent: 1 });
    if (path === "/admin/studio/delist" && request.method === "GET") return json(200, { counts: { agent_posts: 12, studio_posts: 2, waiting_drafts: 4, agents: 10 } });
    if (path === "/admin/studio/delist") return json(200, { message: "All AI content is off Strix" });
    if (path === "/admin/ai-agents") return json(200, { data: [] });
    return json(404, { message: "Not found" });
  });
  return calls;
}

const routes = [{ path: "/studio", element: <StudioPage /> }];
const store = () => makeStore({ token: "tok", permissions: ["manage_ai_content"] });

test("a draft shows its card, agent and source, and publishes now", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/studio" });

  expect(await screen.findByText("Trailer 3 is here")).toBeInTheDocument();
  expect(screen.getByText("Nova · Leaks & news")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /IGN/ })).toHaveAttribute("href", "https://ign.com/x");
  await userEvent.click(screen.getByRole("button", { name: "Publish now" }));

  await waitFor(() => expect(calls.some((call) => call.path === "/admin/studio/content/7/approve")).toBe(true));
});

test("an edited draft can go out as Strix at a chosen time", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/studio" });

  await userEvent.click(await screen.findByRole("button", { name: "Edit Trailer 3 is here" }));
  const dialog = await screen.findByRole("dialog");
  await userEvent.clear(within(dialog).getByLabelText("Title"));
  await userEvent.type(within(dialog).getByLabelText("Title"), "Trailer 3: everything we saw");
  await userEvent.click(within(dialog).getByRole("combobox", { name: "Posted by" }));
  await userEvent.click(await screen.findByRole("option", { name: "Strix (official)" }));
  await userEvent.type(within(dialog).getByLabelText(/Schedule for/), "2030-01-02T10:30");
  await userEvent.click(within(dialog).getByRole("button", { name: "Schedule" }));

  await waitFor(() => expect(calls.some((call) => call.path === "/admin/studio/content/7/approve")).toBe(true));
  expect(calls.find((call) => call.path === "/admin/studio/content/7").body).toMatchObject({ title: "Trailer 3: everything we saw", publish_as: "strix", ai_agent_id: null });
  expect(calls.find((call) => call.path === "/admin/studio/content/7/approve").body.scheduled_at).toMatch(/^2030-01-02T/);
});

test("selected drafts are scheduled together", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/studio" });

  await userEvent.click(await screen.findByRole("checkbox", { name: "Select Trailer 3 is here" }));
  await userEvent.click(screen.getByRole("button", { name: "Schedule 1" }));

  await waitFor(() => expect(calls.find((call) => call.path === "/admin/studio/content/bulk")?.body).toEqual({ ids: [7], action: "approve" }));
});

test("settings show the budget and save the pipeline and autopilot", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/studio?tab=settings" });

  expect(await screen.findByText(/of \$1\.00 today/)).toBeInTheDocument();
  expect(screen.getByText("$0.42", { exact: false })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("switch", { name: "Run the curators" }));
  await userEvent.click(screen.getByRole("switch", { name: "Autopilot" }));
  await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

  await waitFor(() => expect(calls.some((call) => call.path === "/admin/studio/settings")).toBe(true));
  expect(calls.find((call) => call.path === "/admin/studio/settings").body).toMatchObject({
    pipeline: { enabled: true, news_hour: 6 },
    autopilot: { posts: { enabled: true, per_day: 6 } },
  });

  await userEvent.click(screen.getByRole("button", { name: "Find news now" }));
  await waitFor(() => expect(calls.find((call) => call.path === "/admin/studio/run")?.body).toEqual({ task: "news" }));
});

test("delisting needs DELIST typed first", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/studio?tab=delist" });

  expect(await screen.findByText("12")).toBeInTheDocument();
  const button = screen.getByRole("button", { name: "Delist all AI content" });
  expect(button).toBeDisabled();
  await userEvent.type(screen.getByLabelText("Type DELIST to confirm"), "DELIST");
  await userEvent.click(button);

  await waitFor(() => expect(calls.some((call) => call.method === "POST" && call.path === "/admin/studio/delist")).toBe(true));
});
