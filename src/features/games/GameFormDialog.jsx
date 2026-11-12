import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import FormField from "@/components/common/FormField";
import ImageUpload from "@/components/common/ImageUpload";
import { fieldErrors, toFormData } from "@/lib/api";
import {
  useCreateGameMutation,
  useGetGenresQuery,
  useGetPlatformsQuery,
  useUpdateGameMutation,
} from "./gamesApi";
import { LINK_FIELDS } from "./gameFields";

function initialValues(game) {
  return {
    name: game?.name ?? "",
    system_game_platform_id: game?.system_game_platform_id ? String(game.system_game_platform_id) : "",
    system_game_genre_id: game?.system_game_genre_id ? String(game.system_game_genre_id) : "",
    status: game?.status ?? "active",
    cover_image: null,
    ...Object.fromEntries(LINK_FIELDS.map(([key]) => [key, game?.[key] ?? ""])),
  };
}

// Add a game (no `game`) or edit one
export default function GameFormDialog({ open, onOpenChange, game }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        {/* Remount per game so the form starts from that game's values */}
        {open && <GameForm key={game?.id ?? "new"} game={game} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function GameForm({ game, onDone }) {
  const [values, setValues] = useState(() => initialValues(game));
  const { data: platforms = [] } = useGetPlatformsQuery();
  const { data: genres } = useGetGenresQuery({ limit: 100 });
  const [createGame, creating] = useCreateGameMutation();
  const [updateGame, updating] = useUpdateGameMutation();
  const saving = creating.isLoading || updating.isLoading;
  const errors = fieldErrors(game ? updating.error : creating.error);
  const set = (key) => (value) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    // Empty link fields are sent as empty strings so they can be cleared
    const formData = toFormData({ ...values, cover_image: values.cover_image });
    for (const [key] of LINK_FIELDS) if (!values[key]) formData.append(key, "");
    try {
      if (game) await updateGame({ id: game.id, formData }).unwrap();
      else await createGame(formData).unwrap();
      toast.success(game ? "Game updated" : "Game added");
      onDone();
    } catch {
      // Field errors show inline; other errors show as a toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{game ? `Edit ${game.name}` : "Add a game"}</DialogTitle>
        <DialogDescription>Players pick from these games for team-ups, clips and tournaments.</DialogDescription>
      </DialogHeader>

      <FormField label="Cover image" error={errors.cover_image}>
        <ImageUpload
          value={values.cover_image}
          onChange={set("cover_image")}
          currentUrl={game?.cover_image}
          invalid={!!errors.cover_image}
        />
      </FormField>

      <FormField label="Name" htmlFor="game-name" error={errors.name}>
        <Input id="game-name" required value={values.name} onChange={(e) => set("name")(e.target.value)} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Platform" error={errors.system_game_platform_id}>
          <Select value={values.system_game_platform_id} onValueChange={set("system_game_platform_id")} required>
            <SelectTrigger className="w-full">
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
        <FormField label="Genre" error={errors.system_game_genre_id}>
          <Select value={values.system_game_genre_id} onValueChange={set("system_game_genre_id")} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a genre" />
            </SelectTrigger>
            <SelectContent>
              {(genres?.items ?? []).map((genre) => (
                <SelectItem key={genre.id} value={String(genre.id)}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="Status" error={errors.status} hint="Inactive games are hidden from players.">
        <Select value={values.status} onValueChange={set("status")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <Separator />
      <div className="space-y-1">
        <p className="text-sm font-medium">App links</p>
        <p className="text-xs text-muted-foreground">
          Optional. They let the Strix app open the game or its store page.
        </p>
      </div>
      {LINK_FIELDS.map(([key, label, placeholder]) => (
        <FormField key={key} label={label} htmlFor={`game-${key}`} error={errors[key]}>
          <Input
            id={`game-${key}`}
            value={values[key]}
            placeholder={placeholder}
            onChange={(e) => set(key)(e.target.value)}
          />
        </FormField>
      ))}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || (!game && !values.cover_image)}>
          {saving && <Loader2 className="animate-spin" />}
          {game ? "Save changes" : "Add game"}
        </Button>
      </DialogFooter>
    </form>
  );
}
