import { useState } from "react";
import { CalendarClock, Check, ExternalLink, Inbox, Loader2, Pencil, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import FormField from "@/components/common/FormField";
import Pagination from "@/components/common/Pagination";
import { useListParams } from "@/hooks/useListParams";
import { errorMessage, fieldErrors } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  useApproveContentMutation,
  useBulkContentMutation,
  useGetAgentsQuery,
  useGetContentQuery,
  useRejectContentMutation,
  useSaveContentMutation,
} from "./studioApi";

const STATUSES = [
  ["draft", "To review"],
  ["scheduled", "Scheduled"],
  ["published", "Published"],
  ["failed", "Failed"],
  ["rejected", "Rejected"],
];

const WHO = [
  ["agent", "Its agent"],
  ["random_agent", "A random agent"],
  ["strix", "Strix (official)"],
];

export default function QueueTab() {
  const list = useListParams();
  const status = list.get("status") || "draft";
  const { data, isLoading, isFetching, error, refetch } = useGetContentQuery({ status, page: list.page });
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [bulk, { isLoading: bulking }] = useBulkContentMutation();

  const toggle = (id) => setSelected((current) => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const runBulk = async (action) => {
    try {
      const result = await bulk({ ids: [...selected], action }).unwrap();
      toast.success(result.message);
      setSelected(new Set());
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const counts = data?.counts ?? {};

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="tablist">
          {STATUSES.map(([value, label]) => (
            <Button key={value} role="tab" aria-selected={status === value} size="sm" variant={status === value ? "secondary" : "ghost"}
              onClick={() => { setSelected(new Set()); list.set({ status: value === "draft" ? "" : value }); }}>
              {label} {counts[value] ? <Badge variant="outline" className="ml-1">{counts[value]}</Badge> : null}
            </Button>
          ))}
        </div>
        {status === "draft" && selected.size > 0 && (
          <div className="flex gap-2 sm:ml-auto">
            <Button size="sm" variant="outline" disabled={bulking} onClick={() => runBulk("reject")}><X /> Reject {selected.size}</Button>
            <Button size="sm" disabled={bulking} onClick={() => runBulk("approve")}><CalendarClock /> Schedule {selected.size}</Button>
          </div>
        )}
      </div>

      {error ? (
        <EmptyState icon={Inbox} title="Couldn't load the queue" description={errorMessage(error)}>
          <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
        </EmptyState>
      ) : isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : !data?.items.length ? (
        <EmptyState icon={Inbox} title={status === "draft" ? "Nothing to review" : "Nothing here"}
          description={status === "draft" ? "New drafts appear here after the curators run. Turn the pipeline on, or run it now, in Settings." : undefined} />
      ) : (
        <div className={cn("space-y-3", isFetching && "opacity-60")}>
          {data.items.map((item) => (
            <ItemCard key={item.id} item={item} selectable={status === "draft"} selected={selected.has(item.id)} onSelect={() => toggle(item.id)} onEdit={() => setEditing(item)} />
          ))}
          <Pagination page={list.page} totalPages={data.totalPages} total={data.total} onPageChange={list.setPage} />
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          {editing && <ItemForm key={editing.id} item={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ItemCard({ item, selectable, selected, onSelect, onEdit }) {
  const [approve, { isLoading: approving }] = useApproveContentMutation();
  const [reject, { isLoading: rejecting }] = useRejectContentMutation();
  const editable = ["draft", "scheduled", "failed"].includes(item.status);
  const who = item.kind === "channel_thread"
    ? `#${item.payload.channel_name} · ${new Set(item.payload.messages.map((m) => m.username)).size} agents`
    : item.publish_as === "strix" ? "Strix" : item.publish_as === "random_agent" ? "A random agent" : (item.agent?.display_name ?? "An agent");

  const publishNow = async () => {
    try {
      const result = await approve({ id: item.id }).unwrap();
      toast.success(result.message);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        {selectable && <Checkbox className="mt-1" checked={selected} onCheckedChange={onSelect} aria-label={`Select ${item.payload.title}`} />}
        {item.media?.image_url && <img src={item.media.image_url} alt="" className="aspect-[4/5] w-full shrink-0 rounded-md object-cover sm:w-36" />}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="min-w-0 flex-1 font-semibold leading-snug">{item.payload.title}</h3>
            {editable && <Button variant="ghost" size="icon-sm" aria-label={`Edit ${item.payload.title}`} onClick={onEdit}><Pencil /></Button>}
          </div>
          {item.kind === "channel_thread" ? (
            <ol className="space-y-1 text-sm" aria-label="Chat messages">
              {item.payload.messages.map((message, index) => (
                <li key={index} className={cn("rounded-md bg-muted/50 px-2 py-1", message.sent_id && "opacity-60")}>
                  <span className="font-medium">@{message.username}</span> {message.text}
                  {message.sent_id ? <span className="ml-1 text-xs text-muted-foreground">(sent)</span> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{item.payload.text}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <Badge variant="secondary">{who}</Badge>
            {item.tagged_games.map((game) => <Badge key={game.id} variant="outline">{game.name}</Badge>)}
            {item.payload.source_url && (
              <a href={item.payload.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                {item.payload.source_name || "Source"} <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {item.status === "scheduled" && item.scheduled_at && `Goes out ${formatDate(item.scheduled_at, true)} · `}
            {item.status === "published" && item.published_at && `Published ${formatDate(item.published_at, true)} · `}
            Written {formatDate(item.created_at)}
          </p>
          {item.error && <p className="text-sm text-destructive">{item.error}</p>}
          {editable && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={publishNow} disabled={approving}>{approving ? <Loader2 className="animate-spin" /> : <Send />} {item.kind === "channel_thread" ? "Start chat now" : "Publish now"}</Button>
              <Button size="sm" variant="outline" onClick={onEdit}><CalendarClock /> Edit or schedule</Button>
              <Button size="sm" variant="ghost" disabled={rejecting} onClick={() => reject(item.id)}><X /> Reject</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// "2026-11-14T09:30" in the admin's own time
function localInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function ItemForm({ item, onDone }) {
  if (item.kind === "channel_thread") return <ThreadForm item={item} onDone={onDone} />;
  return <PostForm item={item} onDone={onDone} />;
}

// A chat's lines can be reworded, or emptied to drop them, before they go out
function ThreadForm({ item, onDone }) {
  const [lines, setLines] = useState(item.payload.messages.map((message) => message.text));
  const [when, setWhen] = useState(item.status === "scheduled" ? localInput(item.scheduled_at) : "");
  const [save, { isLoading: saving, error }] = useSaveContentMutation();
  const [approve, { isLoading: approving }] = useApproveContentMutation();
  const errors = fieldErrors(error);
  const busy = saving || approving;

  const submit = async (mode) => {
    try {
      await save({ id: item.id, messages: lines.map((text) => ({ text })) }).unwrap();
      if (mode === "save") {
        toast.success("Chat saved");
      } else {
        const result = await approve({ id: item.id, ...(mode === "schedule" && when ? { scheduled_at: new Date(when).toISOString() } : {}) }).unwrap();
        toast.success(result.message);
      }
      onDone();
    } catch (e) {
      if (!Object.keys(fieldErrors(e)).length) toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit chat in #{item.payload.channel_name}</DialogTitle>
        <DialogDescription>Messages go out one at a time, a few minutes apart. Empty a line to drop it.</DialogDescription>
      </DialogHeader>
      {item.payload.messages.map((message, index) => (
        <FormField key={index} label={`@${message.username}`} htmlFor={`t-${index}`}>
          <Input id={`t-${index}`} maxLength={500} value={lines[index]} disabled={!!message.sent_id}
            onChange={(e) => setLines((current) => current.map((line, i) => (i === index ? e.target.value : line)))} />
        </FormField>
      ))}
      {errors.messages && <p className="text-sm text-destructive">{errors.messages}</p>}
      <FormField label="Start at (optional)" htmlFor="t-when" hint="Your own time.">
        <Input id="t-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </FormField>
      <DialogFooter className="gap-2">
        <Button variant="outline" disabled={busy} onClick={() => submit("save")}>Save chat</Button>
        {when
          ? <Button disabled={busy} onClick={() => submit("schedule")}><CalendarClock /> Schedule</Button>
          : <Button disabled={busy} onClick={() => submit("now")}>{busy ? <Loader2 className="animate-spin" /> : <Send />} Start chat now</Button>}
      </DialogFooter>
    </div>
  );
}

function PostForm({ item, onDone }) {
  const { data: agents = [] } = useGetAgentsQuery();
  const [values, setValues] = useState({
    title: item.payload.title ?? "",
    text: item.payload.text ?? "",
    card_headline: item.payload.card_headline ?? "",
    publish_as: item.publish_as,
    ai_agent_id: item.agent?.id ? String(item.agent.id) : "",
    scheduled_at: item.status === "scheduled" ? localInput(item.scheduled_at) : "",
  });
  const [save, { isLoading: saving, error: saveError }] = useSaveContentMutation();
  const [approve, { isLoading: approving, error: approveError }] = useApproveContentMutation();
  const errors = { ...fieldErrors(saveError), ...fieldErrors(approveError) };
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e?.target ? e.target.value : e }));
  const busy = saving || approving;

  const edits = () => ({
    id: item.id,
    title: values.title.trim(),
    text: values.text.trim(),
    ...(item.kind === "image_post" ? { card_headline: values.card_headline.trim() } : {}),
    publish_as: values.publish_as,
    ai_agent_id: values.publish_as === "agent" && values.ai_agent_id ? Number(values.ai_agent_id) : null,
  });

  const submit = async (mode) => {
    try {
      await save(edits()).unwrap();
      if (mode === "save") {
        toast.success("Draft saved");
      } else {
        const when = mode === "schedule" && values.scheduled_at ? { scheduled_at: new Date(values.scheduled_at).toISOString() } : {};
        const result = await approve({ id: item.id, ...when }).unwrap();
        toast.success(result.message);
      }
      onDone();
    } catch (e) {
      if (!Object.keys(fieldErrors(e)).length) toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit draft</DialogTitle>
        <DialogDescription>Change the words, who posts it, and when.</DialogDescription>
      </DialogHeader>
      <FormField label="Title" htmlFor="q-title" error={errors.title}>
        <Input id="q-title" maxLength={255} value={values.title} onChange={set("title")} />
      </FormField>
      <FormField label="Text" htmlFor="q-text" error={errors.text}>
        <Textarea id="q-text" rows={5} maxLength={5000} value={values.text} onChange={set("text")} />
      </FormField>
      {item.kind === "image_post" && (
        <FormField label="Card headline" htmlFor="q-card" error={errors.card_headline} hint="Changing it redraws the image card.">
          <Input id="q-card" maxLength={80} value={values.card_headline} onChange={set("card_headline")} />
        </FormField>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Posted by">
          <Select value={values.publish_as} onValueChange={set("publish_as")}>
            <SelectTrigger className="w-full" aria-label="Posted by"><SelectValue /></SelectTrigger>
            <SelectContent>{WHO.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        {values.publish_as === "agent" && (
          <FormField label="Agent" error={errors.ai_agent_id}>
            <Select value={values.ai_agent_id} onValueChange={set("ai_agent_id")}>
              <SelectTrigger className="w-full" aria-label="Agent"><SelectValue placeholder="Choose an agent" /></SelectTrigger>
              <SelectContent>{agents.map((agent) => <SelectItem key={agent.id} value={String(agent.id)}>{agent.display_name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
        )}
      </div>
      <FormField label="Schedule for (optional)" htmlFor="q-when" error={errors.scheduled_at} hint="Your own time. Leave empty and use Publish now to post straight away.">
        <Input id="q-when" type="datetime-local" value={values.scheduled_at} onChange={set("scheduled_at")} />
      </FormField>
      <DialogFooter className="gap-2">
        <Button variant="outline" disabled={busy} onClick={() => submit("save")}>Save draft</Button>
        {values.scheduled_at
          ? <Button disabled={busy} onClick={() => submit("schedule")}><CalendarClock /> Schedule</Button>
          : <Button disabled={busy} onClick={() => submit("now")}>{busy ? <Loader2 className="animate-spin" /> : <Check />} Publish now</Button>}
      </DialogFooter>
    </div>
  );
}
