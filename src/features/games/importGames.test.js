import {
  genresToCreate,
  keptObjectives,
  matchToStrix,
  objectiveActions,
  parseGamesFile,
  rowProblems,
  summarise,
} from "./importGames";

// The shape of the owner's mobile_games_v3.json, trimmed to two games
const FILE = JSON.stringify({
  mobile_games: [
    {
      image: null,
      name: "Brawl Stars",
      platform: "Mobile",
      genre: "Action",
      status: "Active",
      app_links: {
        android_package: "com.supercell.brawlstars",
        ios_url_scheme: "brawlstars://",
        play_store_link: "https://play.google.com/store/apps/details?id=com.supercell.brawlstars",
        app_store_link: "https://apps.apple.com/app/id1229016807",
        deep_link_template: "brawlstars://friend?tag={gamer_id}",
      },
      objectives: [
        { name: "Gem Grab", players_needed: 3 },
        { name: "Duo Showdown", players_needed: 2 },
      ],
    },
    {
      image: null,
      name: "Among Us",
      platform: "Mobile",
      genre: "Social Deduction",
      status: "Active",
      app_links: { android_package: "com.innersloth.spacemafia", ios_url_scheme: null, play_store_link: null, app_store_link: null, deep_link_template: null },
      objectives: [{ name: "Private Lobby", players_needed: 5 }],
    },
  ],
});

const strix = {
  existingGames: [{ id: 7, name: "brawl stars", system_game_platform_id: 1, system_game_genre_id: 1 }],
  platforms: [{ id: 1, name: "Mobile" }, { id: 2, name: "PC" }],
  genres: [{ id: 1, name: "Action" }, { id: 4, name: "Racing" }],
};

test("reads the owner's file shape and maps the link names", () => {
  const { games, error } = parseGamesFile(FILE);

  expect(error).toBeNull();
  expect(games).toHaveLength(2);
  expect(games[0]).toMatchObject({
    name: "Brawl Stars",
    platformName: "Mobile",
    genreName: "Action",
    status: "active",
    links: {
      android_package: "com.supercell.brawlstars",
      play_store_url: "https://play.google.com/store/apps/details?id=com.supercell.brawlstars",
      app_store_url: "https://apps.apple.com/app/id1229016807",
      deep_link_template: "brawlstars://friend?tag={gamer_id}",
    },
  });
  expect(games[0].objectives.map(({ name, players }) => [name, players])).toEqual([["Gem Grab", 3], ["Duo Showdown", 2]]);
  // Missing links become empty, not "null"
  expect(games[1].links.ios_url_scheme).toBe("");
});

test("explains files it can't use", () => {
  expect(parseGamesFile("{ nope").error).toMatch(/isn't valid JSON/);
  expect(parseGamesFile(JSON.stringify({ other: [] })).error).toMatch(/No games found/);
  expect(parseGamesFile(JSON.stringify({ mobile_games: [] })).error).toMatch(/No games found/);
  expect(parseGamesFile(JSON.stringify([{ name: "Solo" }])).games).toHaveLength(1);
});

test("matches existing games, platforms and genres by name, and plans new genres", () => {
  const rows = matchToStrix(parseGamesFile(FILE).games, strix);

  expect(rows[0].existingGame?.id).toBe(7);
  expect(rows[0].save.gameId).toBe(7);
  expect(rows[0].platformId).toBe("1");
  expect(rows[0].genreChoice).toBe("id:1");
  expect(rows[1].existingGame).toBeNull();
  expect(rows[1].genreChoice).toBe("new:Social Deduction");
  expect(genresToCreate(rows)).toEqual(["Social Deduction"]);

  rows[1].include = false;
  expect(genresToCreate(rows)).toEqual([]);
});

test("works out which objectives to add, update or leave, and which are kept", () => {
  const rows = matchToStrix(parseGamesFile(FILE).games, strix);
  const current = [
    { id: 11, name: "gem grab", preset_num_of_players_required: 3 },
    { id: 12, name: "Duo Showdown", preset_num_of_players_required: 4 },
    { id: 13, name: "Knockout", preset_num_of_players_required: 3 },
  ];
  rows[0].objectives.push({ key: "x", name: "Brawl Ball", players: 3 });

  const actions = objectiveActions(rows[0].objectives, current);
  expect(actions.map((objective) => [objective.name, objective.action, objective.existingId ?? null])).toEqual([
    ["Gem Grab", "same", 11],
    ["Duo Showdown", "update", 12],
    ["Brawl Ball", "add", null],
  ]);
  expect(actions[1].from).toBe(4);
  expect(keptObjectives(rows[0].objectives, current).map((objective) => objective.name)).toEqual(["Knockout"]);
});

test("lists what stops a row from saving", () => {
  const rows = matchToStrix(parseGamesFile(FILE).games, strix);

  // An existing game needs no new cover; a new one does
  expect(rowProblems(rows[0], rows)).toEqual([]);
  expect(rowProblems(rows[1], rows)).toEqual(["Choose a cover image."]);

  rows[1].cover = new File(["x"], "cover.png", { type: "image/png" });
  rows[1].objectives.push({ key: "y", name: "private lobby", players: 0 });
  rows[1].platformId = "";
  rows[1].platformName = "Switch";
  expect(rowProblems(rows[1], rows)).toEqual([
    "Platform “Switch” isn't on Strix. Pick one.",
    "Objective “private lobby” is listed twice.",
    "“private lobby” needs a player count from 1 to 100.",
  ]);

  rows[1].name = "BRAWL STARS";
  expect(rowProblems(rows[1], rows)).toContain("Another game in this import has the same name.");
});

test("sums up the import", () => {
  const rows = matchToStrix(parseGamesFile(FILE).games, strix);

  expect(summarise(rows)).toEqual({ total: 2, included: 2, created: 1, updated: 1, needCover: 1, withProblems: 1, newGenres: 1 });
});
