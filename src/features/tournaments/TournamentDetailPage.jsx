import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check, ExternalLink, Pencil, Play, Radio, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FormField from "@/components/common/FormField";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataTable from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import { useCan } from "@/features/auth/useCan";
import { errorMessage } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import Bracket from "./Bracket";
import TournamentFormDialog from "./TournamentFormDialog";
import {
  stageOf,
  useEliminateMutation,
  useGetTournamentBracketsQuery,
  useGetTournamentQuery,
  useGetTournamentTeamsQuery,
  useSetStreamMutation,
  useSetTeamStatusMutation,
  useStartTournamentMutation,
} from "./tournamentsApi";

export default function TournamentDetailPage() {
  const { tournamentId } = useParams();
  const { data: t, isLoading, error, refetch } = useGetTournamentQuery(tournamentId);
  const canEdit = useCan("edit_tournaments");
  const [editing, setEditing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [start, startState] = useStartTournamentMutation();
  const [streamOpen, setStreamOpen] = useState(false);

  if (error) {
    return (
      <EmptyState icon={Trophy} title={error.status === 404 ? "Tournament not found" : "Couldn't load this tournament"} description={error.status === 404 ? undefined : errorMessage(error)}>
        <Button asChild variant="outline" size="sm"><Link to="/tournaments">Back to tournaments</Link></Button>
        {error.status !== 404 && <Button size="sm" onClick={refetch}>Try again</Button>}
      </EmptyState>
    );
  }

  // Staff run Strix tournaments; player tournaments are run by their host
  const manageable = canEdit && t?.is_strix_tournament;
  const stage = t ? stageOf(t) : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/tournaments"><ArrowLeft /> Tournaments</Link>
      </Button>

      {isLoading ? <Skeleton className="h-40" /> : (
        <Card className="overflow-hidden py-0">
          <div className="flex flex-col sm:flex-row">
            {t.image && <img src={t.image} alt="" className="aspect-video w-full object-cover sm:w-72" />}
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
                {t.is_strix_tournament && <Badge>Strix</Badge>}
                <StatusBadge status={stage} tone={{ upcoming: "warn", live: "good", completed: "neutral" }[stage]} />
              </div>
              {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
              <p className="text-sm text-muted-foreground">
                {t.game?.name} · {t.bracket_type === "player_based" ? `${t.team_count} solo players` : `${t.team_count} teams of ${t.players_per_team_count}`} ·{" "}
                {t.strix_gold_entry_fee ? `${formatNumber(t.strix_gold_entry_fee)} gold entry` : "free entry"} · starts {formatDate(t.start_date)}
                {!t.is_strix_tournament && ` · hosted by ${t.user?.username ?? "a player"}`}
              </p>
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <Radio className="size-4 text-muted-foreground" />
                {t.stream_url
                  ? <a href={t.stream_url} target="_blank" rel="noreferrer" className="inline-flex max-w-md items-center gap-1 truncate text-primary hover:underline">{t.stream_url} <ExternalLink className="size-3 shrink-0" /></a>
                  : <span className="text-muted-foreground">No stream link</span>}
                {canEdit && <Button variant="ghost" size="sm" onClick={() => setStreamOpen(true)}>{t.stream_url ? "Change" : "Add"} stream link</Button>}
              </p>
              {manageable && stage !== "completed" && (
                <div className="flex flex-wrap gap-2">
                  {stage === "upcoming" && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil /> Edit</Button>}
                  {stage === "upcoming" && <Button size="sm" onClick={() => setStarting(true)}><Play /> Start tournament</Button>}
                </div>
              )}
              {!t.is_strix_tournament && <p className="text-xs text-muted-foreground">A player runs this tournament, so staff can view it but not change it.</p>}
            </CardContent>
          </div>
        </Card>
      )}

      {t && (stage === "upcoming" ? <Teams tournament={t} manageable={manageable} /> : <Brackets tournament={t} manageable={manageable && stage === "live"} />)}
      {t && stage !== "upcoming" && <Teams tournament={t} manageable={false} />}

      <TournamentFormDialog open={editing} onOpenChange={setEditing} tournament={t} />
      <Dialog open={streamOpen} onOpenChange={setStreamOpen}>
        <DialogContent className="sm:max-w-lg">{streamOpen && t && <StreamForm tournament={t} onDone={() => setStreamOpen(false)} />}</DialogContent>
      </Dialog>
      <ConfirmDialog
        open={starting}
        onOpenChange={setStarting}
        title="Start this tournament?"
        description="Approved entries are placed into the bracket and players are told it's live. Entries still waiting are refunded. This can't be undone."
        confirmLabel="Start tournament"
        busy={startState.isLoading}
        onConfirm={async () => {
          try {
            await start(t.id).unwrap();
            toast.success("Tournament started");
            setStarting(false);
          } catch {
            // toast from the store
          }
        }}
      />
    </div>
  );
}

function Teams({ tournament, manageable }) {
  const { data: teams = [], isLoading, isFetching, error, refetch } = useGetTournamentTeamsQuery(tournament.id);
  const [setStatus, { isLoading: saving }] = useSetTeamStatusMutation();
  const approved = teams.filter((team) => team.approval_status === "approved").length;

  const decide = async (team, status) => {
    try {
      await setStatus({ id: tournament.id, team: team.team_identifier, status }).unwrap();
      toast.success(status === "approved" ? `${team.team_name} is in` : `${team.team_name} was turned down`);
    } catch {
      // toast from the store
    }
  };

  const columns = [
    { key: "name", header: "Entry", cell: (team) => <span className="font-medium">{team.team_name}</span> },
    { key: "manager", header: "Signed up by", cell: (team) => team.user?.username ?? "—" },
    { key: "status", header: "Status", cell: (team) => <StatusBadge status={team.approval_status} /> },
    { key: "when", header: "Applied", cell: (team) => formatDate(team.created_at, true) },
    ...(manageable
      ? [{
          key: "actions",
          header: <span className="sr-only">Actions</span>,
          className: "text-right",
          cell: (team) => team.approval_status === "pending" && (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="outline" disabled={saving || approved >= tournament.team_count} onClick={() => decide(team, "approved")}><Check /> Approve</Button>
              <Button size="sm" variant="ghost" disabled={saving} onClick={() => decide(team, "rejected")}><X /> Turn down</Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Entries</CardTitle>
        <CardDescription>{approved} of {tournament.team_count} places filled.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} rows={teams} rowKey={(team) => team.team_identifier} isLoading={isLoading} isFetching={isFetching} error={error} onRetry={refetch} emptyTitle="No entries yet" />
      </CardContent>
    </Card>
  );
}

function Brackets({ tournament, manageable }) {
  const { data: brackets = [], isLoading, error, refetch } = useGetTournamentBracketsQuery(tournament.id);
  const [eliminate, { isLoading: saving }] = useEliminateMutation();
  const [pick, setPick] = useState(null); // { winner, loser }
  const name = (slot) => slot?.team?.[0]?.team_name ?? slot?.team_id;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bracket</CardTitle>
        <CardDescription>{manageable ? "Click the side that won a match to record the result." : "Results so far."}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-64" /> : error ? (
          <EmptyState icon={Trophy} title="Couldn't load the bracket" description={errorMessage(error)}>
            <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
          </EmptyState>
        ) : brackets.length === 0 ? (
          <p className="text-sm text-muted-foreground">The bracket appears once the tournament starts.</p>
        ) : (
          <Bracket teamCount={tournament.team_count} brackets={brackets} editable={manageable} onPickWinner={(winner, loser) => setPick({ winner, loser })} />
        )}
      </CardContent>
      <ConfirmDialog
        open={!!pick}
        onOpenChange={(open) => !open && setPick(null)}
        title={`${name(pick?.winner)} beat ${name(pick?.loser)}?`}
        description="The winner moves to the next round. A result can't be changed once it's recorded."
        confirmLabel="Record result"
        busy={saving}
        onConfirm={async () => {
          try {
            await eliminate({ id: tournament.id, positions: [pick.loser.position] }).unwrap();
            toast.success("Result recorded");
            setPick(null);
          } catch {
            // toast from the store
          }
        }}
      />
    </Card>
  );
}

// The stream link can change at any stage, e.g. after a stream restarts; staff can also remove a bad link
function StreamForm({ tournament, onDone }) {
  const [url, setUrl] = useState(tournament.stream_url ?? "");
  const [save, { isLoading, error }] = useSetStreamMutation();
  const problem = error ? errorMessage(error) : null;

  const submit = async (value) => {
    try {
      const result = await save({ id: tournament.id, stream_url: value }).unwrap();
      toast.success(result.message);
      onDone();
    } catch {
      // shown below
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Stream link</DialogTitle>
        <DialogDescription>Players watch it on the tournament screen. It can be changed at any time, even while the tournament is live.</DialogDescription>
      </DialogHeader>
      <FormField label="Link" htmlFor="s-url" error={problem} hint="YouTube, Twitch or Kick, or a direct .m3u8 / .mp4 link.">
        <Input id="s-url" type="url" maxLength={2048} placeholder="https://www.youtube.com/live/…" value={url} onChange={(e) => setUrl(e.target.value)} />
      </FormField>
      <DialogFooter className="gap-2">
        {tournament.stream_url && <Button variant="outline" disabled={isLoading} onClick={() => submit(null)}>Remove link</Button>}
        <Button disabled={isLoading || !url.trim()} onClick={() => submit(url.trim())}>Save</Button>
      </DialogFooter>
    </div>
  );
}
