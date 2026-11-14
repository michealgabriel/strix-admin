import { useState } from "react";
import { Loader2, Plus, RotateCcw, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import { errorMessage } from "@/lib/api";
import { useGetEconomySettingsQuery, useSaveEconomySettingsMutation } from "./economyApi";

// Each setting, grouped the way staff think about them. type: int (default), range [min, max], or table (days → Gold)
const SECTIONS = [
  {
    title: "Rewarded ads",
    fields: [
      { key: "ad_gold_per_ad", label: "Gold per ad" },
      { key: "ad_max_per_day", label: "Ads a player can watch a day" },
    ],
  },
  {
    title: "Daily streak",
    fields: [
      { key: "streak_milestones", label: "Milestone rewards", type: "table", unit: "day streak" },
      { key: "streak_freeze_price", label: "Streak freeze price (Gold)" },
      { key: "streak_max_freezes", label: "Freezes a player can hold" },
    ],
  },
  {
    title: "Invites",
    description: "Paid when the invited player verifies their account.",
    fields: [
      { key: "referral_inviter_gold", label: "Gold for the inviter" },
      { key: "referral_new_player_gold", label: "Gold for the new player" },
      { key: "referral_monthly_cap", label: "Paid invites per inviter each month" },
    ],
  },
  {
    title: "Welcome back",
    description: "A gift for players who return after time away. The longest absence that applies wins.",
    fields: [
      { key: "welcome_back_gifts", label: "Gift by days away", type: "table", unit: "days away" },
      { key: "welcome_back_every_days", label: "At most once every (days)" },
    ],
  },
  {
    title: "Chests",
    description:
      "Amounts are picked at random between the two numbers. Keep the legendary chest's largest Gold below its price on Sale Items, so a chest never gives back more than it costs.",
    fields: [
      { key: "common_chest_gold", label: "Common chest Gold", type: "range" },
      { key: "common_chest_xp", label: "Common chest XP", type: "range" },
      { key: "legendary_chest_gold", label: "Legendary chest Gold", type: "range" },
      { key: "legendary_chest_xp", label: "Legendary chest XP", type: "range" },
      { key: "legendary_chest_daily_limit", label: "Legendary chests a player can open a day (0 = no limit)" },
    ],
  },
  {
    title: "Tournaments",
    fields: [{ key: "tournament_host_share_percent", label: "Host's share of entry fees (%). The rest leaves the economy." }],
  },
  {
    title: "Game currency",
    description: "Real game currency from the legendary chest costs Strix money. These limits decide who can win it.",
    fields: [
      { key: "game_currency_monthly_limit", label: "Rewards across Strix each month (0 pauses them)" },
      { key: "game_currency_cooldown_days", label: "Days between wins, per player and per phone" },
      { key: "game_currency_min_account_days", label: "Minimum account age (days)" },
      { key: "game_currency_purchase_within_days", label: "Must have paid real money within (days, 0 = not needed)" },
    ],
  },
];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const tableRows = (value) =>
  Object.entries(value ?? {})
    .map(([days, gold]) => ({ days: String(days), gold: String(gold) }))
    .sort((a, b) => Number(a.days) - Number(b.days));

// What the form holds → what the server takes
function toValue(field, draft) {
  if (field.type === "range") return draft.map((n) => Number(n));
  if (field.type === "table") return Object.fromEntries(draft.filter((row) => row.days !== "").map((row) => [String(Number(row.days)), Number(row.gold)]));
  return Number(draft);
}
function toDraft(field, value) {
  if (field.type === "range") return value.map(String);
  if (field.type === "table") return tableRows(value);
  return String(value);
}

export default function EconomySettings() {
  const { data, isLoading, error, refetch } = useGetEconomySettingsQuery();

  if (error) {
    return (
      <EmptyState icon={Settings2} title="Couldn't load the settings" description={errorMessage(error)}>
        <Button variant="outline" size="sm" onClick={refetch}>
          Try again
        </Button>
      </EmptyState>
    );
  }
  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  return <SettingsForm key={JSON.stringify(data.settings)} settings={data.settings} defaults={data.defaults} />;
}

function SettingsForm({ settings, defaults }) {
  const fields = SECTIONS.flatMap((section) => section.fields);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(fields.map((f) => [f.key, toDraft(f, settings[f.key])])));
  const [save, { isLoading, error }] = useSaveEconomySettingsMutation();
  const errors = error?.data?.errors ?? {};

  const changed = Object.fromEntries(
    fields.map((f) => [f.key, toValue(f, drafts[f.key])]).filter(([key, value]) => !same(value, settings[key])),
  );
  const changedCount = Object.keys(changed).length;
  const set = (key, draft) => setDrafts((all) => ({ ...all, [key]: draft }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      await save(changed).unwrap();
      toast.success(changedCount === 1 ? "1 setting saved" : `${changedCount} settings saved`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Changes apply to players straight away. Prices of Gold packs and chests are on Sale Items; Daily Strix, missions and the
        Strix Pass have their own pages.
      </p>
      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
            {section.description && <CardDescription>{section.description}</CardDescription>}
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            {section.fields.map((field) => (
              <Field
                key={field.key}
                field={field}
                draft={drafts[field.key]}
                fallback={defaults[field.key]}
                error={errors[field.key]?.[0]}
                onChange={(draft) => set(field.key, draft)}
              />
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-background/95 py-3 backdrop-blur">
        <span className="text-sm text-muted-foreground">{changedCount ? `${changedCount} unsaved change${changedCount > 1 ? "s" : ""}` : "No changes"}</span>
        <Button type="submit" disabled={!changedCount || isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

function Field({ field, draft, fallback, error, onChange }) {
  const id = `econ-${field.key}`;
  const isDefault = same(toValue(field, draft), fallback);
  const defaultText = field.type === "range" ? `${fallback[0]}–${fallback[1]}` : field.type === "table" ? tableRows(fallback).map((r) => `${r.days}: ${r.gold}`).join(", ") : fallback;

  return (
    <div className={field.type === "table" ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "range" ? (
        <div className="flex items-center gap-2">
          <Input id={id} type="number" min="0" aria-label={`${field.label} from`} value={draft[0]} onChange={(e) => onChange([e.target.value, draft[1]])} />
          <span className="text-muted-foreground">to</span>
          <Input type="number" min="0" aria-label={`${field.label} to`} value={draft[1]} onChange={(e) => onChange([draft[0], e.target.value])} />
        </div>
      ) : field.type === "table" ? (
        <TableEditor id={id} rows={draft} unit={field.unit} onChange={onChange} />
      ) : (
        <Input id={id} type="number" min="0" value={draft} onChange={(e) => onChange(e.target.value)} />
      )}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        !isDefault && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            Default {defaultText}
            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onChange(toDraft(field, fallback))}>
              <RotateCcw className="size-3" /> Use default
            </Button>
          </p>
        )
      )}
    </div>
  );
}

function TableEditor({ id, rows, unit, onChange }) {
  const update = (index, key, value) => onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  return (
    <div id={id} className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input type="number" min="1" className="w-28" aria-label={`Row ${index + 1} ${unit}`} value={row.days} onChange={(e) => update(index, "days", e.target.value)} />
          <span className="w-24 text-sm text-muted-foreground">{unit}</span>
          <Input type="number" min="0" className="w-28" aria-label={`Row ${index + 1} Gold`} value={row.gold} onChange={(e) => update(index, "gold", e.target.value)} />
          <span className="text-sm text-muted-foreground">Gold</span>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove row ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { days: "", gold: "" }])}>
        <Plus /> Add a row
      </Button>
    </div>
  );
}
