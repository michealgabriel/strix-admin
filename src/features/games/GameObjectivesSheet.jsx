import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import FormField from "@/components/common/FormField";
import { Can } from "@/features/auth/permissions";
import { fieldErrors } from "@/lib/api";
import { useAddObjectiveMutation, useDeleteObjectiveMutation, useGetObjectivesQuery } from "./gamesApi";

// The preset objectives players choose from when they host a team-up for this game
export default function GameObjectivesSheet({ game, onOpenChange }) {
  return (
    <Sheet open={!!game} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {game && <Objectives game={game} />}
      </SheetContent>
    </Sheet>
  );
}

function Objectives({ game }) {
  const { data: objectives = [], isLoading } = useGetObjectivesQuery(game.id);
  const [add, adding] = useAddObjectiveMutation();
  const [remove, removing] = useDeleteObjectiveMutation();
  const [form, setForm] = useState({ name: "", players: "4" });
  const [toDelete, setToDelete] = useState(null);
  const errors = fieldErrors(adding.error);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await add({
        gameId: game.id,
        name: form.name.trim(),
        preset_num_of_players_required: Number(form.players),
        status: "active",
      }).unwrap();
      setForm({ name: "", players: form.players });
      toast.success("Objective added");
    } catch {
      // shown inline or as a toast
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{game.name} objectives</SheetTitle>
        <SheetDescription>What players can pick when they host a team-up, like “Ranked push”.</SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-6">
        <ul className="divide-y rounded-lg border">
          {isLoading && (
            <li className="p-3">
              <Skeleton className="h-5 w-40" />
            </li>
          )}
          {!isLoading && objectives.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">No objectives yet.</li>
          )}
          {objectives.map((objective) => (
            <li key={objective.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{objective.name}</p>
                <p className="text-xs text-muted-foreground">
                  {objective.preset_num_of_players_required} players
                </p>
              </div>
              <Can permission="create_games">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${objective.name}`}
                  onClick={() => setToDelete(objective)}
                >
                  <Trash2 />
                </Button>
              </Can>
            </li>
          ))}
        </ul>

        <Can permission="create_games">
          <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Add an objective</p>
            <FormField label="Name" htmlFor="objective-name" error={errors.name}>
              <Input
                id="objective-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </FormField>
            <FormField label="Players needed" htmlFor="objective-players" error={errors.preset_num_of_players_required}>
              <Input
                id="objective-players"
                type="number"
                min={1}
                max={100}
                required
                value={form.players}
                onChange={(e) => setForm({ ...form, players: e.target.value })}
              />
            </FormField>
            <Button type="submit" size="sm" disabled={adding.isLoading}>
              {adding.isLoading ? <Loader2 className="animate-spin" /> : <Plus />}
              Add objective
            </Button>
          </form>
        </Can>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete “${toDelete?.name}”?`}
        description="Players won't be able to pick it for new team-ups."
        confirmLabel="Delete"
        destructive
        busy={removing.isLoading}
        onConfirm={async () => {
          try {
            await remove({ gameId: game.id, objectiveId: toDelete.id }).unwrap();
            toast.success("Objective deleted");
            setToDelete(null);
          } catch {
            // toast from the store
          }
        }}
      />
    </>
  );
}
