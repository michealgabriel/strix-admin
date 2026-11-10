import { useSelector } from "react-redux";
import {
  Activity,
  BellRing,
  Coins,
  Flag,
  Flame,
  Gift,
  Headset,
  RefreshCw,
  RotateCcw,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import { selectAdmin } from "@/features/auth/authSlice";
import { useCan } from "@/features/auth/useCan";
import { errorMessage } from "@/lib/api";
import { formatMoney, formatNumber, formatRelative } from "@/lib/format";
import { useGetDashboardQuery, useGetNewestPlayersQuery } from "./dashboardApi";

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const admin = useSelector(selectAdmin);
  const canSeeStats = useCan("view_users");
  const firstName = admin?.name?.split(" ")[0];

  return (
    <>
      <PageHeader title={`${greeting()}${firstName ? `, ${firstName}` : ""}`} description="How Strix is doing, and what needs you." />
      {canSeeStats ? <Overview /> : <p className="text-sm text-muted-foreground">Use the menu to open the parts of Strix you manage.</p>}
    </>
  );
}

function Overview() {
  const { data, isLoading, isFetching, error, refetch } = useGetDashboardQuery(undefined, { pollingInterval: 120_000 });
  const canTopups = useCan("view_topup_purchases");
  const canSupport = useCan("manage_customer_supports");
  const canReports = useCan(["moderate_posts", "view_epic_clips"]);
  const canOrders = useCan("view_orders");

  if (error) {
    return (
      <EmptyState icon={Activity} title="Couldn't load the numbers" description={errorMessage(error)}>
        <Button variant="outline" size="sm" onClick={refetch}>
          Try again
        </Button>
      </EmptyState>
    );
  }

  const p = data?.players;
  const queues = data?.queues ?? {};
  // Revenue shows the busiest currency first
  const revenue = [...(data?.revenue ?? [])].sort((a, b) => b.orders - a.orders);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Players</h2>
          <Button variant="ghost" size="sm" onClick={refetch} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : undefined} />
            {data?.generated_at ? `Updated ${formatRelative(data.generated_at)}` : "Refresh"}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total players" icon={Users} loading={isLoading} value={formatNumber(p?.total)} hint={p && `+${formatNumber(p.new_30d)} in the last 30 days`} to="/players" />
          <StatCard label="New this week" icon={UserPlus} loading={isLoading} value={formatNumber(p?.new_7d)} hint={p && `${formatNumber(p.new_today)} today`} />
          <StatCard label="Active this week" icon={Activity} loading={isLoading} value={formatNumber(p?.active_7d)} hint={p && `${formatNumber(p.active_today)} today`} />
          <StatCard
            label="Daily Strix claim rate"
            icon={Gift}
            loading={isLoading}
            value={data ? `${data.daily_strix.claim_rate_7d}%` : "—"}
            hint={p && `${formatNumber(p.on_streak)} players on a streak`}
            to="/daily-rewards"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Money and messages</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            <StatCard label="Revenue, last 30 days" icon={Coins} loading />
          ) : revenue.length === 0 ? (
            <StatCard label="Revenue, last 30 days" icon={Coins} value="—" hint="No paid orders yet" />
          ) : (
            revenue.slice(0, 2).map((row) => (
              <StatCard
                key={row.currency}
                label={`Revenue in ${row.currency}, last 30 days`}
                icon={Coins}
                value={formatMoney(row.last_30d, row.currency)}
                hint={`${formatMoney(row.all_time, row.currency)} all time · ${formatNumber(row.orders)} orders`}
              />
            ))
          )}
          <StatCard
            label="Push open rate, 7 days"
            icon={BellRing}
            loading={isLoading}
            value={data ? `${data.push_7d.open_rate}%` : "—"}
            hint={data && `${formatNumber(data.push_7d.opened)} of ${formatNumber(data.push_7d.sent)} opened`}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Waiting for the team</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <QueueCard label="Top-ups to deliver" icon={Wallet} count={queues.pending_topups} loading={isLoading} to={canTopups ? "/game-topup?tab=purchases" : undefined} />
          <QueueCard label="Game currency claims" icon={Gift} count={queues.game_currency_claims} loading={isLoading} to={canTopups ? "/game-topup?tab=claims" : undefined} />
          <QueueCard label="Open support chats" icon={Headset} count={queues.open_support} loading={isLoading} to={canSupport ? "/support" : undefined} />
          <QueueCard label="Reported content" icon={Flag} count={queues.reported_content} loading={isLoading} to={canReports ? "/reports" : undefined} />
          <QueueCard label="Refunds pending" icon={RotateCcw} count={queues.refunds_pending} loading={isLoading} to={canOrders ? "/orders?status=refund_pending" : undefined} />
        </div>
      </section>

      <NewestPlayers />
    </div>
  );
}

function QueueCard({ count, ...props }) {
  return (
    <StatCard
      {...props}
      value={formatNumber(count ?? 0)}
      tone={count > 0 ? "warning" : undefined}
      hint={count > 0 ? undefined : "All clear"}
    />
  );
}

function NewestPlayers() {
  const { data: players = [], isLoading } = useGetNewestPlayersQuery();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="size-4 text-primary" /> Newest players
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <p className="text-sm text-muted-foreground">No players yet.</p>
        ) : (
          <ul className="divide-y">
            {players.map((player) => (
              <li key={player.id} className="flex items-center gap-3 py-2.5">
                <Avatar className="size-9">
                  {player.profile_image && <AvatarImage src={player.profile_image} alt="" />}
                  <AvatarFallback>{(player.username ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{player.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{player.title ?? player.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">joined {formatRelative(player.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
