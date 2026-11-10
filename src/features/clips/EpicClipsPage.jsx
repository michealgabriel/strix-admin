import { useState } from "react";
import { Clapperboard, Crown, Flag, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { useCan } from "@/features/auth/useCan";
import { useGetGamesQuery } from "@/features/games/gamesApi";
import { useListParams } from "@/hooks/useListParams";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import ClipCard from "./ClipCard";
import { REASON_LABELS } from "./reasons";
import {
  useCrownClipMutation,
  useGetClipReportsQuery,
  useGetClipsQuery,
  useGetLeaderClipQuery,
  useResolveClipReportsMutation,
} from "./clipsApi";

export default function EpicClipsPage() {
  const list = useListParams();
  const tab = list.get("tab") || "clips";
  const { data: reports } = useGetClipReportsQuery({ status: "open" });

  return (
    <>
      <PageHeader
        title="Epic Clips"
        description="Players submit clips and vote all week. Crown the week's winner, and review clips players have reported."
      />
      <Tabs value={tab} onValueChange={(value) => list.set({ tab: value === "clips" ? "" : value, sort: "", status: "", game: "" })}>
        <TabsList className="mb-4">
          <TabsTrigger value="clips">Clips</TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {reports?.total > 0 && <Badge className="ml-1 h-5 px-1.5">{reports.total}</Badge>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="clips" className="space-y-6">
          <Leader />
          <Clips list={list} />
        </TabsContent>
        <TabsContent value="reports">
          <ClipReports list={list} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Leader() {
  const { data: leader, isLoading } = useGetLeaderClipQuery();
  const canCrown = useCan("disable_epic_clips");
  const [crown, { isLoading: crowning }] = useCrownClipMutation();
  const [confirming, setConfirming] = useState(false);

  if (isLoading) return <Skeleton className="h-40" />;
  if (!leader) return null;

  return (
    <Card className="border-amber-300/60 bg-amber-50/50 py-0 dark:border-amber-500/30 dark:bg-amber-500/5">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <video src={leader.clip} preload="none" controls className="aspect-video w-full rounded-md bg-black sm:w-64" />
        <div className="flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">Leading this week</p>
          <p className="text-lg font-semibold">{leader.user?.username ?? "Deleted player"}</p>
          <p className="text-sm text-muted-foreground">
            {leader.system_game?.name} · {leader.votes_count ?? 0} {leader.votes_count === 1 ? "vote" : "votes"} · posted {formatDate(leader.created_at)}
          </p>
        </div>
        {canCrown && !leader.is_winner && (
          <Button onClick={() => setConfirming(true)} className="bg-amber-500 text-amber-950 hover:bg-amber-400">
            <Crown /> Crown winner
          </Button>
        )}
        {!!leader.is_winner && <Badge className="bg-amber-400 text-amber-950">Crowned</Badge>}
      </CardContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Crown ${leader.user?.username ?? "this clip"} as Epic Clip of the week?`}
        description="The player is told they won. A clip can only be crowned once."
        confirmLabel="Crown winner"
        busy={crowning}
        onConfirm={async () => {
          try {
            await crown(leader.id).unwrap();
            toast.success("Winner crowned");
            setConfirming(false);
          } catch {
            // toast from the store
          }
        }}
      />
    </Card>
  );
}

function Clips({ list }) {
  const sort = list.get("sort") || "latest";
  const game = list.get("game");
  const { data, isLoading, isFetching, error, refetch } = useGetClipsQuery({ page: list.page, sort, gameId: game });
  const { data: games } = useGetGamesQuery({ limit: 100 });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={sort} onValueChange={(value) => list.set({ sort: value === "latest" ? "" : value })}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Newest first</SelectItem>
            <SelectItem value="top">Most votes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={game || "all"} onValueChange={(value) => list.set({ game: value === "all" ? "" : value })}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Game">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All games</SelectItem>
            {(games?.items ?? []).map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <EmptyState icon={Clapperboard} title="Couldn't load clips" description={errorMessage(error)}>
          <Button variant="outline" size="sm" onClick={refetch}>
            Try again
          </Button>
        </EmptyState>
      ) : !isLoading && data?.items.length === 0 ? (
        <EmptyState icon={Clapperboard} title="No clips yet" />
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${isFetching && !isLoading ? "opacity-70" : ""}`}>
          {isLoading
            ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)
            : data.items.map((clip) => <ClipCard key={clip.id} clip={clip} />)}
        </div>
      )}
      {!error && <Pagination page={list.page} totalPages={data?.totalPages ?? 1} total={data?.total} onPageChange={list.setPage} />}
    </div>
  );
}


