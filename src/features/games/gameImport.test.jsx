import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GameImportPage from "./GameImportPage";
import { makeStore, renderRoutes } from "@/test/utils";
import { imageSize } from "@/lib/imageSize";

// jsdom can't decode images, so the size reader is faked: files named "wide…" are 800 × 500, the rest 500 × 500
vi.mock("@/lib/imageSize", () => ({
  imageSize: vi.fn(async (file) => (file.name.startsWith("wide") ? { width: 800, height: 500 } : { width: 500, height: 500 })),
}));

const FILE = JSON.stringify({
  mobile_games: [
    {
      name: "Brawl Stars",
      platform: "Mobile",
      genre: "Action",
      status: "Active",
      app_links: { android_package: "com.supercell.brawlstars", play_store_link: "https://play.google.com/store/apps/details?id=com.supercell.brawlstars" },
      objectives: [
        { name: "Gem Grab", players_needed: 3 },
        { name: "Duo Showdown", players_needed: 2 },
      ],
    },
    {
      name: "Among Us",
      platform: "Mobile",
      genre: "Social Deduction",
      status: "Active",
      app_links: {},
      objectives: [{ name: "Private Lobby", players_needed: 5 }],
    },
  ],
});

// A small fake of the backend that answers by method and path, and records each call
function fakeBackend({ failObjectivesOnce = false } = {}) {
  const calls = [];
  let objectivesFailed = false;
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = vi.fn(async (input) => {
    const request = input instanceof Request ? input : new Request(input);
    const path = new URL(request.url).pathname.replace(/^\/api/, "");
    const call = `${request.method} ${path}`;
    calls.push(call);
    switch (call) {
      case "GET /games":
        return json(200, { data: [{ id: 7, name: "Brawl Stars", system_game_platform_id: 1, system_game_genre_id: 1, cover_image: null }] });
      case "GET /platforms":
        return json(200, { data: [{ id: 1, name: "Mobile" }] });
      case "GET /genres":
        return json(200, { data: [{ id: 1, name: "Action" }] });
      case "POST /genres":
        return json(201, { genre: { id: 9, name: "Social Deduction" } });
      case "POST /games":
        return json(201, { game: { id: 50, name: "Among Us" } });
      case "POST /games/7":
        return json(200, { game: { id: 7 } });
      case "GET /games/7/objectives":
        return json(200, {
          data: [
            { id: 11, name: "Gem Grab", preset_num_of_players_required: 3 },
            { id: 12, name: "Duo Showdown", preset_num_of_players_required: 4 },
            { id: 13, name: "Knockout", preset_num_of_players_required: 3 },
          ],
        });
      case "GET /games/50/objectives":
        return json(404, { message: "No objectives" });
      case "POST /games/50/objectives":
        if (failObjectivesOnce && !objectivesFailed) {
          objectivesFailed = true;
          return json(422, { message: "Validation failed", errors: { preset_num_of_players_required: ["The players needed field is required."] } });
        }
        return json(201, { objective: { id: 60 } });
      case "POST /games/50":
        return json(200, { game: { id: 50 } });
      case "PUT /games/7/objectives/12":
        return json(200, { objective: { id: 12 } });
      default:
        return json(404, { message: "Not found" });
    }
  });
  return calls;
}

beforeAll(() => {
  globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
  globalThis.URL.revokeObjectURL = vi.fn();
});

const routes = [
  { path: "/games/import", element: <GameImportPage /> },
  { path: "/games", element: <p>Games list</p> },
];
const store = () => makeStore({ token: "tok", permissions: ["view_games", "create_games", "edit_games"] });

async function uploadFile() {
  const input = await screen.findByLabelText(/Choose a games file/);
  await userEvent.upload(input, new File([FILE], "mobile_games_v3.json", { type: "application/json" }));
  return screen.findByRole("group", { name: "Brawl Stars" });
}

