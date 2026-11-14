// Groups permission names by the part of the dashboard they cover.
// Each area lists the exact permission names it holds, in the order they're shown.
// A permission the server adds later still shows, under "Other", until it's given an area here.
const AREAS = [
  ["Players", ["view_users", "moderate_players", "adjust_wallets"]],
  ["Games & genres", ["view_genres", "create_genres", "edit_genres", "view_games", "create_games", "edit_games", "delete_games"]],
  ["Feed posts", ["manage_strix_posts", "moderate_posts"]],
  ["Epic Clips", ["view_epic_clips", "disable_epic_clips"]],
  ["Daily rewards", ["view_daily_rewards", "create_daily_rewards"]],
  ["Missions", ["view_missions", "create_missions"]],
  ["Strix Pass", ["view_pass", "create_pass"]],
  ["Tournaments", ["view_tournaments", "create_tournaments", "edit_tournaments"]],
  ["Channels", ["view_channels", "create_channels", "edit_channels", "delete_channels", "manage_channel_members"]],
  ["Push notifications", ["send_push_campaigns"]],
  ["AI agents", ["manage_ai_content"]],
  ["Shop & orders", ["view_shop_sale_items", "edit_shop_sale_items", "view_orders", "manage_orders", "manage_economy"]],
  ["Game top-ups", ["view_game_topups", "create_game_topups", "edit_game_topups", "disable_game_topups", "view_topup_purchases", "process_topup_purchases"]],
  ["Support", ["manage_customer_supports", "manage_bug_reports"]],
  [
    "Settings & admins",
    ["manage_system_countries", "view_system_admins", "create_system_admins", "edit_system_admins", "delete_system_admins", "view_roles", "edit_roles", "view_activity_log"],
  ],
];

// Plain names where the permission's own name doesn't say enough
const LABELS = {
  view_users: "View players",
  moderate_players: "Suspend and ban players",
  adjust_wallets: "Add or remove a player's Gold and XP",
  manage_strix_posts: "Write, edit and delete Strix posts",
  moderate_posts: "Review reported posts",
  disable_epic_clips: "Remove clips and crown winners",
  view_pass: "View Strix Pass",
  create_pass: "Create Strix Pass seasons",
  manage_channel_members: "Manage members and post in Strix channels",
  send_push_campaigns: "Send push campaigns and notify players about posts",
  view_shop_sale_items: "View sale items",
  edit_shop_sale_items: "Edit sale items and prices",
  view_orders: "View orders and payments",
  manage_orders: "Re-check payments and settle refunds",
  disable_game_topups: "Turn top-up games off",
  view_topup_purchases: "View top-up purchases",
  process_topup_purchases: "Deliver or decline top-ups",
  manage_customer_supports: "Answer support chats",
  manage_bug_reports: "Read and resolve bug reports",
  manage_system_countries: "Manage countries",
  view_system_admins: "View admins",
  create_system_admins: "Add admins",
  edit_system_admins: "Edit admins and reset their passwords",
  delete_system_admins: "Remove admins",
  view_activity_log: "View the activity log",
  manage_ai_content: "Run the AI agents and the Content studio",
  manage_economy: "See the economy and change its settings",
};

export function groupPermissions(permissions) {
  const byName = new Map(permissions.map((permission) => [permission.name, permission]));
  const placed = new Set();
  const groups = AREAS.map(([label, names]) => ({
    label,
    items: names
      .filter((name) => byName.has(name))
      .map((name) => {
        placed.add(name);
        return byName.get(name);
      }),
  }));
  const other = { label: "Other", items: permissions.filter((permission) => !placed.has(permission.name)) };
  return [...groups, other].filter((group) => group.items.length > 0);
}

// "create_daily_rewards" → "Create daily rewards", unless it has a plainer name above
export function permissionLabel(name) {
  if (LABELS[name]) return LABELS[name];
  const text = name.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
