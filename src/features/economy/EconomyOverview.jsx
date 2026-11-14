import { useState } from "react";
import { Link } from "react-router";
import { Activity, ArrowDownRight, ArrowUpRight, Coins, Gift, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/common/EmptyState";
import StatCard from "@/components/common/StatCard";
import { errorMessage } from "@/lib/api";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetEconomyQuery } from "./economyApi";
import { reasonLabel } from "./reasonLabels";

const RANGES = [7, 30, 90];

export default function EconomyOverview() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isFetching, error, refetch } = useGetEconomyQuery(days);

  if (error) {
    return (
      <EmptyState icon={Activity} title="Couldn't load the economy" description={errorMessage(error)}>
        <Button variant="outline" size="sm" onClick={refetch}>
          Try again
        </Button>
      </EmptyState>
    );
  }

  const totals = data?.totals ?? {};
  const gc = data?.game_currency;
  const circulation = data?.circulation;

  return (
    <div className={cn("space-y-8", isFetching && !isLoading && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          From the Gold ledger{data?.generated_at ? `, ${formatRelative(data.generated_at)}` : ""}.
        </p>
        <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
          <SelectTrigger className="w-40" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((range) => (
              <SelectItem key={range} value={String(range)}>
                Last {range} days
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gold given free" icon={Gift} loading={isLoading} value={formatNumber(totals.earned)} hint="Rewards, missions, chests, ads, invites" />
        <StatCard label="Gold bought" icon={ShoppingCart} loading={isLoading} value={formatNumber(totals.bought)} hint="Gold packs paid for with money" />
        <StatCard label="Gold spent" icon={ArrowDownRight} loading={isLoading} value={formatNumber(totals.spent)} hint="Chests, freezes, tournaments, pass levels" />
        <StatCard
          label="Gold players hold"
          icon={Coins}
          loading={isLoading}
          value={formatNumber(circulation?.gold)}
          hint={circulation && `${formatNumber(circulation.average)} per player on average`}
        />
      </div>

      {gc && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Game currency rewards this month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Meter value={gc.won_this_month} max={gc.monthly_limit} />
            <p className="text-sm text-muted-foreground">
              {gc.monthly_limit > 0
                ? `${formatNumber(gc.won_this_month)} of ${formatNumber(gc.monthly_limit)} won. `
                : "Paused: the monthly limit is 0. "}
              {formatNumber(gc.waiting_for_delivery)} waiting for delivery, {formatNumber(gc.delivered_this_month)} delivered this month.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gold in and out each day</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyChart days={data?.by_day ?? []} loading={isLoading} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where Gold came from and went</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Source</TableHead>
                  <TableHead className="text-right">Added</TableHead>
                  <TableHead className="text-right">Removed</TableHead>
                  <TableHead className="pr-6 text-right">Players</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.by_reason ?? []).map((row) => (
                  <TableRow key={row.reason}>
                    <TableCell className="pl-6">{reasonLabel(row.reason)}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.added ? formatNumber(row.added) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.removed ? formatNumber(row.removed) : "—"}</TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">{formatNumber(row.players)}</TableCell>
                  </TableRow>
                ))}
                {!isLoading && !data?.by_reason?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No Gold moved in this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most free Gold this week</CardTitle>
            <p className="text-sm text-muted-foreground">A farm or a bug shows up here first. Bought Gold isn't counted.</p>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Player</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="pr-6 text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.top_earners ?? []).map((row) => (
                  <TableRow key={row.user_id}>
                    <TableCell className="pl-6">
                      <Link to={`/players/${row.user_id}`} className="font-medium hover:underline">
                        {row.username ?? `Player #${row.user_id}`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.earned_7d)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.balance)}</TableCell>
                    <TableCell className="pr-6 text-right text-muted-foreground">{row.joined_at ? formatDate(row.joined_at) : "—"}</TableCell>
                  </TableRow>
                ))}
                {!isLoading && !data?.top_earners?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No free Gold this week.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Meter({ value, max }) {
  const share = max > 0 ? Math.min(1, value / max) : 1;
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-muted"
      role="meter"
      aria-label="Game currency rewards used this month"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={cn("h-full rounded-full", share >= 0.9 ? "bg-destructive" : "bg-primary")} style={{ width: `${share * 100}%` }} />
    </div>
  );
}

// Two bars a day: Gold added (free and bought) and Gold spent, on one scale
function DailyChart({ days, loading }) {
  if (loading) return <div className="h-40 animate-pulse rounded-md bg-muted" />;
  const max = Math.max(1, ...days.map((d) => Math.max(d.earned + d.bought, d.spent)));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary" /> Added <ArrowUpRight className="size-3" />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-muted-foreground/50" /> Spent <ArrowDownRight className="size-3" />
        </span>
        <span className="ml-auto tabular-nums">Top of chart: {formatNumber(max)} Gold</span>
      </div>
      <div className="flex h-40 items-end gap-px border-b" role="img" aria-label="Gold added and spent each day">
        {days.map((d) => (
          <div
            key={d.date}
            className="group flex h-full min-w-0 flex-1 items-end gap-px rounded-sm hover:bg-muted/60"
            title={`${formatDate(d.date)}: +${formatNumber(d.earned)} free, +${formatNumber(d.bought)} bought, −${formatNumber(d.spent)} spent`}
          >
            <div className="w-1/2 rounded-t-[3px] bg-primary" style={{ height: `${((d.earned + d.bought) / max) * 100}%` }} />
            <div className="w-1/2 rounded-t-[3px] bg-muted-foreground/50" style={{ height: `${(d.spent / max) * 100}%` }} />
          </div>
        ))}
      </div>
      {days.length > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{formatDate(days[0].date)}</span>
          <span>{formatDate(days.at(-1).date)}</span>
        </div>
      )}
    </div>
  );
}