test("a file's games become editable cards, matched to what Strix has", async () => {
  fakeBackend();
  renderRoutes(routes, { store: store(), path: "/games/import" });

  const brawl = await uploadFile();
  const amongUs = screen.getByRole("group", { name: "Among Us" });

  expect(screen.getByText(/2 games: 1 new, 1 updates, 1 new genre, 1 need a cover image/)).toBeInTheDocument();
  expect(within(brawl).getByText("Update")).toBeInTheDocument();
  expect(within(amongUs).getByText("New")).toBeInTheDocument();
  expect(within(amongUs).getByText("Choose a cover image.")).toBeInTheDocument();
  expect(within(amongUs).getByRole("combobox", { name: "Genre" })).toHaveTextContent("Create genre “Social Deduction”");
  // Existing objectives: one changes, one stays, one not in the file is kept
  expect(await within(brawl).findByText("was 4")).toBeInTheDocument();
  expect(within(brawl).getByText(/Kept on Strix, not in this file: Knockout \(3\)/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import 1 game" })).toBeEnabled();
});

test("importing creates the genre, then saves each game and its objectives in order", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/games/import" });

  await uploadFile();
  const amongUs = screen.getByRole("group", { name: "Among Us" });
  await userEvent.upload(
    within(amongUs).getByLabelText(/Choose an image/),
    new File(["png"], "among-us.png", { type: "image/png" }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Import 2 games" }));

  await waitFor(() => expect(screen.getAllByText("Saved")).toHaveLength(2));
  const writes = calls.filter((call) => !call.startsWith("GET"));
  expect(writes).toEqual([
    "POST /genres",
    "POST /games/7",
    "PUT /games/7/objectives/12",
    "POST /games",
    "POST /games/50/objectives",
  ]);
  expect(screen.getByText("Everything selected is saved.")).toBeInTheDocument();
});

test("an unticked game is skipped", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store(), path: "/games/import" });

  await uploadFile();
  await userEvent.click(screen.getByRole("checkbox", { name: "Import Among Us" }));
  await userEvent.click(screen.getByRole("button", { name: "Import 1 game" }));

  await waitFor(() => expect(screen.getAllByText("Saved")).toHaveLength(1));
  expect(calls.filter((call) => !call.startsWith("GET"))).toEqual(["POST /games/7", "PUT /games/7/objectives/12"]);
});

test("a file that isn't JSON is explained", async () => {
  fakeBackend();
  renderRoutes(routes, { store: store(), path: "/games/import" });

  const input = await screen.findByLabelText(/Choose a games file/);
  await userEvent.upload(input, new File(["{ nope"], "bad.json", { type: "application/json" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("This file isn't valid JSON.");
});

test("a failed game is retried without being created twice", async () => {
  const calls = fakeBackend({ failObjectivesOnce: true });
  renderRoutes(routes, { store: store(), path: "/games/import" });

  await uploadFile();
  await userEvent.click(screen.getByRole("checkbox", { name: "Import Brawl Stars" }));
  const amongUs = screen.getByRole("group", { name: "Among Us" });
  await userEvent.upload(within(amongUs).getByLabelText(/Choose an image/), new File(["png"], "a.png", { type: "image/png" }));
  await userEvent.click(screen.getByRole("button", { name: "Import 1 game" }));

  expect(await within(amongUs).findByText("The players needed field is required.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Retry failed (1)" }));

  await waitFor(() => expect(within(amongUs).getByText("Saved")).toBeInTheDocument());
  expect(calls.filter((call) => !call.startsWith("GET"))).toEqual([
    "POST /genres",
    "POST /games",
    "POST /games/50/objectives",
    // The retry updates the game it already made
    "POST /games/50",
    "POST /games/50/objectives",
  ]);
});

test("a cover that isn't 500 × 500 is refused", async () => {
  fakeBackend();
  renderRoutes(routes, { store: store(), path: "/games/import" });

  await uploadFile();
  const amongUs = screen.getByRole("group", { name: "Among Us" });
  await userEvent.upload(within(amongUs).getByLabelText(/Choose an image/), new File(["png"], "wide.png", { type: "image/png" }));

  expect(await within(amongUs).findByText("The image must be exactly 500 × 500 pixels. This one is 800 × 500.")).toBeInTheDocument();
  expect(within(amongUs).getByText("Choose a cover image.")).toBeInTheDocument();
  expect(imageSize).toHaveBeenCalled();
});
