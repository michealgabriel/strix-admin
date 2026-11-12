// App link fields a game can have: [key, label, placeholder]. Shared by the game form and the JSON import.
export const LINK_FIELDS = [
  ["android_package", "Android package", "com.supercell.brawlstars"],
  ["ios_url_scheme", "iOS URL scheme", "brawlstars://"],
  ["play_store_url", "Play Store link", "https://play.google.com/store/apps/details?id=…"],
  ["app_store_url", "App Store link", "https://apps.apple.com/app/…"],
  ["deep_link_template", "Deep link template", "brawlstars://friend?tag={gamer_id}"],
];

// The game's form data for POST /games or /games/{id}. Empty link fields are sent empty so they can be cleared.
export function gameFormData({ name, system_game_platform_id, system_game_genre_id, status, cover_image, links }) {
  const form = new FormData();
  form.append("name", name);
  form.append("system_game_platform_id", system_game_platform_id);
  form.append("system_game_genre_id", system_game_genre_id);
  form.append("status", status);
  if (cover_image) form.append("cover_image", cover_image);
  for (const [key] of LINK_FIELDS) form.append(key, links?.[key] ?? "");
  return form;
}
