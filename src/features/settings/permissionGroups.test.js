import { groupPermissions, permissionLabel } from "./permissionGroups";

// Every permission the server had on 2026-11-12 (production's 47, plus Strix posts)
const NAMES = [
  "adjust_wallets", "create_channels", "create_daily_rewards", "create_game_topups", "create_games", "create_genres", "create_missions",
  "create_pass", "create_system_admins", "create_tournaments", "delete_channels", "delete_games", "delete_system_admins", "disable_epic_clips",
  "disable_game_topups", "edit_channels", "edit_game_topups", "edit_games", "edit_genres", "edit_roles", "edit_shop_sale_items",
  "edit_system_admins", "edit_tournaments", "manage_channel_members", "manage_customer_supports", "manage_orders", "manage_system_countries",
  "moderate_players", "moderate_posts", "process_topup_purchases", "send_push_campaigns", "view_activity_log", "view_channels",
  "view_daily_rewards", "view_epic_clips", "view_game_topups", "view_games", "view_genres", "view_missions", "view_orders", "view_pass",
  "view_roles", "view_shop_sale_items", "view_system_admins", "view_topup_purchases", "view_tournaments", "view_users", "manage_strix_posts",
];

test("every current permission has an area, none fall under Other", () => {
  const groups = groupPermissions(NAMES.map((name, id) => ({ id, name })));

  expect(groups.find((group) => group.label === "Other")).toBeUndefined();
  expect(groups.flatMap((group) => group.items)).toHaveLength(NAMES.length);
  expect(groups.find((group) => group.label === "Feed posts").items.map((p) => p.name)).toEqual(["manage_strix_posts", "moderate_posts"]);
});

test("a permission added later still shows, under Other", () => {
  const groups = groupPermissions([{ id: 1, name: "view_users" }, { id: 2, name: "launch_rockets" }]);

  expect(groups.at(-1)).toEqual({ label: "Other", items: [{ id: 2, name: "launch_rockets" }] });
  expect(permissionLabel("launch_rockets")).toBe("Launch rockets");
  expect(permissionLabel("moderate_players")).toBe("Suspend and ban players");
});
