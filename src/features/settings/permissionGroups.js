// Groups permission names by the part of the dashboard they cover
const AREAS = [
  ["Players", ["users"]],
  ["Games & genres", ["games", "genres"]],
  ["Daily rewards", ["daily_rewards"]],
  ["Missions", ["missions"]],
  ["Epic Clips", ["epic_clips"]],
  ["Strix Pass", ["pass"]],
  ["Tournaments", ["tournaments"]],
  ["Channels", ["channels", "channel_members"]],
  ["Shop", ["shop_sale_items"]],
  ["Game top-ups", ["game_topups", "topup_purchases"]],
  ["Support", ["customer_supports"]],
  ["Push notifications", ["push_campaigns"]],
  ["Settings & admins", ["system_countries", "system_admins", "roles"]],
];

export function groupPermissions(permissions) {
  const groups = AREAS.map(([label]) => ({ label, items: [] }));
  const other = { label: "Other", items: [] };
  for (const permission of permissions) {
    const index = AREAS.findIndex(([, suffixes]) => suffixes.some((suffix) => permission.name.endsWith(`_${suffix}`)));
    (index >= 0 ? groups[index] : other).items.push(permission);
  }
  return [...groups, other].filter((group) => group.items.length > 0);
}

// "create_daily_rewards" → "Create daily rewards"
export function permissionLabel(name) {
  const text = name.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
