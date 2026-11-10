import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "@/components/common/DataTable";
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import StatusBadge from "@/components/common/StatusBadge";
import { Can } from "@/features/auth/permissions";
import { useListParams } from "@/hooks/useListParams";
import { formatDate, formatNumber } from "@/lib/format";
import TournamentFormDialog from "./TournamentFormDialog";
import { stageOf, useGetTournamentsQuery } from "./tournamentsApi";

const STAGE_TONE = { upcoming: "warn", live: "good", completed: "neutral" };

export default function TournamentsPage() {
  const list = useListParams();
  const navigate = useNavigate();
  const type = list.get("type") || "all";
  const search = list.get("q");
  const { data, isLoading, isFetching, error, refetch } = useGetTournamentsQuery({ page: list.page, type, search });
  const [creating, setCreating] = useState(false);

  const columns = [
    {
      key: "title",
      header: "Tournament",
      cell: (t) => (
        <div className="flex min-w-0 items-center gap-3">
          {t.image ? <img src={t.image} alt="" className="size-10 rounded-md object-cover" /> : <div className="size-10 rounded-md bg-muted" />}
          <div className="min-w-0">
            <p className="truncate font-medium">
              {t.title} {t.is_strix_tournament && <Badge className="ml-1">Strix</Badge>}
            </p>
            <p className="truncate text-sm text-muted-foreground">{t.game?.name} · by {t.is_strix_tournament ? "Strix" : (t.user?.username ?? "a player")}</p>
          </div>
        </div>
      ),
    },
    { key: "stage", header: "Stage", cell: (t) => <StatusBadge status={stageOf(t)} tone={STAGE_TONE[stageOf(t)]} /> },
    {
      key: "teams",
      header: "Entries",
      className: "tabular-nums",
      cell: (t) => (t.teams_count != null ? `${t.teams_count} / ${t.team_count}` : t.team_count),
    },
    { key: "fee", header: "Entry fee", className: "tabular-nums", cell: (t) => (t.strix_gold_entry_fee ? `${formatNumber(t.strix_gold_entry_fee)} gold` : "Free") },
    { key: "start", header: "Starts", cell: (t) => formatDate(t.start_date) },
  ];

  return (
    <>
      <PageHeader title="Tournaments" description="Player and Strix tournaments: approve entries, start brackets and record results." />
      <Tabs value={type} onValueChange={(value) => list.set({ type: value === "all" ? "" : value })} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="completed">Finished</TabsTrigger>
        </TabsList>
      </Tabs>
      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        onRowClick={(t) => navigate(`/tournaments/${t.id}`)}
        emptyTitle={search ? "No tournaments match your search" : "No tournaments here"}
        pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
        toolbar={
          <>
            <SearchInput value={search} onChange={(q) => list.set({ q })} placeholder="Search tournaments" />
            <Can permission="create_tournaments">
              <Button className="sm:ml-auto" onClick={() => setCreating(true)}><Plus /> Create tournament</Button>
            </Can>
          </>
        }
      />
      <TournamentFormDialog open={creating} onOpenChange={setCreating} onSaved={(t) => t?.id && navigate(`/tournaments/${t.id}`)} />
    </>
  );
}
