import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostsPage from "./PostsPage";
import { makeStore, renderRoutes } from "@/test/utils";

const POST = {
  id: 5,
  post_title: "Season 2 is live",
  post_text_content: "New pass, new rewards.",
  post_image: null,
  post_video: null,
  tagged_games: [{ id: 1, name: "Brawl Stars" }],
  is_draft: false,
  hidden_at: null,
  tournament_id: null,
  admin: { id: 1, name: "Mike" },
  likes_count: 12,
  comments_count: 3,
  bookmarks_count: 1,
  views_count: 240,
  push: { campaign_id: 9, status: "sent", sent: 80, opened: 20 },
  created_at: "2026-11-12T10:00:00Z",
};

// Answers by method and path, records each call with its form fields
function fakeBackend() {
  const calls = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = vi.fn(async (input) => {
    const request = input instanceof Request ? input : new Request(input);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "");
    const call = { method: request.method, path, query: Object.fromEntries(url.searchParams) };
    if (request.method === "POST") call.form = Object.fromEntries(await request.formData());
    calls.push(call);
    if (request.method === "GET" && path === "/admin/posts") {
      return json(200, { data: call.query.status === "draft" ? [] : [POST], pagination: { total: 1, page_limit: 20, current_page: 1 } });
    }
    if (request.method === "GET" && path === "/games") return json(200, { data: [{ id: 1, name: "Brawl Stars" }, { id: 2, name: "Among Us" }] });
    if (request.method === "POST" && path === "/admin/posts") return json(201, { post: { ...POST, id: 6 } });
    if (request.method === "DELETE") return json(200, { message: "Post deleted" });
    return json(404, { message: "Not found" });
  });
  return calls;
}

const routes = [{ path: "/posts", element: <PostsPage /> }];
const store = (permissions = ["manage_strix_posts", "send_push_campaigns"]) => makeStore({ token: "tok", permissions });

test("lists Strix posts with their numbers and push results", async () => {
  fakeBackend();
  renderRoutes(routes, { store: store(), path: "/posts" });

  expect(await screen.findByText("Season 2 is live")).toBeInTheDocument();
  expect(screen.getByText(/Push sent · 80 sent, 20 opened/)).toBeInTheDocument();
  expect(screen.getByText("240")).toBeInTheDocument();
  expect(screen.getByText("Brawl Stars")).toBeInTheDocument();
});

test("writing a post with a push sends the fields, tagged games and notify", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/posts" });

  await userEvent.click(await screen.findByRole("button", { name: "New post" }));
  const dialog = await screen.findByRole("dialog");
  await userEvent.type(within(dialog).getByLabelText("Title"), "Tournament weekend");
  await userEvent.type(within(dialog).getByLabelText(/^Text/), "Sign up now #strix");
  await userEvent.click(await within(dialog).findByRole("button", { name: "Among Us" }));
  await userEvent.click(within(dialog).getByRole("switch", { name: "Notify players" }));
  await userEvent.type(within(dialog).getByLabelText(/Push title/), "This weekend");
  await userEvent.click(within(dialog).getByRole("button", { name: "Publish" }));

  await waitFor(() => expect(calls.some((call) => call.method === "POST")).toBe(true));
  expect(calls.find((call) => call.method === "POST").form).toEqual({
    post_title: "Tournament weekend",
    post_text_content: "Sign up now #strix",
    is_draft: "0",
    "tagged_games[]": "2",
    notify: "1",
    push_title: "This weekend",
  });
});

test("a draft never asks to notify, and the switch is hidden without the campaigns permission", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(["manage_strix_posts"]), path: "/posts" });

  await userEvent.click(await screen.findByRole("button", { name: "New post" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByRole("switch", { name: "Notify players" })).not.toBeInTheDocument();
  await userEvent.type(within(dialog).getByLabelText("Title"), "Later");
  await userEvent.type(within(dialog).getByLabelText(/^Text/), "Soon");
  await userEvent.click(within(dialog).getByRole("button", { name: "Save draft" }));

  await waitFor(() => expect(calls.some((call) => call.method === "POST")).toBe(true));
  expect(calls.find((call) => call.method === "POST").form).toMatchObject({ is_draft: "1" });
  expect(calls.find((call) => call.method === "POST").form.notify).toBeUndefined();
});

test("deleting asks first", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/posts" });

  await userEvent.click(await screen.findByRole("button", { name: "Delete Season 2 is live" }));
  await userEvent.click(await screen.findByRole("button", { name: "Delete post" }));

  await waitFor(() => expect(calls.some((call) => call.method === "DELETE" && call.path === "/admin/posts/5")).toBe(true));
});
