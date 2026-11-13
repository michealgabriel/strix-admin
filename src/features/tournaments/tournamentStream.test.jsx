import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TournamentDetailPage from "./TournamentDetailPage";
import { makeStore, renderRoutes } from "@/test/utils";

const LIVE = {
  id: 3, title: "Friday cup", is_strix_tournament: false, is_live: true, is_completed: false, team_count: 2, players_per_team_count: 1,
  bracket_type: "team_based", strix_gold_entry_fee: 0, start_date: "2026-11-13", stream_url: "https://www.twitch.tv/host", user: { username: "Kofi" }, game: { name: "Free Fire" },
};

function fakeBackend() {
  const calls = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = vi.fn(async (input) => {
    const request = input instanceof Request ? input : new Request(input);
    const path = new URL(request.url).pathname.replace(/^\/api/, "");
    const body = request.method === "PATCH" ? await request.json() : null;
    calls.push({ method: request.method, path, body });
    if (path === "/tournaments/3/stream") {
      return body.stream_url === "https://vimeo.com/1"
        ? json(422, { message: "Use a YouTube, Twitch or Kick link, or a direct .m3u8 or .mp4 link.", errors: { stream_url: ["Use a YouTube, Twitch or Kick link, or a direct .m3u8 or .mp4 link."] } })
        : json(200, { message: body.stream_url ? "Stream link saved" : "Stream link removed", tournament: { ...LIVE, stream_url: body.stream_url } });
    }
    if (path === "/tournaments/3") return json(200, { data: LIVE });
    return json(200, { data: [] });
  });
  return calls;
}

const routes = [{ path: "/tournaments/:tournamentId", element: <TournamentDetailPage /> }];
const store = () => makeStore({ token: "tok", permissions: ["view_tournaments", "edit_tournaments"] });

test("staff can change a live tournament's stream link, and bad links are explained", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/tournaments/3" });

  expect(await screen.findByRole("link", { name: /twitch\.tv\/host/ })).toHaveAttribute("href", "https://www.twitch.tv/host");
  await userEvent.click(screen.getByRole("button", { name: "Change stream link" }));
  const dialog = await screen.findByRole("dialog");
  const field = within(dialog).getByLabelText("Link");

  await userEvent.clear(field);
  await userEvent.type(field, "https://vimeo.com/1");
  await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
  expect(await within(dialog).findByText(/Use a YouTube, Twitch or Kick link/)).toBeInTheDocument();

  await userEvent.clear(field);
  await userEvent.type(field, "https://youtu.be/restarted");
  await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
  await waitFor(() => expect(calls.filter((call) => call.method === "PATCH").at(-1).body).toEqual({ stream_url: "https://youtu.be/restarted" }));
});

test("the link can be removed", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/tournaments/3" });

  await userEvent.click(await screen.findByRole("button", { name: "Change stream link" }));
  await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove link" }));

  await waitFor(() => expect(calls.find((call) => call.method === "PATCH")?.body).toEqual({ stream_url: null }));
});
