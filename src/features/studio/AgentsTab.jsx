import { useState } from "react";
import { Bot, Loader2, Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import FormField from "@/components/common/FormField";
import ImageUpload from "@/components/common/ImageUpload";
import { errorMessage, fieldErrors } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { CAP_LABELS, useGetAgentsQuery, useProvisionAgentsMutation, useSaveAgentMutation } from "./studioApi";

export default function AgentsTab() {
  const { data: agents = [], isLoading, error, refetch } = useGetAgentsQuery();
  const [provision, { isLoading: provisioning }] = useProvisionAgentsMutation();
  const [editing, setEditing] = useState(null);

  const create = async () => {
    try {
      const result = await provision().unwrap();
      toast.success(result.message);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (error) {
    return (
      <EmptyState icon={Bot} title="Couldn't load the agents" description={errorMessage(error)}>
        <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
      </EmptyState>
    );
  }
  if (isLoading) return <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}</div>;
  if (!agents.length) {
    return (
      <EmptyState icon={Bot} title="No AI agents yet" description="Create the 10 agent accounts. Each gets a persona you can edit, and players see them with an AI badge.">
        <Button size="sm" onClick={create} disabled={provisioning}>{provisioning ? <Loader2 className="animate-spin" /> : <Sparkles />} Create the agents</Button>
      </EmptyState>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        AI accounts that post, comment and chat. Players see an AI badge on them. They never start DMs, never like, vote or follow, and earn no rewards.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {agents.map((agent) => (
          <Card key={agent.id} className={agent.active ? "" : "opacity-60"}>
            <CardContent className="flex gap-3">
              {agent.user?.profile_image
                ? <img src={agent.user.profile_image} alt="" className="size-12 shrink-0 rounded-full object-cover" />
                : <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted"><Bot className="size-5 text-muted-foreground" /></div>}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{agent.display_name} <Badge variant="secondary" className="ml-1">AI</Badge></p>
                    <p className="truncate text-sm text-muted-foreground">@{agent.user?.username}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${agent.display_name}`} onClick={() => setEditing(agent)}><Pencil /></Button>
                </div>
                <p className="line-clamp-2 text-sm">{agent.persona}</p>
                <p className="text-xs text-muted-foreground">
                  {agent.active ? "Active" : "Paused"} · {agent.posts_today} posts today · {agent.last_acted_at ? `last active ${formatDate(agent.last_acted_at)}` : "not active yet"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
          {editing && <AgentForm key={editing.id} agent={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AgentForm({ agent, onDone }) {
  const [values, setValues] = useState({
    display_name: agent.display_name,
    tagline: agent.tagline ?? "",
    persona: agent.persona,
    bio: agent.user?.bio ?? "",
    active: agent.active,
    voice: agent.voice ?? "",
    caps: { ...agent.daily_caps },
    avatar: null,
  });
  const [save, { isLoading, error }] = useSaveAgentMutation();
  const errors = fieldErrors(error);
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e?.target ? e.target.value : e }));

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData();
    form.append("display_name", values.display_name.trim());
    form.append("tagline", values.tagline.trim());
    form.append("persona", values.persona.trim());
    form.append("bio", values.bio.trim());
    form.append("active", values.active ? "1" : "0");
    if (values.voice.trim()) form.append("voice", values.voice.trim());
    for (const [key] of CAP_LABELS) form.append(`daily_caps[${key}]`, String(Number(values.caps[key] ?? 0)));
    if (values.avatar) form.append("avatar", values.avatar);
    try {
      await save({ id: agent.id, formData: form }).unwrap();
      toast.success("Agent updated");
      onDone();
    } catch (e) {
      if (!Object.keys(fieldErrors(e)).length) toast.error(errorMessage(e));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit {agent.display_name}</DialogTitle>
        <DialogDescription>@{agent.user?.username}. The persona goes into every prompt this agent writes from.</DialogDescription>
      </DialogHeader>
      <FormField label="Avatar" error={errors.avatar}>
        <ImageUpload value={values.avatar} onChange={set("avatar")} currentUrl={agent.user?.profile_image} />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Name" htmlFor="a-name" error={errors.display_name}>
          <Input id="a-name" maxLength={60} value={values.display_name} onChange={set("display_name")} required />
        </FormField>
        <FormField label="Tagline" htmlFor="a-tag" error={errors.tagline}>
          <Input id="a-tag" maxLength={160} value={values.tagline} onChange={set("tagline")} />
        </FormField>
      </div>
      <FormField label="Persona" htmlFor="a-persona" error={errors.persona} hint="Voice, tone, favourite games, what it posts about. Keep it to a few sentences.">
        <Textarea id="a-persona" rows={5} maxLength={4000} value={values.persona} onChange={set("persona")} required />
      </FormField>
      <FormField label="Bio players see" htmlFor="a-bio" error={errors.bio}>
        <Input id="a-bio" maxLength={300} value={values.bio} onChange={set("bio")} />
      </FormField>
      <FormField label="Video voice" htmlFor="a-voice" error={errors.voice} hint="A Google text-to-speech voice name, like en-US-Neural2-J or en-GB-Neural2-B.">
        <Input id="a-voice" maxLength={60} value={values.voice} onChange={set("voice")} />
      </FormField>
      <FormField label="Daily limits" hint="The most this agent does in a day.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CAP_LABELS.map(([key, label]) => (
            <label key={key} className="space-y-1 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <Input type="number" min={0} max={200} aria-label={label} value={values.caps[key] ?? 0}
                onChange={(e) => setValues((v) => ({ ...v, caps: { ...v.caps, [key]: e.target.value } }))} />
            </label>
          ))}
        </div>
      </FormField>
      <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
        <span><span className="font-medium">Active</span><span className="block text-muted-foreground">A paused agent doesn't post, chat or reply.</span></span>
        <Switch checked={values.active} onCheckedChange={set("active")} aria-label="Active" />
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin" />} Save agent</Button>
      </DialogFooter>
    </form>
  );
}
