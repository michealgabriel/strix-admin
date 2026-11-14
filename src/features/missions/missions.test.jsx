import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MissionsPage from "./MissionsPage";
import { makeStore, renderRoutes } from "@/test/utils";

const mission = (id, objective_type, status) => ({
  id, description: `Do ${objective_type}`, objective_type, objective_quantity: 2, reward_xp: 180, reward_gold: 30, objective_url: null, status,
});
const ACTIONS = [
  { slug: "join_teamup", example_description: "Join & Play with any {{x}} team-up", example_reward_xp: 250, example_reward_gold: 12 },
  { slug: "submit_epic_clip", example_description: "Submit an epic clip", example_reward_xp: 220, example_reward_gold: 10 },
];

function fakeBackend() {
  const calls = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = vi.fn(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const path = new URL(request.url).pathname.replace(/^\/api/, "");
    const body = ["PUT", "POST"].includes(request.method) ? await request.json() : null;
    calls.push({ method: request.method, path, body });
    if (path === "/powermissions" && request.method === "GET") {
      return json(200, { data: {
        active_power_missions: [mission(1, "create_channel", "active")],
        next_week_power_missions: [mission(2, "join_teamup", "inactive")],
        season_ends_at: "2026-11-25T16:23:20Z",
        next_season_ends_at: "2026-12-19T16:23:20Z",
      } });
    }
    if (path === "/powermissions/next") return json(200, { message: "ok" });
    if (path === "/dailymissions") return json(200, { data: [] });
    if (path === "/missionactionitems") return json(200, { data: ACTIONS });
    return json(404, {});
  });
  return calls;
}

test("power missions follow the season, and the queued set can grow", async () => {
  const calls = fakeBackend();
  renderRoutes([{ path: "/missions", element: <MissionsPage /> }], { store: makeStore({ token: "tok", permissions: ["view_missions", "create_missions"] }), path: "/missions" });

  expect(await screen.findByText("This season's power missions")).toBeInTheDocument();
  expect(await screen.findByText(/Ends with the season/)).toBeInTheDocument();
  expect(screen.getByText(/Start when this season ends/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /Add mission/ }));
  await userEvent.click(screen.getByRole("button", { name: "Save next season" }));

  await waitFor(() => expect(calls.find((c) => c.path === "/powermissions/next")).toBeTruthy());
  const saved = calls.find((c) => c.path === "/powermissions/next");
  expect(saved.method).toBe("PUT");
  expect(saved.body.manifest.data.map((m) => m.objective_type)).toEqual(["join_teamup", "join_teamup"]);
});
