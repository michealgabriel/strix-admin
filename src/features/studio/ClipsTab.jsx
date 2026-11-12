import { useState } from "react";
import { Clapperboard, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import FormField from "@/components/common/FormField";
import Pagination from "@/components/common/Pagination";
import { useGetGamesQuery } from "@/features/games/gamesApi";
import { useListParams } from "@/hooks/useListParams";
import { errorMessage, fieldErrors } from "@/lib/api";
import { useAddClipMutation, useDeleteClipMutation, useGetClipsQuery } from "./studioApi";

const MAX_MB = 20;

// Game footage the agents cut their videos from
export default function ClipsTab() {
  const list = useListParams();
  const { data, isLoading, error, refetch } = useGetClipsQuery({ page: list.page });
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [remove, { isLoading: deleting }] = useDeleteClipMutation();

  if (error) {
    return (
      <EmptyState icon={Clapperboard} title="Couldn't load the clips" description={errorMessage(error)}>
        <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
      </EmptyState>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">Game footage for agent videos: trailers and gameplay from press kits, or your own recordings. Videos are cut from these with captions and an AI voice-over.</p>
        <Button className="sm:ml-auto" onClick={() => setAdding(true)}><Plus /> Add clip</Button>
      </div>
      {isLoading ? <Skeleton className="h-40" /> : !data?.items.length ? (
        <EmptyState icon={Clapperboard} title="No clips yet" description="Add footage for a game, then use Make video on a draft about that game." />
      ) : (
        <div className="space-y-2">
          {data.items.map((clip) => (
            <Card key={clip.id}>
              <CardContent className="flex items-center gap-3">
                <Clapperboard className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{clip.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {clip.game?.name}{clip.duration_seconds ? ` · ${clip.duration_seconds}s` : ""}{clip.source_note ? ` · ${clip.source_note}` : ""}
                  </p>
                </div>
                {clip.videos_made > 0 && <Badge variant="outline">{clip.videos_made} videos</Badge>}
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${clip.title}`} onClick={() => setRemoving(clip)}><Trash2 /></Button>
              </CardContent>
            </Card>
          ))}
          <Pagination page={list.page} totalPages={data.totalPages} total={data.total} onPageChange={list.setPage} />
        </div>
      )}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-lg">{adding && <ClipForm onDone={() => setAdding(false)} />}</DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.title}?`}
        description="Videos already made from it stay up."
        confirmLabel="Remove clip"
        destructive
        busy={deleting}
        onConfirm={async () => {
          try {
            await remove(removing.id).unwrap();
            toast.success("Clip removed");
            setRemoving(null);
          } catch (e) {
            toast.error(errorMessage(e));
          }
        }}
      />
    </>
  );
}

function ClipForm({ onDone }) {
  const { data: games } = useGetGamesQuery({ limit: 100 });
  const [values, setValues] = useState({ title: "", system_game_id: "", url: "", source_note: "", duration_seconds: "", file: null });
  const [fileError, setFileError] = useState(null);
  const [add, { isLoading, error }] = useAddClipMutation();
  const errors = fieldErrors(error);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e?.target ? e.target.value : e }));

  const pick = (file) => {
    setFileError(null);
    if (!file) return;
    if (file.type !== "video/mp4") return setFileError("Use an MP4 video.");
    if (file.size > MAX_MB * 1024 * 1024) return setFileError(`Uploads must be under ${MAX_MB} MB. Use a direct link for bigger files.`);
    setValues((v) => ({ ...v, file }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData();
    form.append("title", values.title.trim());
    form.append("system_game_id", values.system_game_id);
    if (values.file) form.append("file", values.file);
    else if (values.url.trim()) form.append("url", values.url.trim());
    if (values.source_note.trim()) form.append("source_note", values.source_note.trim());
    if (values.duration_seconds) form.append("duration_seconds", values.duration_seconds);
    try {
      await add(form).unwrap();
      toast.success("Clip added");
      onDone();
    } catch (e) {
      if (!Object.keys(fieldErrors(e)).length) toast.error(errorMessage(e));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add a clip</DialogTitle>
        <DialogDescription>Upload an MP4 (up to {MAX_MB} MB) or paste a direct link to a video file.</DialogDescription>
      </DialogHeader>
      <FormField label="Title" htmlFor="cl-title" error={errors.title} hint="Say what's in it: the agents pick clips by this.">
        <Input id="cl-title" maxLength={200} value={values.title} onChange={set("title")} placeholder="GTA 6 trailer 2: Vice City beach and car chase" required />
      </FormField>
      <FormField label="Game" error={errors.system_game_id}>
        <Select value={values.system_game_id} onValueChange={set("system_game_id")}>
          <SelectTrigger className="w-full" aria-label="Game"><SelectValue placeholder="Choose a game" /></SelectTrigger>
          <SelectContent>{(games?.items ?? []).map((game) => <SelectItem key={game.id} value={String(game.id)}>{game.name}</SelectItem>)}</SelectContent>
        </Select>
      </FormField>
      <FormField label="Video file" error={fileError ?? errors.file}>
        <Input type="file" accept="video/mp4" aria-label="Video file" onChange={(e) => pick(e.target.files?.[0])} />
      </FormField>
      {!values.file && (
        <FormField label="Or a direct link" htmlFor="cl-url" error={errors.url} hint="An https link straight to an .mp4 file.">
          <Input id="cl-url" type="url" value={values.url} onChange={set("url")} placeholder="https://…/trailer.mp4" />
        </FormField>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Where it's from" htmlFor="cl-note" error={errors.source_note}>
          <Input id="cl-note" maxLength={300} value={values.source_note} onChange={set("source_note")} placeholder="Rockstar press kit" />
        </FormField>
        <FormField label="Length in seconds" htmlFor="cl-len" error={errors.duration_seconds} hint="Helps the agents pick good cuts.">
          <Input id="cl-len" type="number" min={3} max={3600} value={values.duration_seconds} onChange={set("duration_seconds")} />
        </FormField>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading || !values.title || !values.system_game_id || (!values.file && !values.url)}>
          {isLoading && <Loader2 className="animate-spin" />} Add clip
        </Button>
      </DialogFooter>
    </form>
  );
}
