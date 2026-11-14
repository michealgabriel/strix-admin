import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EconomyPage from "./EconomyPage";
import { makeStore, renderRoutes } from "@/test/utils";

const DEFAULTS = {
  ad_gold_per_ad: 5, ad_max_per_day: 6, streak_milestones: { 7: 25, 30: 100 }, streak_freeze_price: 50, streak_max_freezes: 2,
  referral_inviter_gold: 50, referral_new_player_gold: 25, referral_monthly_cap: 10, welcome_back_gifts: { 14: 50, 7: 25 },
  welcome_back_every_days: 30, common_chest_gold: [5, 20], common_chest_xp: [45, 105], legendary_chest_gold: [40, 90],
  legendary_chest_xp: [150, 400], legendary_chest_daily_limit: 3, tournament_host_share_percent: 90,
  game_currency_monthly_limit: 100, game_currency_cooldown_days: 7, game_currency_min_account_days: 14, game_currency_purchase_within_days: 30,
};
const OVERVIEW = {
  days: 30,
  totals: { earned: 1240, bought: 350, spent: 600 },
  by_day: [{ date: "2026-11-13", earned: 40, bought: 0, spent: 150 }, { date: "2026-11-14", earned: 1200, bought: 350, spent: 450 }],
  by_reason: [{ reason: "ad_reward", added: 1240, removed: 0, entries: 30, players: 4 }, { reason: "chest_purchase", added: 0, removed: 600, entries: 4, players: 2 }],
  top_earners: [{ user_id: 9, username: "Kofi", earned_7d: 900, entries_7d: 20, balance: 1500, joined_at: "2026-11-01T00:00:00Z" }],
  circulation: { gold: 9000, players: 10, holders: 8, average: 900 },
  game_currency: { won_this_month: 12, monthly_limit: 100, waiting_for_delivery: 2, delivered_this_month: 9 },
  generated_at: "2026-11-14T10:00:00Z",
};

function fakeBackend() {
  const calls = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = vi.fn(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "");
    const body = request.method === "PUT" ? await request.json() : null;
    calls.push({ method: request.method, path, query: Object.fromEntries(url.searchParams), body });
    if (path === "/admin/economy") return json(200, OVERVIEW);
    if (path === "/admin/economy/settings" && request.method === "GET") return json(200, { settings: { ...DEFAULTS, ad_gold_per_ad: 8 }, defaults: DEFAULTS });
    if (path === "/admin/economy/settings" && body?.legendary_chest_gold?.[0] > body?.legendary_chest_gold?.[1]) {
      return json(422, { message: "The smallest amount must not be more than the largest.", errors: { legendary_chest_gold: ["The smallest amount must not be more than the largest."] } });
    }
    if (path === "/admin/economy/settings") return json(200, { settings: { ...DEFAULTS, ...body }, defaults: DEFAULTS });
    return json(404, {});
  });
  return calls;
}

const routes = [{ path: "/economy", element: <EconomyPage /> }];
const store = () => makeStore({ token: "tok", permissions: ["manage_economy"] });

test("the overview shows where Gold came from and who earned the most", async () => {
  fakeBackend();
  renderRoutes(routes, { store: store(), path: "/economy" });

  expect(await screen.findAllByText("1,240")).not.toHaveLength(0);
  expect(screen.getByText("9,000")).toBeInTheDocument();
  expect(screen.getByText("Rewarded ads")).toBeInTheDocument();
  expect(screen.getByText("Chests bought")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Kofi" })).toHaveAttribute("href", "/players/9");
  expect(screen.getByRole("meter", { name: "Game currency rewards used this month" })).toHaveAttribute("aria-valuenow", "12");
  expect(screen.getByText(/12 of 100 won/)).toBeInTheDocument();
});

test("settings save only what changed, and a setting can go back to its default", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/economy?tab=settings" });

  const perAd = await screen.findByLabelText("Gold per ad");
  expect(perAd).toHaveValue(8);
  expect(screen.getByText("Default 5")).toBeInTheDocument();

  await userEvent.click(within(perAd.parentElement).getByRole("button", { name: /Use default/ }));
  expect(perAd).toHaveValue(5);
  const limit = screen.getByLabelText("Legendary chests a player can open a day (0 = no limit)");
  await userEvent.clear(limit);
  await userEvent.type(limit, "2");
  expect(screen.getByText("2 unsaved changes")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() => expect(calls.find((c) => c.method === "PUT")?.body).toEqual({ ad_gold_per_ad: 5, legendary_chest_daily_limit: 2 }));
});

test("a range the server refuses shows its message on the field", async () => {
  fakeBackend();
  renderRoutes(routes, { store: store(), path: "/economy?tab=settings" });

  const from = await screen.findByLabelText("Legendary chest Gold from");
  await userEvent.clear(from);
  await userEvent.type(from, "500");
  await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findAllByText("The smallest amount must not be more than the largest.")).not.toHaveLength(0);
});
