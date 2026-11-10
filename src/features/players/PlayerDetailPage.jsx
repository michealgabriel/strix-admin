import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Coins, Flame, Gamepad2, Sparkles, Star, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import PlayerAvatar from "@/components/common/PlayerAvatar";
import StatCard from "@/components/common/StatCard";
import { errorMessage } from "@/lib/api";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetPlayerQuery, useGetPlayerReliabilityQuery, useGetPlayerWalletQuery } from "./playersApi";

export default function PlayerDetailPage() {
  const { playerId } = useParams();
  const { data, isLoading, error, refetch } = useGetPlayerQuery(playerId);

  if (error) {
    return (
      <EmptyState icon={UserRound} title={error.status === 404 ? "Player not found" : "Couldn't load this player"} description={error.status === 404 ? undefined : errorMessage(error)}>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/players">Back to players</Link>
          </Button>
          {error.status !== 404 && (
            <Button size="sm" onClick={refetch}>
              Try again
            </Button>
          )}
        </div>
      </EmptyState>
    );
  }

  const player = data?.player;
  const details = data?.admin_details;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/players">
          <ArrowLeft /> Players
        </Link>
      </Button>

      {isLoading ? (
        <Skeleton className="h-28" />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <PlayerAvatar player={player} className="size-16 text-xl" />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
              {player.username}
              {player.pass_type === "vippass" && <Badge>VIP</Badge>}
              {player.account_deleted_at && <Badge variant="destructive">Deleted {formatDate(player.account_deleted_at)}</Badge>}
              {!player.account_verified && <Badge variant="secondary">Email not verified</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground">
              {player.title ? `${player.title} · ` : ""}
              {player.email} · Strix ID {player.strix_id}
            </p>
            <p className="text-sm text-muted-foreground">
              Joined {formatDate(player.created_at)} · last seen{" "}
              {details?.last_active_at ? formatRelative(details.last_active_at) : "never"}
              {details?.country ? ` · ${details.country.name}` : ""}
              {details?.timezone ? ` · ${details.timezone}` : ""}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Strix Gold" icon={Coins} loading={isLoading} value={formatNumber(player?.strix_gold)} />
        <StatCard label="XP" icon={Star} loading={isLoading} value={formatNumber(player?.player_xp)} hint={player && `${formatNumber(player.lifetime_xp)} earned in total`} />
        <StatCard
          label="Daily Strix streak"
          icon={Flame}
          loading={isLoading}
          value={details ? `${details.streak.count} days` : "—"}
          hint={details && `Best ${details.streak.best} · ${details.streak.freezes} freezes`}
        />
        <StatCard
          label="Team-up reliability"
          icon={Sparkles}
          loading={isLoading}
          value={player?.reliability_score != null ? `${player.reliability_score}%` : "—"}
          hint={player && `${player.reliability_sessions} sessions rated`}
        />
      </div>

      {!isLoading && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wallet">Wallet history</TabsTrigger>
            <TabsTrigger value="teamups">Team-up attendance</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-2">
            <Overview player={player} details={details} />
          </TabsContent>
          <TabsContent value="wallet" className="pt-2">
            <Wallet playerId={playerId} />
          </TabsContent>
          <TabsContent value="teamups" className="pt-2">
            <Reliability playerId={playerId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function Overview({ player, details }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <Fact label="Signs in with">{player.has_password ? "Email and password" : "Google"}</Fact>
            <Fact label="Language">{player.locale?.toUpperCase() ?? "—"}</Fact>
            <Fact label="Invited by">
              {details.referrer ? <Link className="text-primary hover:underline" to={`/players/${details.referrer.id}`}>{details.referrer.username}</Link> : "Nobody"}
            </Fact>
            <Fact label="Players invited">{formatNumber(details.referrals_count)}</Fact>
            <Fact label="Devices for push">{formatNumber(details.devices_count)}</Fact>
            <Fact label="Username changed">{player.username_changed_at ? formatDate(player.username_changed_at) : "Never"}</Fact>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <Fact label="Followers · following">
              {formatNumber(player.followers_count)} · {formatNumber(player.followings_count)}
            </Fact>
            <Fact label="Posts · likes received">
              {formatNumber(details.counts.posts)} · {formatNumber(player.post_likes_count)}
            </Fact>
            <Fact label="Epic Clips">{formatNumber(details.counts.epic_clips)}</Fact>
            <Fact label="Channels owned · joined">
              {formatNumber(player.channels_count)} · {formatNumber(player.joined_channels_count)}
            </Fact>
            <Fact label="Orders · top-ups">
              {formatNumber(details.counts.orders)} · {formatNumber(details.counts.topups)}
            </Fact>
            <Fact label="Support chats">{formatNumber(details.counts.support_sessions)}</Fact>
          </dl>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gamepad2 className="size-4" /> Games
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {player.added_games?.length ? (
            player.added_games.map((game) => (
              <Badge key={game.id} variant="secondary">
                {game.name}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No games added.</p>
          )}
          {player.badges?.length > 0 && (
            <div className="w-full pt-3">
              <p className="mb-2 text-sm font-medium">Badges</p>
              <div className="flex flex-wrap gap-2">
                {player.badges.map((badge) => (
                  <Badge key={badge.id} variant="outline">
                    {badge.name ?? badge.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const REASONS = {
  ad_reward: "Watched an ad",
  chest_purchase: "Chest bought",
  gold_purchase: "Gold pack bought",
  gold_purchase_refund: "Gold pack refunded",
  mission_reward_unclaimed: "Mission reward (auto-claimed)",
  pass_level_purchase: "Pass level bought",
  streak_freeze: "Streak freeze bought",
  streak_milestone: "Streak milestone",
  tournament_commission: "Tournament host commission",
  tournament_commission_clawback: "Tournament commission returned",
  tournament_creation_fee: "Tournament created",
  tournament_entry_fee: "Tournament entry",
  tournament_entry_refund: "Tournament entry refunded",
  welcome_back: "Welcome-back gift",
};
const reasonLabel = (reason) => REASONS[reason] ?? reason.replaceAll("_", " ");

function Wallet({ playerId }) {
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState("");
  const { data, isLoading, isFetching, error, refetch } = useGetPlayerWalletQuery({ id: playerId, page, currency });

  const columns = [
    { key: "when", header: "When", cell: (t) => formatDate(t.created_at, true) },
    { key: "reason", header: "What", cell: (t) => <span className="capitalize">{reasonLabel(t.reason)}</span> },
    {
      key: "amount",
      header: "Change",
      className: "text-right tabular-nums",
      cell: (t) => (
        <span className={cn("font-medium", t.amount > 0 ? "text-primary" : "text-destructive")}>
          {t.amount > 0 ? "+" : ""}
          {formatNumber(t.amount)} {t.currency === "strix_gold" ? "gold" : "XP"}
        </span>
      ),
    },
    { key: "balance", header: "Balance after", className: "text-right tabular-nums", cell: (t) => formatNumber(t.balance_after) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={data?.items}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={refetch}
      emptyTitle="No wallet changes yet"
      pagination={{ page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: setPage }}
      toolbar={
        <div className="flex gap-1">
          {[
            ["", "All"],
            ["strix_gold", "Gold"],
            ["player_xp", "XP"],
          ].map(([value, label]) => (
            <Button
              key={label}
              size="sm"
              variant={currency === value ? "secondary" : "ghost"}
              onClick={() => {
                setCurrency(value);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      }
    />
  );
}

function Reliability({ playerId }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetPlayerReliabilityQuery({ id: playerId, page });
  const columns = [
    { key: "joined", header: "Joined", cell: (a) => formatDate(a.joined_at, true) },
    { key: "game", header: "Game", cell: (a) => a.game_name ?? "—" },
    {
      key: "time",
      header: "In game",
      className: "text-right tabular-nums",
      cell: (a) => (a.in_game_seconds != null ? `${Math.round(a.in_game_seconds / 60)} min` : "—"),
    },
    { key: "left", header: "Left early", cell: (a) => (a.left_early == null ? "—" : a.left_early ? "Yes" : "No") },
    {
      key: "score",
      header: "Score",
      className: "text-right tabular-nums",
      cell: (a) => (a.session_score != null ? `${a.session_score}${a.counted ? "" : " (not counted)"}` : "—"),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={data?.items}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={refetch}
      emptyTitle="No team-ups yet"
      emptyDescription="Reliability is worked out from the team-ups a player joins and how long they stay in the game."
      pagination={{ page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: setPage }}
    />
  );
}