export function ClipReports({ list }) {
  const status = list.get("status") || "open";
  const { data, isLoading, isFetching, error, refetch } = useGetClipReportsQuery({ page: list.page, status });
  const canModerate = useCan("disable_epic_clips");
  const [resolve, { isLoading: resolving }] = useResolveClipReportsMutation();
  const [pending, setPending] = useState(null); // { clip, action }

  return (
    <div className="space-y-4">
      <Select value={status} onValueChange={(value) => list.set({ status: value === "open" ? "" : value })}>
        <SelectTrigger className="w-full sm:w-52" aria-label="Status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Waiting for review</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
        </SelectContent>
      </Select>

      {error ? (
        <EmptyState icon={Flag} title="Couldn't load reports" description={errorMessage(error)}>
          <Button variant="outline" size="sm" onClick={refetch}>
            Try again
          </Button>
        </EmptyState>
      ) : !isLoading && data?.items.length === 0 ? (
        <EmptyState icon={Flag} title={status === "open" ? "No clips to review" : "No dismissed reports"} description={status === "open" ? "Clips players report show up here. Three reports hide a clip until you review it." : undefined} />
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${isFetching && !isLoading ? "opacity-70" : ""}`}>
          {isLoading
            ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)
            : data.items.map((clip) => (
                <ClipCard key={clip.id} clip={clip}>
                  <div className="space-y-2 rounded-md bg-muted/60 p-3">
                    <p className="text-sm font-medium">
                      {clip.reports_count} {clip.reports_count === 1 ? "report" : "reports"}
                    </p>
                    <ul className="space-y-1 text-sm">
                      {(clip.reports ?? []).slice(0, 4).map((report) => (
                        <li key={report.id} className="text-muted-foreground">
                          <span className="font-medium text-foreground">{REASON_LABELS[report.reason] ?? report.reason}</span>
                          {report.details ? `: ${report.details}` : ""}
                          <span className="text-xs"> · {report.user?.username ?? "player"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {canModerate && status === "open" && (
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={() => setPending({ clip, action: "remove" })}>
                        <Trash2 /> Remove clip
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPending({ clip, action: "dismiss" })}>
                        <Undo2 /> Keep it
                      </Button>
                    </div>
                  )}
                </ClipCard>
              ))}
        </div>
      )}
      {!error && <Pagination page={list.page} totalPages={data?.totalPages ?? 1} total={data?.total} onPageChange={list.setPage} />}

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.action === "remove" ? "Remove this clip?" : "Keep this clip?"}
        description={
          pending?.action === "remove"
            ? "The clip is deleted, its reports are closed and the player is told why. This can't be undone."
            : "The reports are dismissed and the clip shows again if it was hidden."
        }
        confirmLabel={pending?.action === "remove" ? "Remove clip" : "Keep clip"}
        destructive={pending?.action === "remove"}
        busy={resolving}
        onConfirm={async () => {
          try {
            const result = await resolve({ id: pending.clip.id, action: pending.action }).unwrap();
            toast.success(result.message ?? "Done");
            setPending(null);
          } catch {
            // toast from the store
          }
        }}
      />
    </div>
  );
}
