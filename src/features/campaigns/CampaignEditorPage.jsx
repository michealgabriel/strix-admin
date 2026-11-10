import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Bell, Loader2, Megaphone, Send, Siren, Smartphone, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import FormField from "@/components/common/FormField";
import StatCard from "@/components/common/StatCard";
import StatusBadge from "@/components/common/StatusBadge";
import { useGetGamesQuery } from "@/features/games/gamesApi";
import { useGetPlayersQuery } from "@/features/players/playersApi";
import { useGetCountriesQuery } from "@/features/settings/settingsApi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { errorMessage, fieldErrors } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  useCampaignAudienceMutation,
  useCancelCampaignMutation,
  useGetCampaignQuery,
  useSaveCampaignMutation,
  useScheduleCampaignMutation,
  useTestCampaignMutation,
} from "./campaignsApi";

const SCREENS = [
  ["home", "Home"],
  ["daily_strix", "Daily Strix"],
  ["strix_pass", "Strix Pass"],
  ["feed_following", "Feed (Following)"],
  ["rewarded_game_currencies", "Won game currency"],
];

const empty = {
  name: "", title: "", body: "", title_fr: "", body_fr: "", screen: "home", image_url: "", post_id: "",
  timing: "now", send_at: "", local_send_at: "", broadcast: false,
  segment: { countries: [], locales: [], games: [], platforms: [], inactive_days_min: "", inactive_days_max: "" },
};

// A Date as the value a datetime-local input shows, in the admin's own time zone
function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromCampaign(c) {
  return {
    ...empty,
    name: c.name ?? "", title: c.title ?? "", body: c.body ?? "", title_fr: c.title_fr ?? "", body_fr: c.body_fr ?? "",
    screen: c.screen ?? "home", image_url: c.image_url ?? "", post_id: c.data?.post_id ?? "", broadcast: !!c.broadcast,
    timing: c.local_send_at ? "local" : c.send_at ? "at" : "now",
    send_at: c.send_at ? toLocalInput(new Date(c.send_at)) : "",
    local_send_at: c.local_send_at ? String(c.local_send_at).replace(" ", "T").slice(0, 16) : "",
    segment: { ...empty.segment, ...(c.segment ?? {}) },
  };
}

// Only filled-in segment keys are sent; an empty segment means everyone
function cleanSegment(segment) {
  const out = {};
  for (const key of ["countries", "locales", "games", "platforms"]) if (segment[key]?.length) out[key] = segment[key];
  for (const key of ["inactive_days_min", "inactive_days_max"]) if (segment[key] !== "" && segment[key] != null) out[key] = Number(segment[key]);
  return out;
}

function toBody(v) {
  return {
    name: v.name.trim(), title: v.title.trim(), body: v.body.trim(),
    title_fr: v.title_fr.trim() || null, body_fr: v.body_fr.trim() || null,
    screen: v.screen || null, image_url: v.image_url.trim() || null,
    data: v.post_id ? { post_id: Number(v.post_id) } : null,
    broadcast: v.broadcast,
    send_at: !v.broadcast && v.timing === "at" && v.send_at ? new Date(v.send_at).toISOString() : null,
    local_send_at: !v.broadcast && v.timing === "local" && v.local_send_at ? v.local_send_at.replace("T", " ") : null,
    segment: v.broadcast ? null : cleanSegment(v.segment),
  };
}

export default function CampaignEditorPage() {
  const { campaignId } = useParams();
  const isNew = !campaignId || campaignId === "new";
  const { data: campaign, isLoading, error } = useGetCampaignQuery(campaignId, { skip: isNew });

  if (error) return <EmptyState icon={Megaphone} title="Couldn't load this campaign" description={errorMessage(error)}><Button asChild variant="outline" size="sm"><Link to="/campaigns">Back to campaigns</Link></Button></EmptyState>;
  if (!isNew && isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/campaigns"><ArrowLeft /> Campaigns</Link></Button>
      {isNew || campaign.status === "draft" ? <Editor key={campaign?.id ?? "new"} campaign={campaign} /> : <Results campaign={campaign} />}
    </div>
  );
}

function Chips({ options, value, onChange }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([v, label]) => (
        <button key={v} type="button" onClick={() => toggle(v)} className={cn("rounded-full border px-3 py-1 text-sm transition-colors", value.includes(v) ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted")}>
          {label}
        </button>
      ))}
    </div>
  );
}

