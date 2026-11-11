import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Headset, Loader2, MessageSquare, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import PlayerAvatar from "@/components/common/PlayerAvatar";
import SearchInput from "@/components/common/SearchInput";
import { selectAdmin } from "@/features/auth/authSlice";
import { useListParams } from "@/hooks/useListParams";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { errorMessage } from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  supportApi,
  upsertMessage,
  useCloseSupportSessionMutation,
  useGetSupportMessagesQuery,
  useGetSupportSessionQuery,
  useGetSupportSessionsQuery,
  useJoinSupportSessionMutation,
  useSendSupportMessageMutation,
} from "./supportApi";

export default function SupportPage() {
  const list = useListParams();
  const status = list.get("status") || "open";
  const assigned = list.get("assigned");
  const search = list.get("q");
  const selected = list.get("chat");
  const dispatch = useDispatch();

  // Every chat's activity arrives on the staff inbox channel; the open chat updates in place
  const live = useRealtimeChannel(
    "private-support-inbox",
    {
      "support.message.sent": (message) => {
        const id = String(message.support_session_id);
        if (message.truncated) {
          dispatch(supportApi.util.invalidateTags([{ type: "SupportMessages", id }]));
        } else {
          dispatch(supportApi.util.updateQueryData("getSupportMessages", id, (draft) => upsertMessage(draft, message)));
        }
        dispatch(supportApi.util.invalidateTags(["Support"]));
      },
      "support.session.changed": (change) => {
        dispatch(supportApi.util.invalidateTags(["Support", "Dashboard", { type: "SupportChat", id: String(change.support_session_id) }]));
      },
    },
    () => dispatch(supportApi.util.invalidateTags(["Support", "SupportChat", "SupportMessages"])),
  );

  // Polling only stands in while live updates aren't working
  const { data, isLoading, error, refetch } = useGetSupportSessionsQuery({ page: list.page, status, assigned, search }, { pollingInterval: live ? 0 : 30_000 });

  return (
    <>
      <PageHeader
        title="Customer Support"
        description="Chats players start from the app. The first person to reply takes the chat, and the player gets a notification."
        actions={
          <Badge variant="outline" className="gap-1.5" title={live ? "New messages appear as they're sent" : "Checking for new messages every few seconds"}>
            <span className={cn("size-2 rounded-full", live ? "bg-emerald-500" : "bg-muted-foreground/50")} aria-hidden />
            {live ? "Live" : "Refreshing"}
          </Badge>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-3">
          <SearchInput value={search} onChange={(q) => list.set({ q, chat: selected })} placeholder="Search players" className="sm:w-full" />
          <div className="flex flex-wrap gap-1">
            {[["open", "Open"], ["closed", "Closed"], ["all", "All"]].map(([value, label]) => (
              <Button key={value} size="sm" variant={status === value ? "secondary" : "ghost"} onClick={() => list.set({ status: value === "open" ? "" : value })}>{label}</Button>
            ))}
            <span className="mx-1 w-px bg-border" />
            {[["", "Everyone"], ["me", "Mine"], ["nobody", "Unassigned"]].map(([value, label]) => (
              <Button key={label} size="sm" variant={(assigned ?? "") === value ? "secondary" : "ghost"} onClick={() => list.set({ assigned: value })}>{label}</Button>
            ))}
          </div>
          <Card className="gap-0 overflow-hidden py-0">
            {error ? (
              <EmptyState icon={Headset} title="Couldn't load chats" description={errorMessage(error)}>
                <Button size="sm" variant="outline" onClick={refetch}>Try again</Button>
              </EmptyState>
            ) : isLoading ? (
              <div className="space-y-2 p-3">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : data.items.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No chats here" description={status === "open" ? "Nobody is waiting for help." : undefined} />
            ) : (
              <ul className="max-h-[65svh] divide-y overflow-y-auto">
                {data.items.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => list.set({ chat: s.id, page: list.page })}
                      className={cn("flex w-full items-start gap-3 p-3 text-left hover:bg-muted/60", String(s.id) === selected && "bg-accent")}
                    >
                      <PlayerAvatar player={s.user} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{s.user?.username ?? "Deleted player"}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(s.updated_at)}</span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {s.latest_message ? `${s.latest_message.message_admin_id ? "Staff: " : ""}${s.latest_message.message}` : "No messages yet"}
                        </p>
                        <div className="mt-1 flex gap-1">
                          {s.support_status === "closed" && <Badge variant="secondary">Closed</Badge>}
                          {!s.joined_admin_id && s.support_status === "open" && <Badge className="bg-warning/20 text-amber-700 dark:text-amber-300">Unassigned</Badge>}
                          {s.admin && <Badge variant="outline">{s.admin.name}</Badge>}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        {selected ? <Chat key={selected} id={selected} live={live} /> : (
          <Card className="hidden lg:flex"><EmptyState icon={MessageSquare} title="Pick a chat" description="Choose a conversation on the left to read and reply." /></Card>
        )}
      </div>
    </>
  );
}

function Chat({ id, live }) {
  const me = useSelector(selectAdmin);
  const { data: session, isLoading: loadingSession, error } = useGetSupportSessionQuery(id);
  const { data: messages = [], isLoading } = useGetSupportMessagesQuery(id, { pollingInterval: live ? 0 : 5_000, skipPollingIfUnfocused: true });
  const [send, sending] = useSendSupportMessageMutation();
  const [join, joining] = useJoinSupportSessionMutation();
  const [close, closing] = useCloseSupportSessionMutation();
  const [text, setText] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const bottom = useRef(null);

  useEffect(() => bottom.current?.scrollIntoView({ block: "end" }), [messages.length]);

  if (error) return <Card><EmptyState icon={Headset} title="Couldn't open this chat" description={errorMessage(error)} /></Card>;
  if (loadingSession) return <Skeleton className="h-[60svh] rounded-xl" />;

  const closed = session.support_status === "closed";
  const mine = session.joined_admin_id === me?.id;

  const submit = async (event) => {
    event.preventDefault();
    try {
      await send({ id, message: text.trim() }).unwrap();
      setText("");
    } catch {
      // toast from the store
    }
  };

  return (
    <Card className="flex h-[75svh] flex-col gap-0 py-0">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <PlayerAvatar player={session.user} />
        <div className="min-w-0 flex-1">
          {session.user ? <Link to={`/players/${session.user.id}`} className="font-medium hover:underline">{session.user.username}</Link> : <p className="font-medium">Deleted player</p>}
          <p className="text-xs text-muted-foreground">Started {formatDate(session.created_at, true)}{session.admin ? ` · handled by ${session.admin.name}` : " · nobody has taken it yet"}</p>
        </div>
        {!closed && !mine && (
          <Button size="sm" variant="outline" disabled={joining.isLoading} onClick={() => join(Number(id)).unwrap().then(() => toast.success("You're on this chat")).catch(() => {})}>
            <UserPlus /> Take chat
          </Button>
        )}
        {!closed && <Button size="sm" variant="ghost" onClick={() => setConfirmClose(true)}><CheckCircle2 /> Close</Button>}
        {closed && <Badge variant="secondary">Closed</Badge>}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? <Skeleton className="h-32" /> : messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : messages.map((m) => {
          const staff = !!m.message_admin_id;
          return (
            <div key={m.id} className={cn("flex", staff && "justify-end")}>
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm", staff ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <p className="break-words whitespace-pre-wrap">{m.message}</p>
                {(m.media_attachments ?? []).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="Attachment" className="mt-2 max-h-48 rounded-md" /></a>)}
                <p className={cn("mt-1 text-[11px]", staff ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {staff ? (m.admin?.name ?? "Staff") : (m.user?.username ?? "Player")} · {formatDate(m.created_at, true)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {closed ? (
        <p className="border-t p-4 text-sm text-muted-foreground">This chat is closed. The player can start a new one from the app.</p>
      ) : (
        <form onSubmit={submit} className="flex items-end gap-2 border-t p-3">
          <Textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && text.trim()) submit(e); }}
            placeholder={mine ? "Reply… (Enter to send, Shift+Enter for a new line)" : "Reply to take this chat…"}
            aria-label="Reply"
          />
          <Button type="submit" size="icon" disabled={sending.isLoading || !text.trim()} aria-label="Send">{sending.isLoading ? <Loader2 className="animate-spin" /> : <Send />}</Button>
        </form>
      )}
      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Close this chat?"
        description="Do this once the player's problem is solved. They can start a new chat any time."
        confirmLabel="Close chat"
        busy={closing.isLoading}
        onConfirm={async () => {
          try {
            await close(Number(id)).unwrap();
            toast.success("Chat closed");
            setConfirmClose(false);
          } catch {
            // toast from the store
          }
        }}
      />
    </Card>
  );
}
