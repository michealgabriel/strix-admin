import { useNavigate } from "react-router";
import { Megaphone, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "@/components/common/DataTable";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { useListParams } from "@/hooks/useListParams";
import { formatDate, formatNumber } from "@/lib/format";
import { useGetCampaignsQuery, useGetPushStatsQuery } from "./campaignsApi";

const STATUS_TONE = { draft: "neutral", scheduled: "warn", sending: "good", sent: "good", cancelled: "bad" };

export default function CampaignsPage() {
  const list = useListParams();
  const navigate = useNavigate();
  const tab = list.get("tab") || "campaigns";
  const { data, isLoading, isFetching, error, refetch } = useGetCampaignsQuery({ page: list.page }, { pollingInterval: 30_000 });

  const columns = [
    {
      key: "name",
      header: "Campaign",
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{c.name} {c.broadcast && <Badge variant="destructive" className="ml-1">Broadcast</Badge>}</p>
          <p className="truncate text-sm text-muted-foreground">{c.title}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} tone={STATUS_TONE[c.status]} /> },
    {
      key: "when",
      header: "Sends",
      cell: (c) => (c.local_send_at ? `${c.local_send_at} (player's time)` : c.send_at ? formatDate(c.send_at, true) : c.status === "draft" ? "When scheduled" : formatDate(c.started_at ?? c.updated_at, true)),
    },
    { key: "targeted", header: "Reached", className: "text-right tabular-nums", cell: (c) => formatNumber(c.stats?.sent ?? c.stats?.targeted) },
    { key: "opened", header: "Opened", className: "text-right tabular-nums", cell: (c) => formatNumber(c.stats?.opened) },
    { key: "rate", header: "Open rate", className: "text-right tabular-nums", cell: (c) => (c.stats?.open_rate != null ? `${c.stats.open_rate}%` : "—") },
  ];

  return (
    <>
      <PageHeader
        title="Push campaigns"
        description="News pushes written by the team, like “Season 2 is live 🔥”, to everyone or a chosen group."
        actions={<Button onClick={() => navigate("/campaigns/new")}><Plus /> New campaign</Button>}
      />
      <Tabs value={tab} onValueChange={(value) => list.set({ tab: value === "campaigns" ? "" : value })}>
        <TabsList className="mb-4">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="reminders">Automatic pushes</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns">
          <DataTable
            columns={columns}
            rows={data?.items}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            onRetry={refetch}
            onRowClick={(c) => navigate(`/campaigns/${c.id}`)}
            emptyTitle="No campaigns yet"
            emptyDescription="Write the first one to tell players what's new."
            pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
          />
        </TabsContent>
        <TabsContent value="reminders"><AutomaticStats /></TabsContent>
      </Tabs>
    </>
  );
}

const TYPE_LABELS = {
  daily_strix_ready: "Daily Strix ready",
  streak_at_risk: "Streak at risk",
  pass_rewards_waiting: "Pass rewards waiting",
  game_currency_expiring: "Game currency expiring",
  clip_vote_closing: "Clip voting closing",
  following_digest: "Following digest",
  win_back: "Win-back",
  campaign: "Campaigns",
};

function AutomaticStats() {
  const list = useListParams();
  const days = Number(list.get("days")) || 7;
  const { data, isLoading, isFetching, error, refetch } = useGetPushStatsQuery(days);

  const columns = [
    { key: "type", header: "Push", cell: (r) => <span className="font-medium">{TYPE_LABELS[r.type] ?? r.type.replaceAll("_", " ")}</span> },
    { key: "kind", header: "Kind", cell: (r) => (r.is_engagement ? <Badge variant="secondary">Reminder</Badge> : <span className="text-muted-foreground">Reply</span>) },
    { key: "sent", header: "Sent", className: "text-right tabular-nums", cell: (r) => formatNumber(r.sent) },
    { key: "players", header: "Players", className: "text-right tabular-nums", cell: (r) => formatNumber(r.players) },
    { key: "opened", header: "Opened", className: "text-right tabular-nums", cell: (r) => formatNumber(r.opened) },
    { key: "rate", header: "Open rate", className: "text-right tabular-nums", cell: (r) => `${r.open_rate}%` },
  ];

  return (
    <div className="space-y-4">
      <Card className="py-0">
        <CardHeader className="pt-5"><CardTitle className="flex items-center gap-2 text-base"><Megaphone className="size-4" /> Every push in the last {days} days</CardTitle></CardHeader>
        <CardContent className="pb-5 text-sm text-muted-foreground">
          {data ? `${formatNumber(data.totals.sent)} sent, ${formatNumber(data.totals.opened)} opened (${data.totals.open_rate}%). Reminders are capped at 2 a day per player and skip quiet hours.` : " "}
        </CardContent>
      </Card>
      <DataTable
        columns={columns}
        rows={data?.data}
        rowKey={(r) => r.type}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        emptyTitle="No pushes sent in this period"
        toolbar={
          <div className="flex gap-1">
            {[7, 30, 90].map((d) => <Button key={d} size="sm" variant={days === d ? "secondary" : "ghost"} onClick={() => list.set({ days: d === 7 ? "" : d, tab: "reminders" })}>{d} days</Button>)}
          </div>
        }
      />
    </div>
  );
}