function PhonePreview({ title, body, image }) {
  return (
    <div className="rounded-2xl border bg-muted/50 p-3">
      <div className="flex items-start gap-3 rounded-xl bg-card p-3 shadow-sm">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">S</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Strix · now</p>
          <p className="truncate text-sm font-semibold">{title || "Title"}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{body || "Message"}</p>
          {image && <img src={image} alt="" className="mt-2 max-h-32 w-full rounded-md object-cover" />}
        </div>
      </div>
    </div>
  );
}

function Editor({ campaign }) {
  const navigate = useNavigate();
  const [v, setV] = useState(() => (campaign ? fromCampaign(campaign) : empty));
  const [dirty, setDirty] = useState(false);
  const set = (key) => (value) => { setV((cur) => ({ ...cur, [key]: value?.target ? value.target.value : value })); setDirty(true); };
  const setSeg = (key) => (value) => { setV((cur) => ({ ...cur, segment: { ...cur.segment, [key]: value?.target ? value.target.value : value } })); setDirty(true); };

  const { data: countries = [] } = useGetCountriesQuery();
  const { data: games } = useGetGamesQuery({ limit: 100 });
  const [save, saving] = useSaveCampaignMutation();
  const [audience, audienceState] = useCampaignAudienceMutation();
  const [schedule, scheduling] = useScheduleCampaignMutation();
  const [confirming, setConfirming] = useState(false);
  const [testing, setTesting] = useState(false);
  const errors = fieldErrors(saving.error);

  const segmentKey = JSON.stringify(v.broadcast ? null : cleanSegment(v.segment));
  const debouncedSegment = useDebouncedValue(segmentKey, 500);
  useEffect(() => {
    audience(JSON.parse(debouncedSegment) ?? {});
  }, [debouncedSegment, audience]);
  const reach = audienceState.data;

  const persist = async () => {
    const result = await save({ id: campaign?.id, ...toBody(v) }).unwrap();
    setDirty(false);
    return result.campaign;
  };

  const onSave = async (event) => {
    event?.preventDefault();
    try {
      const saved = await persist();
      toast.success("Draft saved");
      if (!campaign) navigate(`/campaigns/${saved.id}`, { replace: true });
    } catch {
      // inline or toast
    }
  };

  const onSchedule = async () => {
    try {
      const saved = dirty || !campaign ? await persist() : campaign;
      const result = await schedule({ id: saved.id, broadcast: v.broadcast }).unwrap();
      toast.success(v.broadcast ? "Broadcast sent" : result.message ?? "Campaign scheduled");
      setConfirming(false);
      navigate(`/campaigns/${saved.id}`, { replace: true });
    } catch {
      // toast from the store
    }
  };

  return (
    <form onSubmit={onSave} className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{campaign ? campaign.name : "New campaign"}</h1>
          <p className="text-sm text-muted-foreground">Players who switched off News don't get campaigns. Each player gets it once, never during their night.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Name (only staff see it)" htmlFor="c-name" error={errors.name}>
              <Input id="c-name" required value={v.name} onChange={set("name")} placeholder="Season 2 launch" />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <FormField label="Title (English)" htmlFor="c-title" error={errors.title} hint={`${v.title.length}/100`}>
                  <Input id="c-title" required maxLength={100} value={v.title} onChange={set("title")} placeholder="Season 2 is live 🔥" />
                </FormField>
                <FormField label="Message (English)" htmlFor="c-body" error={errors.body} hint={`${v.body.length}/500. Phones show about 2 lines.`}>
                  <Textarea id="c-body" required rows={3} maxLength={500} value={v.body} onChange={set("body")} placeholder="New rewards, new pass. Jump in" />
                </FormField>
              </div>
              <div className="space-y-4">
                <FormField label="Title (French, optional)" htmlFor="c-title-fr" error={errors.title_fr}>
                  <Input id="c-title-fr" maxLength={100} value={v.title_fr} onChange={set("title_fr")} placeholder="La saison 2 est lancée 🔥" />
                </FormField>
                <FormField label="Message (French, optional)" htmlFor="c-body-fr" error={errors.body_fr} hint="French players get English unless both French fields are filled.">
                  <Textarea id="c-body-fr" rows={3} maxLength={500} value={v.body_fr} onChange={set("body_fr")} />
                </FormField>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Opens" error={errors.screen}>
                <Select value={v.screen} onValueChange={set("screen")}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{SCREENS.map(([s, l]) => <SelectItem key={s} value={s}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Post ID (optional)" htmlFor="c-post" hint="Opens that post instead.">
                <Input id="c-post" type="number" min={1} value={v.post_id} onChange={set("post_id")} />
              </FormField>
              <FormField label="Image link (optional)" htmlFor="c-image" error={errors.image_url}>
                <Input id="c-image" type="url" placeholder="https://…" value={v.image_url} onChange={set("image_url")} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who gets it</CardTitle>
            <CardDescription>Leave everything empty to send to every player.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 p-3 text-sm">
              <span>
                <span className="flex items-center gap-1 font-medium"><Siren className="size-4 text-destructive" /> Urgent broadcast</span>
                <span className="block text-muted-foreground">Every phone with News on, within seconds, even at night. Only for outages and big moments.</span>
              </span>
              <Switch checked={v.broadcast} onCheckedChange={set("broadcast")} />
            </label>
            {!v.broadcast && (
              <>
                <FormField label="Countries"><Chips options={countries.map((c) => [c.id, c.name])} value={v.segment.countries} onChange={setSeg("countries")} /></FormField>
                <FormField label="Language"><Chips options={[["en", "English"], ["fr", "French"]]} value={v.segment.locales} onChange={setSeg("locales")} /></FormField>
                <FormField label="Phone"><Chips options={[["android", "Android"], ["ios", "iPhone"]]} value={v.segment.platforms} onChange={setSeg("platforms")} /></FormField>
                <FormField label="Plays these games"><Chips options={(games?.items ?? []).map((g) => [g.id, g.name])} value={v.segment.games} onChange={setSeg("games")} /></FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Away at least (days)" htmlFor="c-imin"><Input id="c-imin" type="number" min={0} value={v.segment.inactive_days_min} onChange={setSeg("inactive_days_min")} /></FormField>
                  <FormField label="Away at most (days)" htmlFor="c-imax"><Input id="c-imax" type="number" min={0} value={v.segment.inactive_days_max} onChange={setSeg("inactive_days_max")} /></FormField>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {!v.broadcast && (
          <Card>
            <CardHeader><CardTitle className="text-base">When</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Chips options={[["now", "As soon as it's scheduled"], ["at", "At a set time"], ["local", "At a time on each player's clock"]]} value={[v.timing]} onChange={(arr) => set("timing")(arr.filter((x) => x !== v.timing)[0] ?? v.timing)} />
              {v.timing === "at" && <FormField label="Send at (your time)" htmlFor="c-at" error={errors.send_at}><Input id="c-at" type="datetime-local" required value={v.send_at} onChange={set("send_at")} /></FormField>}
              {v.timing === "local" && <FormField label="Send at this time for each player" htmlFor="c-local" error={errors.local_send_at} hint="Like 18:00 in Lagos and 18:00 in Accra."><Input id="c-local" type="datetime-local" required value={v.local_send_at} onChange={set("local_send_at")} /></FormField>}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <PhonePreview title={v.title} body={v.body} image={v.image_url} />
        <Card className="py-0">
          <CardContent className="space-y-1 p-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" /> Audience now</p>
            {audienceState.isLoading || !reach ? <Skeleton className="h-7 w-32" /> : (
              <>
                <p className="text-2xl font-semibold tabular-nums">{formatNumber(reach.reachable)}</p>
                <p className="text-xs text-muted-foreground">with a phone that can get pushes, of {formatNumber(reach.matching)} matching players</p>
              </>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <Button type="submit" variant="outline" disabled={saving.isLoading}>{saving.isLoading && <Loader2 className="animate-spin" />}Save draft</Button>
          <Button type="button" variant="outline" disabled={!campaign || dirty} onClick={() => setTesting(true)} title={!campaign || dirty ? "Save the draft first" : undefined}>
            <Smartphone /> Send a test
          </Button>
          <Button type="button" variant={v.broadcast ? "destructive" : "default"} disabled={!v.name || !v.title || !v.body} onClick={() => setConfirming(true)}>
            <Send /> {v.broadcast ? "Broadcast now" : v.timing === "now" ? "Send" : "Schedule"}
          </Button>
        </div>
      </div>

      <TestDialog open={testing} onOpenChange={setTesting} campaignId={campaign?.id} />
      <BroadcastConfirm
        open={confirming}
        onOpenChange={setConfirming}
        broadcast={v.broadcast}
        reach={reach}
        timing={v.timing}
        busy={scheduling.isLoading || saving.isLoading}
        onConfirm={onSchedule}
      />
    </form>
  );
}

function BroadcastConfirm({ open, onOpenChange, broadcast, reach, timing, busy, onConfirm }) {
  const [typed, setTyped] = useState("");
  if (!broadcast) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={timing === "now" ? "Send this campaign now?" : "Schedule this campaign?"}
        description={`It goes to about ${formatNumber(reach?.reachable ?? 0)} players. You can cancel it until every player has it.`}
        confirmLabel={timing === "now" ? "Send" : "Schedule"}
        busy={busy}
        onConfirm={onConfirm}
      />
    );
  }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); setTyped(""); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Broadcast to everyone now?</DialogTitle>
          <DialogDescription>It reaches every phone with News on within seconds, including players who are asleep. It can't be called back.</DialogDescription>
        </DialogHeader>
        <FormField label="Type BROADCAST to confirm" htmlFor="bc-confirm">
          <Input id="bc-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={busy || typed !== "BROADCAST"} onClick={onConfirm}>{busy && <Loader2 className="animate-spin" />}Broadcast</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TestDialog({ open, onOpenChange, campaignId }) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 300);
  const { data } = useGetPlayersQuery({ search: debounced, sort: "active" }, { skip: !open || debounced.length < 2 });
  const [test, { isLoading }] = useTestCampaignMutation();
  const players = useMemo(() => data?.items ?? [], [data]);

  const send = async (player) => {
    try {
      await test({ id: campaignId, userId: player.id }).unwrap();
      toast.success(`Test sent to ${player.username}'s phone`);
      onOpenChange(false);
    } catch {
      // toast from the store
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a test</DialogTitle>
          <DialogDescription>Goes straight to one player's phone, ignoring quiet hours and the audience. Pick your own test account.</DialogDescription>
        </DialogHeader>
        <Input autoFocus placeholder="Search username or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <ul className="max-h-64 divide-y overflow-y-auto rounded-md border">
          {debounced.length < 2 ? <li className="p-3 text-sm text-muted-foreground">Type at least 2 letters.</li> : players.length === 0 ? <li className="p-3 text-sm text-muted-foreground">No players found.</li> : players.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 p-2">
              <span className="truncate text-sm">{p.username} <span className="text-muted-foreground">{p.email}</span></span>
              <Button size="sm" variant="outline" disabled={isLoading} onClick={() => send(p)}><Bell /> Send</Button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function Results({ campaign }) {
  const [cancel, { isLoading }] = useCancelCampaignMutation();
  const [confirming, setConfirming] = useState(false);
  const s = campaign.stats ?? {};
  const live = ["scheduled", "sending"].includes(campaign.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            {campaign.name} <StatusBadge status={campaign.status} tone={{ scheduled: "warn", sending: "good", sent: "good", cancelled: "bad" }[campaign.status]} />
            {campaign.broadcast && <Badge variant="destructive">Broadcast</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">
            {campaign.started_at ? `Started ${formatDate(campaign.started_at, true)}` : campaign.local_send_at ? `Sends at ${campaign.local_send_at} on each player's clock` : campaign.send_at ? `Sends ${formatDate(campaign.send_at, true)}` : "Sending soon"}
            {campaign.finished_at ? ` · finished ${formatDate(campaign.finished_at, true)}` : ""}
          </p>
        </div>
        {live && <Button variant="outline" onClick={() => setConfirming(true)}><XCircle /> Stop sending</Button>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Targeted" value={formatNumber(s.targeted)} hint="Reachable players when it was scheduled" />
        <StatCard label="Delivered" value={s.broadcast ? "—" : formatNumber(s.sent)} hint={s.broadcast ? "Firebase doesn't report topic deliveries" : undefined} />
        <StatCard label="Opened" value={formatNumber(s.opened)} />
        <StatCard label="Open rate" value={s.open_rate != null ? `${s.open_rate}%` : "—"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <PhonePreview title={campaign.title} body={campaign.body} image={campaign.image_url} />
        {campaign.title_fr && <PhonePreview title={campaign.title_fr} body={campaign.body_fr} image={campaign.image_url} />}
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Stop this campaign?"
        description="Players who already got it keep it; nobody else will."
        confirmLabel="Stop sending"
        destructive
        busy={isLoading}
        onConfirm={async () => {
          try {
            await cancel(campaign.id).unwrap();
            toast.success("Campaign stopped");
            setConfirming(false);
          } catch {
            // toast from the store
          }
        }}
      />
    </div>
  );
}
