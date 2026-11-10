import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Send, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "@/components/common/DataTable";
import FormField from "@/components/common/FormField";
import ImageUpload from "@/components/common/ImageUpload";
import PageHeader from "@/components/common/PageHeader";
import PlayerAvatar from "@/components/common/PlayerAvatar";
import SearchInput from "@/components/common/SearchInput";
import { Can } from "@/features/auth/permissions";
import { useCan } from "@/features/auth/useCan";
import { useListParams } from "@/hooks/useListParams";
import { fieldErrors } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import {
  useDecideJoinRequestMutation,
  useGetChannelMembersQuery,
  useGetChannelMessagesQuery,
  useGetChannelsQuery,
  useGetJoinRequestsQuery,
  useSaveChannelMutation,
  useSendChannelMessageMutation,
} from "./channelsApi";

export default function ChannelsPage() {
  const list = useListParams();
  const search = list.get("q");
  const strix = list.get("show") === "strix";
  const { data, isLoading, isFetching, error, refetch } = useGetChannelsQuery({ page: list.page, search, strix });
  const [editing, setEditing] = useState(null);
  const [managing, setManaging] = useState(null);
  const canEdit = useCan("edit_channels");

  const columns = [
    {
      key: "name",
      header: "Channel",
      cell: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          {c.image ? <img src={c.image} alt="" className="size-10 rounded-md object-cover" /> : <div className="size-10 rounded-md bg-muted" />}
          <div className="min-w-0">
            <p className="truncate font-medium">{c.name} {c.is_strix_channel && <Badge className="ml-1">Strix</Badge>}</p>
            <p className="max-w-md truncate text-sm text-muted-foreground">{c.description}</p>
          </div>
        </div>
      ),
    },
    { key: "owner", header: "Owner", cell: (c) => (c.is_strix_channel ? "Strix" : (c.user?.username ?? "—")) },
    { key: "members", header: "Members", className: "text-right tabular-nums", cell: (c) => formatNumber(c.joined_users_count) },
    {
      key: "pending",
      header: "Waiting",
      className: "text-right tabular-nums",
      cell: (c) => (c.pending_join_requests_count ? <Badge variant="secondary">{c.pending_join_requests_count}</Badge> : "—"),
    },
    { key: "created", header: "Created", cell: (c) => formatDate(c.created_at) },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (c) =>
        c.is_strix_channel && (
          <div className="flex justify-end gap-1">
            {canEdit && <Button variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}><Pencil /></Button>}
            <Button variant="outline" size="sm" onClick={() => setManaging(c)}><Settings2 /> Manage</Button>
          </div>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Channels" description="Group chats around a game. Staff run the official Strix channels; player channels are listed for oversight." />
      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        emptyTitle={search ? "No channels match your search" : "No channels yet"}
        pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
        toolbar={
          <>
            <SearchInput value={search} onChange={(q) => list.set({ q })} placeholder="Search channels" />
            <div className="flex gap-1">
              <Button size="sm" variant={strix ? "ghost" : "secondary"} onClick={() => list.set({ show: "" })}>All</Button>
              <Button size="sm" variant={strix ? "secondary" : "ghost"} onClick={() => list.set({ show: "strix" })}>Strix only</Button>
            </div>
            <Can permission="create_channels">
              <Button className="sm:ml-auto" onClick={() => setEditing({})}><Plus /> New Strix channel</Button>
            </Can>
          </>
        }
      />
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          {editing && <ChannelForm key={editing.id ?? "new"} channel={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
      <Sheet open={!!managing} onOpenChange={(open) => !open && setManaging(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{managing && <ManageChannel channel={managing} />}</SheetContent>
      </Sheet>
    </>
  );
}

function ChannelForm({ channel, onDone }) {
  const [values, setValues] = useState({
    name: channel.name ?? "",
    description: channel.description ?? "",
    needs_admin_approval: channel.needs_admin_approval ?? false,
    image_file: null,
  });
  const [save, { isLoading, error }] = useSaveChannelMutation();
  const errors = fieldErrors(error);

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData();
    form.append("name", values.name.trim());
    form.append("description", values.description.trim());
    form.append("needs_admin_approval", values.needs_admin_approval ? "1" : "0");
    if (values.image_file) form.append("image_file", values.image_file);
    try {
      await save({ id: channel.id, formData: form }).unwrap();
      toast.success(channel.id ? "Channel updated" : "Channel created");
      onDone();
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{channel.id ? `Edit ${channel.name}` : "New Strix channel"}</DialogTitle>
        <DialogDescription>Official channels carry the Strix badge.</DialogDescription>
      </DialogHeader>
      <FormField label="Image" error={errors.image_file}>
        <ImageUpload value={values.image_file} onChange={(file) => setValues({ ...values, image_file: file })} currentUrl={channel.image} />
      </FormField>
      <FormField label="Name" htmlFor="ch-name" error={errors.name}>
        <Input id="ch-name" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
      </FormField>
      <FormField label="Description" htmlFor="ch-desc" error={errors.description}>
        <Textarea id="ch-desc" required rows={3} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
      </FormField>
      <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
        <span><span className="font-medium">Approve new members</span><span className="block text-muted-foreground">Players ask to join and staff approve them.</span></span>
        <Switch checked={values.needs_admin_approval} onCheckedChange={(on) => setValues({ ...values, needs_admin_approval: on })} />
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading || (!channel.id && !values.image_file)}>
          {isLoading && <Loader2 className="animate-spin" />}
          {channel.id ? "Save" : "Create channel"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ManageChannel({ channel }) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{channel.name}</SheetTitle>
        <SheetDescription>Post as Strix, approve join requests and see who's in.</SheetDescription>
      </SheetHeader>
      <Tabs defaultValue="messages" className="px-4 pb-6">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="requests">Join requests {channel.pending_join_requests_count > 0 && <Badge className="ml-1 h-5 px-1.5">{channel.pending_join_requests_count}</Badge>}</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="pt-3"><Messages channelId={channel.id} /></TabsContent>
        <TabsContent value="requests" className="pt-3"><Requests channelId={channel.id} /></TabsContent>
        <TabsContent value="members" className="pt-3"><Members channelId={channel.id} /></TabsContent>
      </Tabs>
    </>
  );
}

function Messages({ channelId }) {
  const { data: messages = [], isLoading } = useGetChannelMessagesQuery({ id: channelId }, { pollingInterval: 15_000 });
  const [send, { isLoading: sending }] = useSendChannelMessageMutation();
  const [text, setText] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    try {
      await send({ id: channelId, message: text.trim() }).unwrap();
      setText("");
    } catch {
      // toast from the store
    }
  };

  return (
    <div className="space-y-3">
      <div className="max-h-[55svh] space-y-3 overflow-y-auto rounded-lg border p-3">
        {isLoading ? <Skeleton className="h-24" /> : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : messages.map((m) => (
          <div key={m.id} className="flex gap-2">
            <PlayerAvatar player={m.user ?? { username: "Strix" }} className="size-7" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{m.user?.username ?? "Strix"}</span> · {formatDate(m.created_at, true)}</p>
              <p className="text-sm break-words whitespace-pre-wrap">{m.message}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the channel as Strix" aria-label="Message" />
        <Button type="submit" size="icon" disabled={sending || !text.trim()} aria-label="Send">{sending ? <Loader2 className="animate-spin" /> : <Send />}</Button>
      </form>
    </div>
  );
}

function Requests({ channelId }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetJoinRequestsQuery({ id: channelId, page });
  const [decide, { isLoading: saving }] = useDecideJoinRequestMutation();
  const columns = [
    { key: "player", header: "Player", cell: (r) => r.user?.username ?? "—" },
    { key: "when", header: "Asked", cell: (r) => formatDate(r.created_at, true) },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" disabled={saving} onClick={() => decide({ id: channelId, requestId: r.id, accept: true })}><Check /> Accept</Button>
          <Button size="sm" variant="ghost" disabled={saving} onClick={() => decide({ id: channelId, requestId: r.id, accept: false })}><X /> Deny</Button>
        </div>
      ),
    },
  ];
  return <DataTable columns={columns} rows={data?.items} isLoading={isLoading} isFetching={isFetching} error={error} onRetry={refetch} emptyTitle="No one is waiting" pagination={{ page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: setPage }} />;
}

function Members({ channelId }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetChannelMembersQuery({ id: channelId, page });
  const columns = [
    { key: "player", header: "Player", cell: (m) => <div className="flex items-center gap-2"><PlayerAvatar player={m.user} className="size-7" />{m.user?.username ?? "—"}</div> },
    { key: "since", header: "Joined", cell: (m) => formatDate(m.updated_at ?? m.created_at) },
  ];
  return <DataTable columns={columns} rows={data?.items} isLoading={isLoading} isFetching={isFetching} error={error} onRetry={refetch} emptyTitle="No members yet" pagination={{ page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: setPage }} />;
}
