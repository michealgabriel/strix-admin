import { useState } from "react";
import { Coins, Flag, Loader2, Plus, RotateCcw, Star, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { useCan } from "@/features/auth/useCan";
import { errorMessage } from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/format";
import {
  useGetDailyMissionsQuery,
  useGetMissionActionsQuery,
  useGetPowerMissionsQuery,
  useSavePowerMissionsMutation,
} from "./missionsApi";

// "Follow any {{x}} strix person(s)" with x = 3
const describe = (mission) => String(mission.description ?? "").replaceAll("{{x}}", mission.objective_quantity);

function MissionRow({ mission, actions }) {
  const action = actions.find((a) => a.slug === mission.objective_type);
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{describe(mission)}</p>
        <p className="text-xs text-muted-foreground">{action ? action.slug.replaceAll("_", " ") : mission.objective_type}</p>
      </div>
      <div className="flex shrink-0 gap-3 text-sm tabular-nums">
        <span className="flex items-center gap-1"><Star className="size-4 text-amber-500" />{mission.reward_xp}</span>
        <span className="flex items-center gap-1"><Coins className="size-4 text-amber-500" />{mission.reward_gold}</span>
      </div>
    </li>
  );
}

export default function MissionsPage() {
  const power = useGetPowerMissionsQuery();
  const daily = useGetDailyMissionsQuery();
  const { data: actions = [] } = useGetMissionActionsQuery();
  const error = power.error ?? daily.error;

  if (error) {
    return (
      <>
        <PageHeader title="Missions" />
        <EmptyState icon={Flag} title="Couldn't load missions" description={errorMessage(error)}>
          <Button variant="outline" size="sm" onClick={() => { power.refetch(); daily.refetch(); }}>Try again</Button>
        </EmptyState>
      </>
    );
  }

  const weekEnds = power.data?.active?.[0]?.expiration_date;

  return (
    <>
      <PageHeader
        title="Missions"
        description="Daily missions are picked automatically every day. Power missions are bigger weekly goals you set here."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="size-4 text-primary" /> This week's power missions</CardTitle>
            <CardDescription>{weekEnds ? `Ends ${formatDate(weekEnds, true)} (${formatRelative(weekEnds)})` : "None running"}</CardDescription>
          </CardHeader>
          <CardContent>
            {power.isLoading ? <Skeleton className="h-40" /> : power.data.active.length === 0 ? (
              <p className="text-sm text-muted-foreground">No power missions this week.</p>
            ) : (
              <ul className="divide-y">{power.data.active.map((m) => <MissionRow key={m.id} mission={m} actions={actions} />)}</ul>
            )}
          </CardContent>
        </Card>

        <NextWeek missions={power.data?.next} hasActive={(power.data?.active?.length ?? 0) > 0} actions={actions} isLoading={power.isLoading} />

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Today's daily missions</CardTitle>
            <CardDescription>Chosen automatically each day. Rewards players earned but didn't claim are credited when the day ends.</CardDescription>
          </CardHeader>
          <CardContent>
            {daily.isLoading ? <Skeleton className="h-32" /> : daily.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No daily missions right now. They're picked on the next scheduler run.</p>
            ) : (
              <ul className="divide-y">{daily.data.map((m) => <MissionRow key={m.id} mission={m} actions={actions} />)}</ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const fromAction = (action) => ({
  description: action.example_description,
  objective_type: action.slug,
  objective_quantity: 1,
  reward_xp: action.example_reward_xp ?? 100,
  reward_gold: action.example_reward_gold ?? 0,
  objective_url: "",
});

function NextWeek({ missions = [], hasActive, actions, isLoading }) {
  const canEdit = useCan("create_missions");
  const [draft, setDraft] = useState(null);
  const [save, { isLoading: saving }] = useSavePowerMissionsMutation();
  const existing = missions.length > 0;
  const rows = draft ?? (existing ? missions.map(({ description, objective_type, objective_quantity, reward_xp, reward_gold, objective_url }) => ({ description, objective_type, objective_quantity, reward_xp, reward_gold, objective_url: objective_url ?? "" })) : null);

  const update = (index, changes) => setDraft(rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));

  const submit = async (event) => {
    event.preventDefault();
    const data = rows.map((row) => ({
      ...row,
      objective_quantity: Number(row.objective_quantity),
      reward_xp: Number(row.reward_xp),
      reward_gold: Number(row.reward_gold),
      objective_url: row.objective_url || null,
    }));
    try {
      await save({ missions: data, replaceNext: existing }).unwrap();
      toast.success(existing ? "Next week's missions updated" : "Next week's missions queued");
      setDraft(null);
    } catch {
      // toast from the store
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next week's power missions</CardTitle>
        <CardDescription>
          {existing ? "Start when this week ends." : hasActive ? "Nothing queued. Add missions so the next week isn't empty." : "Set missions to start a week now."}
          {existing && " You can change each mission; the number of missions stays the same."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-40" /> : !rows ? (
          canEdit && actions.length > 0 ? (
            <Button onClick={() => setDraft([fromAction(actions[0])])}><Plus /> Plan next week</Button>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing queued.</p>
          )
        ) : !canEdit ? (
          <ul className="divide-y">{rows.map((m, i) => <MissionRow key={i} mission={m} actions={actions} />)}</ul>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {rows.map((row, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Select
                    value={row.objective_type}
                    onValueChange={(slug) => {
                      const action = actions.find((a) => a.slug === slug);
                      update(index, { objective_type: slug, description: action?.example_description ?? row.description });
                    }}
                  >
                    <SelectTrigger className="w-full" aria-label={`Mission ${index + 1} action`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {actions.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.slug.replaceAll("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {!existing && rows.length > 1 && (
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove mission ${index + 1}`} onClick={() => setDraft(rows.filter((_, i) => i !== index))}>
                      <Trash2 />
                    </Button>
                  )}
                </div>
                <Input aria-label={`Mission ${index + 1} wording`} value={row.description} onChange={(e) => update(index, { description: e.target.value })} required />
                <div className="grid grid-cols-3 gap-2">
                  <label className="space-y-1 text-xs text-muted-foreground">Times ({"{{x}}"})
                    <Input type="number" min={1} required value={row.objective_quantity} onChange={(e) => update(index, { objective_quantity: e.target.value })} />
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground">XP
                    <Input type="number" min={0} required value={row.reward_xp} onChange={(e) => update(index, { reward_xp: e.target.value })} />
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground">Gold
                    <Input type="number" min={0} required value={row.reward_gold} onChange={(e) => update(index, { reward_gold: e.target.value })} />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">Players see: <span className="font-medium text-foreground">{describe(row)}</span></p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {!existing && (
                <Button type="button" variant="outline" onClick={() => setDraft([...rows, fromAction(actions[0])])}><Plus /> Add mission</Button>
              )}
              <Button type="submit" disabled={saving || (!draft && existing)}>
                {saving && <Loader2 className="animate-spin" />}
                {existing ? "Save next week" : "Queue next week"}
              </Button>
              {draft && (
                <Button type="button" variant="ghost" onClick={() => setDraft(null)} disabled={saving}><RotateCcw /> Discard changes</Button>
              )}
            </div>
            {existing && <Badge variant="secondary">{rows.length} missions</Badge>}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
