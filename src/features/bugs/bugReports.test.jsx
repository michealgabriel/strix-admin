import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BugReportsPage from "./BugReportsPage";
import { makeStore, renderRoutes } from "@/test/utils";

const ROW = {
  id: 4, user: { id: 9, username: "Kofi", strix_id: "123456789" }, summary: "Team-up page freezes when I tap Join",
  has_screenshot: true, source: "shake", platform: "android", screen: "/teamup-detail", app_version: "1.4.0 (27)",
  status: "new", created_at: "2026-11-13T09:00:00Z",
};
const DETAIL = {
  ...ROW, description: "Team-up page freezes when I tap Join\nEvery time.", os_version: "Android 15 (SDK 35)", device_name: "Pixel 8",
  locale: "en", admin_note: null, resolved_at: null, player_notified_at: null, updated_at: "2026-11-13T09:00:00Z",
};

function fakeBackend() {
  const calls = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = vi.fn(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "");
    const body = request.method === "PATCH" ? await request.json() : null;
    calls.push({ method: request.method, path, query: Object.fromEntries(url.searchParams), body, auth: request.headers.get("Authorization") });
    if (path === "/admin/bug-reports") return json(200, { data: [ROW], counts: { new: 1 }, app_versions: ["1.4.0 (27)"], pagination: { total: 1, page_limit: 20, current_page: 1 } });
    if (path === "/admin/bug-reports/4/screenshot") return new Response("png-bytes", { status: 200, headers: { "Content-Type": "image/png" } });
    if (path === "/admin/bug-reports/4" && request.method === "GET") return json(200, { report: DETAIL });
    if (path === "/admin/bug-reports/4") return json(200, { report: { ...DETAIL, status: "resolved", player_notified_at: "2026-11-13T10:00:00Z" } });
    return json(404, {});
  });
  return calls;
}

beforeAll(() => {
  globalThis.URL.createObjectURL = vi.fn(() => "blob:shot");
  globalThis.URL.revokeObjectURL = vi.fn();
});

const routes = [{ path: "/bug-reports", element: <BugReportsPage /> }];
const store = () => makeStore({ token: "tok", permissions: ["manage_bug_reports"] });

test("reports are listed and filtered by platform", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/bug-reports" });

  expect(await screen.findByText("Team-up page freezes when I tap Join")).toBeInTheDocument();
  expect(screen.getByLabelText("Has a screenshot")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("combobox", { name: "Platform" }));
  await userEvent.click(await screen.findByRole("option", { name: "iOS" }));

  await waitFor(() => expect(calls.some((call) => call.query.platform === "ios")).toBe(true));
});

test("a report opens with its screenshot fetched privately, and resolving tells the player", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/bug-reports" });

  await userEvent.click(await screen.findByText("Team-up page freezes when I tap Join"));
  const sheet = await screen.findByRole("dialog");
  expect(await within(sheet).findByRole("img", { name: "Screenshot from the player's phone" })).toHaveAttribute("src", "blob:shot");
  expect(calls.find((call) => call.path === "/admin/bug-reports/4/screenshot").auth).toBe("Bearer tok");
  expect(within(sheet).getByText("Pixel 8")).toBeInTheDocument();
  expect(within(sheet).getByRole("link", { name: "Kofi" })).toHaveAttribute("href", "/players/9");

  await userEvent.click(within(sheet).getByRole("combobox", { name: "Status" }));
  await userEvent.click(await screen.findByRole("option", { name: "Resolved" }));
  expect(within(sheet).getByRole("checkbox", { name: "Tell the player it's fixed" })).toBeChecked();
  await userEvent.type(within(sheet).getByLabelText(/Internal note/), "Fixed in 1.4.1");
  await userEvent.click(within(sheet).getByRole("button", { name: "Save" }));

  await waitFor(() => expect(calls.find((call) => call.method === "PATCH")?.body).toEqual({ status: "resolved", admin_note: "Fixed in 1.4.1", notify: true }));
});
