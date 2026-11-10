import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormField from "@/components/common/FormField";
import ImageUpload from "@/components/common/ImageUpload";
import { useGetGamesQuery } from "@/features/games/gamesApi";
import { fieldErrors } from "@/lib/api";
import { useSaveTournamentMutation } from "./tournamentsApi";

const TEAM_COUNTS = [2, 4, 8, 16, 32, 64];
const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export default function TournamentFormDialog({ open, onOpenChange, tournament, onSaved }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        {open && <TournamentForm key={tournament?.id ?? "new"} tournament={tournament} onDone={(saved) => { onOpenChange(false); if (saved) onSaved?.(saved); }} />}
      </DialogContent>
    </Dialog>
  );
}

function TournamentForm({ tournament, onDone }) {
  const { data: games } = useGetGamesQuery({ limit: 100 });
  const [save, { isLoading, error }] = useSaveTournamentMutation();
  const errors = fieldErrors(error);
  const [values, setValues] = useState({
    title: tournament?.title ?? "",
    description: tournament?.description ?? "",
    game_id: tournament?.tagged_game_id ? String(tournament.tagged_game_id) : "",
    bracket_type: tournament?.bracket_type ?? "team_based",
    number_of_teams: String(tournament?.team_count ?? 8),
    players_per_team: String(tournament?.players_per_team_count ?? 4),
    review_mode: tournament?.review_mode ?? true,
    start_date: tournament?.start_date?.slice(0, 10) ?? tomorrow(),
    strix_gold_entry_fee: String(tournament?.strix_gold_entry_fee ?? 0),
    graphic_file: null,
  });
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e?.target ? e.target.value : e }));
  const solo = values.bracket_type === "player_based";

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData();
    for (const [key, value] of Object.entries({ ...values, players_per_team: solo ? "1" : values.players_per_team })) {
      if (key === "graphic_file") {
        if (value) form.append(key, value);
      } else if (typeof value === "boolean") form.append(key, value ? "1" : "0");
      else form.append(key, value ?? "");
    }
    try {
      const result = await save({ id: tournament?.id, formData: form }).unwrap();
      toast.success(tournament ? "Tournament updated" : "Tournament created");
      onDone(result?.data ?? result?.tournament ?? null);
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{tournament ? `Edit ${tournament.title}` : "Create a Strix tournament"}</DialogTitle>
        <DialogDescription>Official tournaments show the Strix badge and cost no creation fee.</DialogDescription>
      </DialogHeader>
      <FormField label="Banner" error={errors.graphic_file}>
        <ImageUpload value={values.graphic_file} onChange={set("graphic_file")} currentUrl={tournament?.image} />
      </FormField>
      <FormField label="Title" htmlFor="t-title" error={errors.title}>
        <Input id="t-title" required value={values.title} onChange={set("title")} />
      </FormField>
      <FormField label="Description" htmlFor="t-desc" error={errors.description}>
        <Textarea id="t-desc" rows={3} value={values.description} onChange={set("description")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Game" error={errors.game_id}>
          <Select value={values.game_id} onValueChange={set("game_id")} required>
            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a game" /></SelectTrigger>
            <SelectContent>{(games?.items ?? []).map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="Start date" htmlFor="t-start" error={errors.start_date}>
          <Input id="t-start" type="date" required min={tomorrow()} value={values.start_date} onChange={set("start_date")} />
        </FormField>
        <FormField label="Format" error={errors.bracket_type}>
          <Select value={values.bracket_type} onValueChange={set("bracket_type")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="team_based">Teams</SelectItem>
              <SelectItem value="player_based">Solo players</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={solo ? "Players" : "Teams"} error={errors.number_of_teams} hint="Brackets need 2, 4, 8, 16…">
          <Select value={values.number_of_teams} onValueChange={set("number_of_teams")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{TEAM_COUNTS.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        {!solo && (
          <FormField label="Players per team" htmlFor="t-ppt" error={errors.players_per_team}>
            <Input id="t-ppt" type="number" min={1} max={10} required value={values.players_per_team} onChange={set("players_per_team")} />
          </FormField>
        )}
        <FormField label="Entry fee (Strix Gold per player)" htmlFor="t-fee" error={errors.strix_gold_entry_fee}>
          <Input id="t-fee" type="number" min={0} required value={values.strix_gold_entry_fee} onChange={set("strix_gold_entry_fee")} />
        </FormField>
      </div>
      <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
        <span>
          <span className="font-medium">Review entries</span>
          <span className="block text-muted-foreground">You approve each team before it's in.</span>
        </span>
        <Switch checked={values.review_mode} onCheckedChange={set("review_mode")} />
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onDone()} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading || !values.game_id}>
          {isLoading && <Loader2 className="animate-spin" />}
          {tournament ? "Save" : "Create tournament"}
        </Button>
      </DialogFooter>
    </form>
  );
}
