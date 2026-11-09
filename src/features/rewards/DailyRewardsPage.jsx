import { useState } from "react";
import { CalendarClock, Loader2, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { useCan } from "@/features/auth/useCan";
import { errorMessage } from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/format";
import { RewardRowEditor, RewardRowView } from "./RewardRow";
import { itemSlug } from "./rewardItems";
import { useGetClaimableItemsQuery, useGetDailyRewardsQuery, useSaveDailyRewardsMutation } from "./rewardsApi";

const DAYS = 7;
const MANIFEST_NAME = "Week Daily Rewards Manifest";

const blankWeek = () =>
  Array.from({ length: DAYS }, (_, i) => ({ day: String(i + 1), item_name: "strixgold", item_quantity: "50" }));

export default function DailyRewardsPage() {
  const { data, isLoading, error, refetch } = useGetDailyRewardsQuery();
  const { data: items = [] } = useGetClaimableItemsQuery();

  return (
    <>
      <PageHeader
        title="Daily Rewards"
        description="Daily Strix: one reward a day, claimed in the app. A week runs for 7 days, then the next one starts on its own."
      />
      {error ? (
        <EmptyState icon={CalendarClock} title="Couldn't load the reward weeks" description={errorMessage(error)}>
          <Button variant="outline" size="sm" onClick={refetch}>
            Try again
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <CurrentWeek week={data?.active} items={items} isLoading={isLoading} />
          <NextWeek week={data?.next} hasActive={!!data?.active} items={items} isLoading={isLoading} />
        </div>
      )}
    </>
  );
}

function CurrentWeek({ week, items, isLoading }) {
  const today = week?.current_day_reward_index;
  return (
    <Card>
      <CardHeader>
        <CardTitle>This week</CardTitle>
        <CardDescription>
          {week ? `Ends ${formatDate(week.expiration_date, true)} (${formatRelative(week.expiration_date)})` : " "}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && Array.from({ length: DAYS }, (_, i) => <Skeleton key={i} className="h-14" />)}
        {!isLoading && !week && (
          <p className="text-sm text-muted-foreground">
            No week is running. Players see no Daily Strix until one is queued.
          </p>
        )}
        {week?.manifest?.data?.map((row, index) => (
          <RewardRowView
            key={index}
            label={`Day ${row.day}`}
            row={row}
            items={items}
            highlight={index === today}
            done={today != null && index < today}
          />
        ))}
        {week && <p className="pt-2 text-xs text-muted-foreground">The highlighted day is today's reward.</p>}
      </CardContent>
    </Card>
  );
}

function NextWeek({ week, hasActive, items, isLoading }) {
  const canEdit = useCan("create_daily_rewards");
  const [draft, setDraft] = useState(null);
  const [save, { isLoading: saving }] = useSaveDailyRewardsMutation();
  const rows = draft ?? week?.manifest?.data ?? null;

  const submit = async (event) => {
    event.preventDefault();
    const manifest = {
      name: MANIFEST_NAME,
      data: rows.map((row, i) => ({
        day: String(i + 1),
        item_name: itemSlug(row.item_name),
        item_quantity: String(row.item_quantity),
      })),
    };
    try {
      await save({ manifest, replaceNext: !!week }).unwrap();
      toast.success(week ? "Next week updated" : hasActive ? "Next week queued" : "Week started");
      setDraft(null);
    } catch {
      // toast from the store
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next week</CardTitle>
        <CardDescription>
          {week
            ? `Starts when this week ends and runs until ${formatDate(week.expiration_date, true)}.`
            : hasActive
              ? "Nothing is queued yet. Without a next week, Daily Strix stops when this week ends."
              : "Set up a week to start Daily Strix now."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : !rows ? (
          canEdit ? (
            <Button onClick={() => setDraft(blankWeek())}>
              <Plus /> {hasActive ? "Queue next week" : "Start a week"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing queued.</p>
          )
        ) : canEdit ? (
          <form onSubmit={submit} className="space-y-2">
            {rows.map((row, index) => (
              <RewardRowEditor
                key={index}
                label={`Day ${index + 1}`}
                row={row}
                items={items}
                onChange={(next) => setDraft(rows.map((r, i) => (i === index ? next : r)))}
              />
            ))}
            <div className="flex flex-wrap gap-2 pt-3">
              <Button type="submit" disabled={saving || (!draft && !!week)}>
                {saving && <Loader2 className="animate-spin" />}
                {week ? "Save next week" : hasActive ? "Queue next week" : "Start this week"}
              </Button>
              {draft && (
                <Button type="button" variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
                  <RotateCcw /> Discard changes
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            {rows.map((row, index) => (
              <RewardRowView key={index} label={`Day ${index + 1}`} row={row} items={items} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
