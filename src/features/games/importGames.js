// Turns an uploaded games file into rows the import page can edit, and matches them to what Strix already has.
// Pure functions: no network, no React.

const lower = (value) => String(value ?? "").trim().toLowerCase();
const text = (value) => (value === null || value === undefined ? "" : String(value).trim());

let keySeed = 0;
const nextKey = (prefix) => `${prefix}-${++keySeed}`;

/**
 * Reads the file's text. Accepts { mobile_games: [...] }, { games: [...] } or a bare array.
 * Returns { games, error }: `error` is a message for the whole file; per-game problems are found later.
 */
export function parseGamesFile(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { games: [], error: "This file isn't valid JSON." };
  }

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.mobile_games)
      ? data.mobile_games
      : Array.isArray(data?.games)
        ? data.games
        : null;
  if (!list) return { games: [], error: 'No games found. The file needs a "mobile_games" list.' };

  const games = list
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const links = item.app_links ?? {};
      return {
        name: text(item.name),
        platformName: text(item.platform),
        genreName: text(item.genre),
        status: lower(item.status) === "inactive" ? "inactive" : "active",
        links: {
          android_package: text(links.android_package ?? item.android_package),
          ios_url_scheme: text(links.ios_url_scheme ?? item.ios_url_scheme),
          play_store_url: text(links.play_store_link ?? links.play_store_url ?? item.play_store_url),
          app_store_url: text(links.app_store_link ?? links.app_store_url ?? item.app_store_url),
          deep_link_template: text(links.deep_link_template ?? item.deep_link_template),
        },
        objectives: (Array.isArray(item.objectives) ? item.objectives : []).map((objective) => ({
          key: nextKey("obj"),
          name: text(objective?.name),
          players: objective?.players_needed ?? objective?.preset_num_of_players_required ?? "",
        })),
      };
    });

  if (!games.length) return { games: [], error: "No games found in this file." };
  return { games, error: null };
}

/**
 * Builds editable rows: each parsed game matched to an existing Strix game (by name), platform and genre.
 * `genreChoice` is "id:{id}" for an existing genre or "new:{name}" for one the import will create.
 */
export function matchToStrix(games, { existingGames = [], platforms = [], genres = [] }) {
  const gamesByName = new Map(existingGames.map((game) => [lower(game.name), game]));
  const platformsByName = new Map(platforms.map((platform) => [lower(platform.name), platform]));
  const genresByName = new Map(genres.map((genre) => [lower(genre.name), genre]));

  return games.map((game) => {
    const existing = gamesByName.get(lower(game.name)) ?? null;
    const platform = platformsByName.get(lower(game.platformName));
    const genre = genresByName.get(lower(game.genreName));

    return {
      key: nextKey("game"),
      include: true,
      existingGame: existing,
      name: game.name,
      platformId: platform ? String(platform.id) : existing ? String(existing.system_game_platform_id) : "",
      platformName: game.platformName,
      genreChoice: genre
        ? `id:${genre.id}`
        : game.genreName
          ? `new:${game.genreName}`
          : existing
            ? `id:${existing.system_game_genre_id}`
            : "",
      status: game.status,
      links: { ...game.links },
      cover: null,
      objectives: game.objectives,
      save: { state: "idle", error: null, gameId: existing?.id ?? null },
    };
  });
}

// What saving does to each objective of an existing game: "add", "update" (player count changes) or "same"
export function objectiveActions(rowObjectives, currentObjectives = []) {
  const current = new Map(currentObjectives.map((objective) => [lower(objective.name), objective]));
  return rowObjectives.map((objective) => {
    const match = current.get(lower(objective.name));
    if (!match) return { ...objective, action: "add" };
    const players = Number(objective.players);
    return Number(match.preset_num_of_players_required) === players
      ? { ...objective, action: "same", existingId: match.id }
      : { ...objective, action: "update", existingId: match.id, from: Number(match.preset_num_of_players_required) };
  });
}

// Objectives a game has on Strix that the row doesn't mention: they're kept as they are
export function keptObjectives(rowObjectives, currentObjectives = []) {
  const named = new Set(rowObjectives.map((objective) => lower(objective.name)));
  return currentObjectives.filter((objective) => !named.has(lower(objective.name)));
}

// Problems that stop a row from saving, as short sentences
export function rowProblems(row, allRows = []) {
  const problems = [];
  if (!row.name) problems.push("Add a name.");
  else if (allRows.some((other) => other !== row && other.include && lower(other.name) === lower(row.name))) {
    problems.push("Another game in this import has the same name.");
  }
  if (!row.platformId) problems.push(row.platformName ? `Platform “${row.platformName}” isn't on Strix. Pick one.` : "Pick a platform.");
  if (!row.genreChoice) problems.push("Pick a genre.");
  if (!row.existingGame && !row.save?.gameId && !row.cover) problems.push("Choose a cover image.");

  const seen = new Set();
  for (const objective of row.objectives) {
    const players = Number(objective.players);
    if (!objective.name) problems.push("Every objective needs a name.");
    else if (seen.has(lower(objective.name))) problems.push(`Objective “${objective.name}” is listed twice.`);
    seen.add(lower(objective.name));
    if (!Number.isInteger(players) || players < 1 || players > 100) {
      problems.push(`“${objective.name || "An objective"}” needs a player count from 1 to 100.`);
    }
  }
  return [...new Set(problems)];
}

// Genres the included rows will create, by name, once each
export function genresToCreate(rows) {
  const names = new Map();
  for (const row of rows) {
    if (row.include && row.genreChoice.startsWith("new:")) {
      const name = row.genreChoice.slice(4).trim();
      if (name && !names.has(lower(name))) names.set(lower(name), name);
    }
  }
  return [...names.values()];
}

export function summarise(rows, allRows = rows) {
  const included = rows.filter((row) => row.include);
  return {
    total: rows.length,
    included: included.length,
    created: included.filter((row) => !row.existingGame).length,
    updated: included.filter((row) => row.existingGame).length,
    needCover: included.filter((row) => !row.existingGame && !row.save?.gameId && !row.cover).length,
    withProblems: included.filter((row) => rowProblems(row, allRows).length).length,
    newGenres: genresToCreate(rows).length,
  };
}
