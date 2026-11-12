import { useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useBlocker } from "react-router";
import { AlertTriangle, ArrowLeft, Check, FileJson, Loader2, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import FormField from "@/components/common/FormField";
import ImageUpload from "@/components/common/ImageUpload";
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import { useCan } from "@/features/auth/useCan";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { gameFormData, LINK_FIELDS } from "./gameFields";
import {
  gamesApi,
  useAddObjectiveMutation,
  useCreateGameMutation,
  useGetAllGamesQuery,
  useGetGenresQuery,
  useGetObjectivesQuery,
  useGetPlatformsQuery,
  useSaveGenreMutation,
  useUpdateGameMutation,
  useUpdateObjectiveMutation,
} from "./gamesApi";
import {
  genresToCreate,
  keptObjectives,
  matchToStrix,
  objectiveActions,
  parseGamesFile,
  rowProblems,
  summarise,
} from "./importGames";

const FILTERS = [
  ["all", "All"],
  ["new", "New"],
  ["update", "Updates"],
  ["attention", "Needs attention"],
  ["failed", "Failed"],
];

// Upload a games file, review every game as an editable card, then save them one by one
export default function GameImportPage() {
  const canImport = useCan("create_games");
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");

  if (!canImport) {
    return (
      <EmptyState
        icon={FileJson}
        title="You can't import games"
        description="Importing needs permission to create games. Ask an admin with the Settings page to add it to your role."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Import games"
        description="Upload a JSON file of games, check and edit each one, add the cover images, then save them all."
        actions={
          <Button variant="outline" asChild>
            <Link to="/games">
              <ArrowLeft /> Back to games
            </Link>
          </Button>
        }
      />
      {rows ? (
        <Review rows={rows} setRows={setRows} fileName={fileName} onStartOver={() => setRows(null)} />
      ) : (
        <UploadStep
          onLoaded={(name, nextRows) => {
            setFileName(name);
            setRows(nextRows);
          }}
        />
      )}
    </>
  );
}

function UploadStep({ onLoaded }) {
  const games = useGetAllGamesQuery();
  const platforms = useGetPlatformsQuery();
  const genres = useGetGenresQuery({ limit: 200 });
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const ready = games.isSuccess && platforms.isSuccess && genres.isSuccess;
  const loadError = games.error || platforms.error || genres.error;

  const read = (file) => {
    setError(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseGamesFile(String(reader.result));
      if (parsed.error) {
        setError(parsed.error);
        return;
      }
      onLoaded(
        file.name,
        matchToStrix(parsed.games, {
          existingGames: games.data,
          platforms: platforms.data,
          genres: genres.data?.items ?? [],
        }),
      );
    };
    reader.onerror = () => setError("Couldn't read that file. Try choosing it again.");
    reader.readAsText(file);
  };

  return (
    <Card className="mx-auto max-w-2xl p-6">
      <label
        htmlFor="games-file"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (ready) read(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "hover:bg-muted/50",
          !ready && "pointer-events-none opacity-60",
        )}
      >
        {ready ? <Upload className="size-8 text-muted-foreground" /> : <Loader2 className="size-8 animate-spin" />}
        <span className="font-medium">{ready ? "Choose a games file, or drop it here" : "Loading the games on Strix…"}</span>
        <span className="text-sm text-muted-foreground">
          A .json file with a <code className="rounded bg-muted px-1">mobile_games</code> list. Nothing is saved until you
          review the games and press Import.
        </span>
      </label>
      <input
        id="games-file"
        type="file"
        accept="application/json,.json"
        className="sr-only"
        disabled={!ready}
        onChange={(event) => {
          read(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {(error || loadError) && (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error ?? errorMessage(loadError, "Couldn't load the games on Strix. Refresh the page to try again.")}
        </p>
      )}
    </Card>
  );
}

function Review({ rows, setRows, fileName, onStartOver }) {
  const dispatch = useDispatch();
  const { data: platforms = [] } = useGetPlatformsQuery();
  const genresQuery = useGetGenresQuery({ limit: 200 });
  const genres = genresQuery.data?.items ?? [];
  const [createGame] = useCreateGameMutation();
  const [updateGame] = useUpdateGameMutation();
  const [addObjective] = useAddObjectiveMutation();
  const [updateObjective] = useUpdateObjectiveMutation();
  const [saveGenre] = useSaveGenreMutation();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmStartOver, setConfirmStartOver] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const blocker = useBlocker(saving);

  const summary = summarise(rows);
  const problemsByKey = useMemo(
    () => Object.fromEntries(rows.map((row) => [row.key, row.include ? rowProblems(row, rows) : []])),
    [rows],
  );
  const toSave = rows.filter((row) => row.include && row.save.state !== "saved");
  const blocked = toSave.filter((row) => problemsByKey[row.key].length);
  const failedCount = rows.filter((row) => row.include && row.save.state === "failed").length;
  const savedCount = rows.filter((row) => row.save.state === "saved").length;

  const visible = rows.filter((row) => {
    if (search && !row.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "new") return !row.existingGame;
    if (filter === "update") return !!row.existingGame;
    if (filter === "attention") return row.include && problemsByKey[row.key].length > 0;
    if (filter === "failed") return row.save.state === "failed";
    return true;
  });

  const patch = (key, changes) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...(typeof changes === "function" ? changes(row) : changes) } : row)),
    );
  const setSave = (key, save) => patch(key, (row) => ({ save: { ...row.save, ...save } }));
  const setAll = (include) => setRows((current) => current.map((row) => (row.save.state === "saved" ? row : { ...row, include })));

  // Creates the genres the import needs, once each. Returns { "new:Name": id }
  const createGenres = async (needed) => {
    const ids = {};
    for (const name of genresToCreate(needed)) {
      try {
        const result = await saveGenre({ name, status: "active" }).unwrap();
        ids[`new:${name}`] = result.genre.id;
      } catch (error) {
        // Already there (made by someone else meanwhile): use it
        const fresh = await dispatch(gamesApi.endpoints.getGenres.initiate({ limit: 200 }, { forceRefetch: true })).unwrap();
        const found = fresh.items.find((genre) => genre.name.toLowerCase() === name.toLowerCase());
        if (!found) throw new Error(`Couldn't create the genre “${name}”: ${errorMessage(error)}`);
        ids[`new:${name}`] = found.id;
      }
    }
    return ids;
  };

  const saveRow = async (row, genreIds) => {
    setSave(row.key, { state: "saving", error: null });
    try {
      const genreId = row.genreChoice.startsWith("new:") ? genreIds[row.genreChoice] : Number(row.genreChoice.slice(3));
      const formData = gameFormData({
        name: row.name,
        system_game_platform_id: row.platformId,
        system_game_genre_id: genreId,
        status: row.status,
        cover_image: row.cover,
        links: row.links,
      });

      // Once created, a game is updated on a retry, never created twice
      let gameId = row.save.gameId;
      if (gameId) {
        await updateGame({ id: gameId, formData }).unwrap();
      } else {
        const result = await createGame(formData).unwrap();
        gameId = result.game.id;
        setSave(row.key, { gameId });
      }

      const current = await dispatch(gamesApi.endpoints.getObjectives.initiate(gameId, { forceRefetch: true })).unwrap();
      for (const objective of objectiveActions(row.objectives, current ?? [])) {
        const players = Number(objective.players);
        if (objective.action === "add") {
          await addObjective({ gameId, name: objective.name, preset_num_of_players_required: players }).unwrap();
        } else if (objective.action === "update") {
          await updateObjective({ gameId, objectiveId: objective.existingId, preset_num_of_players_required: players }).unwrap();
        }
      }

      setSave(row.key, { state: "saved", error: null, gameId });
      return true;
    } catch (error) {
      setSave(row.key, { state: "failed", error: errorMessage(error, "Couldn't save this game.") });
      return false;
    }
  };

  const run = async (onlyFailed = false) => {
    const latest = rowsRef.current;
    const queue = latest.filter(
      (row) =>
        row.include &&
        row.save.state !== "saved" &&
        (!onlyFailed || row.save.state === "failed") &&
        rowProblems(row, latest).length === 0,
    );
    if (!queue.length) return;

    setSaving(true);
    queue.forEach((row) => setSave(row.key, { state: "waiting", error: null }));
    let genreIds = {};
    try {
      genreIds = await createGenres(queue);
      // Rows now point at the created genres, so a retry or a later import reuses them
      if (Object.keys(genreIds).length) {
        setRows((current) =>
          current.map((row) => (genreIds[row.genreChoice] ? { ...row, genreChoice: `id:${genreIds[row.genreChoice]}` } : row)),
        );
      }
    } catch (error) {
      queue.forEach((row) => setSave(row.key, { state: "failed", error: error.message }));
      setSaving(false);
      return;
    }

    let saved = 0;
    for (const row of queue) {
      if (await saveRow(rowsRef.current.find((item) => item.key === row.key) ?? row, genreIds)) saved += 1;
    }
    setSaving(false);

    const failed = queue.length - saved;
    if (failed) toast.error(`${saved} saved, ${failed} failed. Fix them and press Retry failed.`);
    else toast.success(`${saved} ${saved === 1 ? "game" : "games"} imported`);
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-medium">
            <FileJson className="size-4 shrink-0" />
            <span className="truncate">{fileName}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {summary.total} games: {summary.created} new, {summary.updated} updates
            {summary.newGenres ? `, ${summary.newGenres} new ${summary.newGenres === 1 ? "genre" : "genres"}` : ""}
            {summary.needCover ? `, ${summary.needCover} need a cover image` : ""}
            {savedCount ? `. ${savedCount} saved` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAll(true)} disabled={saving}>
            Select all
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAll(false)} disabled={saving}>
            Select none
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmStartOver(true)} disabled={saving}>
            Choose another file
          </Button>
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search this file" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="sm:w-48" aria-label="Show">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={FileJson} title="No games match" description="Change the search or the filter." />
      ) : (
        <div className="grid gap-4 2xl:grid-cols-2">
          {visible.map((row) => (
            <ImportCard
              key={row.key}
              row={row}
              problems={problemsByKey[row.key]}
              platforms={platforms}
              genres={genres}
              disabled={saving || row.save.state === "saved"}
              onChange={(changes) => patch(row.key, changes)}
            />
          ))}
        </div>
      )}

      {/* Stays at the bottom of the screen while scrolling through the cards */}
      <div className="sticky bottom-0 z-20 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-muted-foreground">
            {blocked.length > 0
              ? `${blocked.length} selected ${blocked.length === 1 ? "game needs" : "games need"} attention and will be skipped until fixed.`
              : toSave.length
                ? `${toSave.length} ${toSave.length === 1 ? "game" : "games"} ready to import.`
                : savedCount
                  ? "Everything selected is saved."
                  : "Select the games to import."}
          </p>
          {failedCount > 0 && (
            <Button variant="outline" onClick={() => run(true)} disabled={saving}>
              <RotateCcw /> Retry failed ({failedCount})
            </Button>
          )}
          <Button onClick={() => run(false)} disabled={saving || toSave.length - blocked.length === 0}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? "Importing…" : `Import ${toSave.length - blocked.length} ${toSave.length - blocked.length === 1 ? "game" : "games"}`}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmStartOver}
        onOpenChange={setConfirmStartOver}
        title="Choose another file?"
        description="Your edits and chosen images for this file are lost. Games already saved stay saved."
        confirmLabel="Choose another file"
        onConfirm={() => {
          setConfirmStartOver(false);
          onStartOver();
        }}
      />
      <ConfirmDialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="Leave while importing?"
        description="Games not yet saved won't be imported, and your edits are lost."
        confirmLabel="Leave"
        destructive
        onConfirm={() => blocker.proceed?.()}
      />
    </div>
  );
}

