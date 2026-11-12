import { useState } from "react";
import { AlertTriangle, Bot, Loader2, MessagesSquare, Newspaper, PenLine, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import FormField from "@/components/common/FormField";
import { errorMessage } from "@/lib/api";
import { useGetOverviewQuery, useRunTaskMutation, useSaveSettingsMutation } from "./studioApi";

const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

export default function SettingsTab() {
  const { data, isLoading, error, refetch } = useGetOverviewQuery();

  if (error) {
    return (
      <EmptyState icon={Bot} title="Couldn't load the settings" description={errorMessage(error)}>
        <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
      </EmptyState>
    );
  }
  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BudgetCard budget={data.budget} />
      <PipelineCard key={JSON.stringify(data.settings)} overview={data} />
    </div>
  );
}

function BudgetCard({ budget }) {
  const used = budget.limit ? Math.min(100, (budget.spent_today / budget.limit) * 100) : 0;
  const max = Math.max(...budget.days.map((day) => day.cost), budget.limit, 0.01);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Wallet className="size-4" /> AI budget</CardTitle>
        <CardDescription>Claude spending today, in UTC. The agents stop for the day when the limit is reached.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{money(budget.spent_today)} <span className="text-base font-normal text-muted-foreground">of {money(budget.limit)} today</span></p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-label="Budget used today" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(used)}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${used}%` }} />
          </div>
        </div>
        <div className="flex h-24 items-end gap-1.5" aria-label="Spending over the last 7 days">
          {budget.days.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1" title={`${day.date}: ${money(day.cost)}`}>
              <div className="w-full rounded-t bg-primary/70" style={{ height: `${Math.max(2, (day.cost / max) * 80)}px` }} />
              <span className="text-[10px] text-muted-foreground">{day.date.slice(5)}</span>
            </div>
          ))}
        </div>
        {Object.keys(budget.by_purpose).length > 0 && (
          <p className="text-sm text-muted-foreground">
            Today: {Object.entries(budget.by_purpose).map(([purpose, cost]) => `${purpose} ${money(cost)}`).join(" · ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineCard({ overview }) {
  const [values, setValues] = useState(overview.settings);
  const [save, { isLoading: saving }] = useSaveSettingsMutation();
  const [run, { isLoading: running }] = useRunTaskMutation();
  const auto = values.autopilot.posts;
  const chat = values.autopilot.chatter;
  const setPipeline = (key) => (value) => setValues((v) => ({ ...v, pipeline: { ...v.pipeline, [key]: value } }));
  const setAuto = (key) => (value) => setValues((v) => ({ ...v, autopilot: { ...v.autopilot, posts: { ...v.autopilot.posts, [key]: value } } }));
  const setChat = (key) => (value) => setValues((v) => ({ ...v, autopilot: { ...v.autopilot, chatter: { ...v.autopilot.chatter, [key]: value } } }));

  const submit = async () => {
    try {
      await save({
        pipeline: { enabled: values.pipeline.enabled, news_hour: Number(values.pipeline.news_hour) },
        autopilot: {
          posts: { ...auto, per_day: Number(auto.per_day), start_hour: Number(auto.start_hour), end_hour: Number(auto.end_hour) },
          chatter: { ...chat, per_day: Number(chat.per_day), start_hour: Number(chat.start_hour), end_hour: Number(chat.end_hour) },
        },
        timezone: values.timezone,
      }).unwrap();
      toast.success("Settings saved");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const runNow = async (task) => {
    try {
      const result = await run(task).unwrap();
      toast.success(result.message);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Bot className="size-4" /> Pipeline and autopilot</CardTitle>
        <CardDescription>The curators search the news once a day and write drafts in each agent's voice. Times are in {values.timezone}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!overview.ai_configured && (
          <p className="flex items-start gap-2 rounded-lg border border-warning/40 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" /> The server has no Claude key yet (ANTHROPIC_API_KEY), so nothing will be written.
          </p>
        )}
        <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
          <span><span className="font-medium">Run the curators</span><span className="block text-muted-foreground">Find news daily and write drafts automatically.</span></span>
          <Switch checked={values.pipeline.enabled} onCheckedChange={setPipeline("enabled")} aria-label="Run the curators" />
        </label>
        <FormField label="News search hour" htmlFor="s-news">
          <Input id="s-news" type="number" min={0} max={23} value={values.pipeline.news_hour} onChange={(e) => setPipeline("news_hour")(e.target.value)} />
        </FormField>
        <div className="space-y-3 rounded-lg border p-3">
          <label className="flex items-center justify-between gap-4 text-sm">
            <span><span className="font-medium">Autopilot</span><span className="block text-muted-foreground">New drafts are scheduled without review, spread across the day.</span></span>
            <Switch checked={auto.enabled} onCheckedChange={setAuto("enabled")} aria-label="Autopilot" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Posts a day" htmlFor="s-per"><Input id="s-per" type="number" min={1} max={48} value={auto.per_day} onChange={(e) => setAuto("per_day")(e.target.value)} /></FormField>
            <FormField label="From hour" htmlFor="s-from"><Input id="s-from" type="number" min={0} max={23} value={auto.start_hour} onChange={(e) => setAuto("start_hour")(e.target.value)} /></FormField>
            <FormField label="Until hour" htmlFor="s-to"><Input id="s-to" type="number" min={1} max={24} value={auto.end_hour} onChange={(e) => setAuto("end_hour")(e.target.value)} /></FormField>
          </div>
          <FormField label="Posted by">
            <Select value={auto.publish_as} onValueChange={setAuto("publish_as")}>
              <SelectTrigger className="w-full" aria-label="Autopilot posts by"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">The agent who wrote it</SelectItem>
                <SelectItem value="random_agent">A random agent</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="space-y-3 rounded-lg border p-3">
          <label className="flex items-center justify-between gap-4 text-sm">
            <span><span className="font-medium">Channel chatter</span><span className="block text-muted-foreground">Agents chat in Strix channels on their own, a few conversations a day. Players who @mention them get answers either way.</span></span>
            <Switch checked={chat.enabled} onCheckedChange={setChat("enabled")} aria-label="Channel chatter" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Chats a day" htmlFor="c-per"><Input id="c-per" type="number" min={1} max={24} value={chat.per_day} onChange={(e) => setChat("per_day")(e.target.value)} /></FormField>
            <FormField label="From hour" htmlFor="c-from"><Input id="c-from" type="number" min={0} max={23} value={chat.start_hour} onChange={(e) => setChat("start_hour")(e.target.value)} /></FormField>
            <FormField label="Until hour" htmlFor="c-to"><Input id="c-to" type="number" min={1} max={24} value={chat.end_hour} onChange={(e) => setChat("end_hour")(e.target.value)} /></FormField>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save settings</Button>
          <Button variant="outline" disabled={running || !overview.ai_configured} onClick={() => runNow("news")}><Newspaper /> Find news now</Button>
          <Button variant="outline" disabled={running || !overview.ai_configured} onClick={() => runNow("write")}><PenLine /> Write drafts now</Button>
          <Button variant="outline" disabled={running || !overview.ai_configured} onClick={() => runNow("chatter")}><MessagesSquare /> Write a chat now</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Stories waiting: {overview.stories?.new ?? 0} · being written: {overview.stories?.writing ?? 0}
          {overview.batches_running?.length ? ` · running: ${overview.batches_running.join(", ")}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
