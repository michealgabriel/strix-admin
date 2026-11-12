// Turns a logged request into a sentence: "Approved a top-up", "Edited role #3"
const ACTIONS = [
  ["POST api/games", "Added a game"],
  ["POST api/games/{game_id}", "Edited game #{game_id}"],
  ["POST api/games/{game_id}/objectives", "Added an objective to game #{game_id}"],
  ["DELETE api/games/{game_id}/objectives/{objective_id}", "Deleted an objective from game #{game_id}"],
  ["POST api/genres", "Added a genre"],
  ["PUT api/genres/{genre_id}", "Edited genre #{genre_id}"],
  ["POST api/dailyrewards", "Queued a Daily Strix week"],
  ["PUT api/dailyrewards/next", "Edited next week's Daily Strix"],
  ["POST api/powermissions", "Queued power missions"],
  ["PUT api/powermissions/next", "Edited next week's power missions"],
  ["POST api/strixpass", "Queued a Strix Pass season"],
  ["PUT api/strixpass/next", "Edited the next Strix Pass season"],
  ["POST api/admin/epicclips/submissions/{id}/crown-winner", "Crowned clip #{id}"],
  ["POST api/admin/epicclips/{epic_clip_id}/reports/resolve", "Reviewed reports on clip #{epic_clip_id}"],
  ["POST api/admin/posts/{post_id}/reports/resolve", "Reviewed reports on post #{post_id}"],
  ["POST api/admin/posts", "Wrote a Strix post"],
  ["POST api/admin/ai-agents/provision", "Created the AI agents"],
  ["POST api/admin/ai-agents/{agent_id}", "Edited AI agent #{agent_id}"],
  ["POST api/admin/posts/{post_id}", "Edited Strix post #{post_id}"],
  ["DELETE api/admin/posts/{post_id}", "Deleted Strix post #{post_id}"],
  ["PUT api/games/{game_id}/objectives/{objective_id}", "Edited an objective of game #{game_id}"],
  ["POST api/tournaments", "Created a tournament"],
  ["POST api/tournaments/{tournament_id}", "Edited tournament #{tournament_id}"],
  ["POST api/tournaments/{tournament_id}/start", "Started tournament #{tournament_id}"],
  ["POST api/tournaments/{tournament_id}/teams/{team_identifier}/status", "Decided an entry in tournament #{tournament_id}"],
  ["PATCH api/tournaments/{tournament_id}/brackets/eliminations", "Recorded a result in tournament #{tournament_id}"],
  ["POST api/channels", "Created a channel"],
  ["POST api/channels/{channel_id}", "Edited channel #{channel_id}"],
  ["POST api/channels/{channel_id}/messages", "Posted in channel #{channel_id}"],
  ["PUT api/shop/updateCurrencyPricings", "Changed gold pack prices"],
  ["PUT api/shop/updateChestPricings", "Changed chest prices"],
  ["POST api/topupgames", "Added a top-up game"],
  ["POST api/topupgames/{topup_game_id}", "Edited top-up game #{topup_game_id}"],
  ["POST api/topuppurchases/{topup_purchase_id}/approvedecline", "Delivered or declined top-up #{topup_purchase_id}"],
  ["POST api/support/sessions/{session_id}/adminjoin", "Took support chat #{session_id}"],
  ["POST api/support/sessions/{session_id}/messages", "Replied in support chat #{session_id}"],
  ["PATCH api/support/sessions/{session_id}/close", "Closed support chat #{session_id}"],
  ["POST api/systemcountries", "Added a country"],
  ["POST api/systemcountries/{system_country_id}/update", "Edited country #{system_country_id}"],
  ["POST api/systemadmins", "Added an admin"],
  ["PUT api/systemadmins/{system_admin_id}", "Edited admin #{system_admin_id}"],
  ["DELETE api/systemadmins/{system_admin_id}", "Removed admin #{system_admin_id}"],
  ["POST api/systemadmins/{system_admin_id}/reset-password", "Reset the password of admin #{system_admin_id}"],
  ["PUT api/auth/admin/password", "Changed their own password"],
  ["POST api/systemroles", "Added a role"],
  ["PUT api/systemroles/{role_id}", "Edited role #{role_id}"],
  ["DELETE api/systemroles/{role_id}", "Deleted role #{role_id}"],
  ["POST api/admin/push-campaigns", "Created a push campaign"],
  ["PUT api/admin/push-campaigns/{campaign_id}", "Edited push campaign #{campaign_id}"],
  ["POST api/admin/push-campaigns/{campaign_id}/schedule", "Scheduled push campaign #{campaign_id}"],
  ["POST api/admin/push-campaigns/{campaign_id}/cancel", "Stopped push campaign #{campaign_id}"],
  ["POST api/admin/push-campaigns/{campaign_id}/test", "Sent a test of push campaign #{campaign_id}"],
  ["POST api/admin/push-campaigns/audience", "Checked a campaign audience"],
  ["POST api/admin/orders/{order_id}/sync", "Re-checked payment for order #{order_id}"],
  ["POST api/admin/orders/{order_id}/refund", "Refunded order #{order_id}"],
  ["POST api/admin/orders/{order_id}/mark-refunded", "Marked order #{order_id} refunded"],
  ["POST api/admin/players/{player_id}/suspend", "Suspended player #{player_id}"],
  ["POST api/admin/players/{player_id}/unsuspend", "Lifted the suspension of player #{player_id}"],
  ["POST api/admin/players/{player_id}/wallet", "Adjusted the wallet of player #{player_id}"],
];

const byKey = new Map(ACTIONS);

export function describeActivity(entry) {
  const template = byKey.get(`${entry.method} ${entry.route}`);
  if (!template) return `${entry.method} /${entry.route}`;
  return template.replace(/#\{(\w+)\}/g, (_, key) => `#${entry.route_params?.[key] ?? "?"}`);
}

// Links an entry to the page about what it changed, when there is one
export function activityLink(entry) {
  const p = entry.route_params ?? {};
  if (p.player_id) return `/players/${p.player_id}`;
  if (p.tournament_id) return `/tournaments/${p.tournament_id}`;
  if (p.campaign_id) return `/campaigns/${p.campaign_id}`;
  if (p.session_id) return `/support?chat=${p.session_id}`;
  return null;
}