function SaveState({ save }) {
  if (save.state === "saving") return <Badge variant="secondary"><Loader2 className="animate-spin" /> Saving</Badge>;
  if (save.state === "waiting") return <Badge variant="outline">Waiting</Badge>;
  if (save.state === "saved") return <Badge className="bg-emerald-600 text-white"><Check /> Saved</Badge>;
  if (save.state === "failed") return <Badge variant="destructive">Failed</Badge>;
  return null;
}

function ImportCard({ row, problems, platforms, genres, disabled, onChange }) {
  const existingId = row.existingGame?.id;
  const { data: current = [] } = useGetObjectivesQuery(existingId, { skip: !existingId });
  const actions = existingId ? objectiveActions(row.objectives, current) : row.objectives.map((o) => ({ ...o, action: "add" }));
  const kept = existingId ? keptObjectives(row.objectives, current) : [];
  const linksSet = LINK_FIELDS.filter(([key]) => row.links[key]).length;
  const id = (field) => `${row.key}-${field}`;
  const setObjective = (key, changes) =>
    onChange((r) => ({ objectives: r.objectives.map((o) => (o.key === key ? { ...o, ...changes } : o)) }));

  const genreOptions = [...genres.map((genre) => ({ value: `id:${genre.id}`, label: genre.name }))];
  if (row.genreChoice.startsWith("new:")) {
    genreOptions.unshift({ value: row.genreChoice, label: `Create genre “${row.genreChoice.slice(4)}”` });
  }

  return (
    <Card
      className={cn("gap-0 p-0 [content-visibility:auto] [contain-intrinsic-size:auto_520px]", !row.include && "opacity-60")}
      role="group"
      aria-label={row.name || "Unnamed game"}
    >
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <Checkbox
          id={id("include")}
          checked={row.include}
          disabled={disabled}
          onCheckedChange={(checked) => onChange({ include: checked === true })}
          aria-label={`Import ${row.name || "this game"}`}
        />
        <label htmlFor={id("include")} className="min-w-0 flex-1 truncate font-medium">
          {row.name || "Unnamed game"}
        </label>
        {row.existingGame ? <Badge variant="outline">Update</Badge> : <Badge variant="secondary">New</Badge>}
        {row.include && problems.length > 0 && row.save.state !== "saved" && (
          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
            <AlertTriangle /> Needs attention
          </Badge>
        )}
        <SaveState save={row.save} />
      </div>

      <fieldset disabled={disabled} className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
        <FormField label={row.existingGame ? "Cover image (optional)" : "Cover image"}>
          <ImageUpload value={row.cover} onChange={(cover) => onChange({ cover })} currentUrl={row.existingGame?.cover_image} />
        </FormField>

        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Name" htmlFor={id("name")} className="sm:col-span-2">
              <Input id={id("name")} value={row.name} onChange={(e) => onChange({ name: e.target.value })} />
            </FormField>
            <FormField label="Platform">
              <Select value={row.platformId} onValueChange={(platformId) => onChange({ platformId })} disabled={disabled}>
                <SelectTrigger className="w-full" aria-label="Platform">
                  <SelectValue placeholder="Choose a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={String(platform.id)}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Genre">
              <Select value={row.genreChoice} onValueChange={(genreChoice) => onChange({ genreChoice })} disabled={disabled}>
                <SelectTrigger className="w-full" aria-label="Genre">
                  <SelectValue placeholder="Choose a genre" />
                </SelectTrigger>
                <SelectContent>
                  {genreOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={row.status} onValueChange={(status) => onChange({ status })} disabled={disabled}>
                <SelectTrigger className="w-full" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <details className="rounded-lg border px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">
              App links <span className="font-normal text-muted-foreground">({linksSet} of {LINK_FIELDS.length} set)</span>
            </summary>
            <div className="mt-3 grid gap-3">
              {LINK_FIELDS.map(([key, label, placeholder]) => (
                <FormField key={key} label={label} htmlFor={id(key)}>
                  <Input
                    id={id(key)}
                    value={row.links[key]}
                    placeholder={placeholder}
                    onChange={(e) => onChange((r) => ({ links: { ...r.links, [key]: e.target.value } }))}
                  />
                </FormField>
              ))}
            </div>
          </details>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Objectives</p>
              <span className="text-xs text-muted-foreground">Players needed</span>
            </div>
            {actions.map((objective) => (
              <div key={objective.key} className="flex items-center gap-2">
                <Input
                  aria-label="Objective name"
                  value={objective.name}
                  onChange={(e) => setObjective(objective.key, { name: e.target.value })}
                  className="min-w-0 flex-1"
                />
                {existingId && objective.name && (
                  <span className="hidden w-16 shrink-0 text-xs text-muted-foreground sm:block">
                    {objective.action === "add" ? "New" : objective.action === "update" ? `was ${objective.from}` : "Same"}
                  </span>
                )}
                <Input
                  aria-label={`Players needed for ${objective.name || "this objective"}`}
                  type="number"
                  min={1}
                  max={100}
                  value={objective.players}
                  onChange={(e) => setObjective(objective.key, { players: e.target.value })}
                  className="w-20 shrink-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${objective.name || "objective"}`}
                  onClick={() => onChange((r) => ({ objectives: r.objectives.filter((o) => o.key !== objective.key) }))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange((r) => ({
                  objectives: [...r.objectives, { key: `obj-new-${Date.now()}-${r.objectives.length}`, name: "", players: 1 }],
                }))
              }
            >
              <Plus /> Add objective
            </Button>
            {kept.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Kept on Strix, not in this file: {kept.map((o) => `${o.name} (${o.preset_num_of_players_required})`).join(", ")}
              </p>
            )}
          </div>

          {row.include && row.save.state !== "saved" && problems.length > 0 && (
            <ul className="space-y-1 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
          {row.save.state === "failed" && row.save.error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {row.save.error}
            </p>
          )}
        </div>
      </fieldset>
    </Card>
  );
}
