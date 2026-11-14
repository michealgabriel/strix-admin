import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/common/PageHeader";
import { useCan } from "@/features/auth/useCan";
import { fieldErrors } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useGetCountriesQuery } from "@/features/settings/settingsApi";
import { localPrice, worseValuePacks } from "./localPrice";
import { useGetChestsQuery, useGetGoldPacksQuery, useSaveChestsMutation, useSaveGoldPacksMutation } from "./shopApi";

export default function SaleItemsPage() {
  return (
    <>
      <PageHeader title="Sale Items" description="What players can buy in the shop: Strix Gold packs for money, and chests for gold." />
      <div className="grid gap-6 xl:grid-cols-2">
        <GoldPacks />
        <Chests />
      </div>
    </>
  );
}

function GoldPacks() {
  const { data: packs = [], isLoading } = useGetGoldPacksQuery();
  const canEdit = useCan("edit_shop_sale_items");
  const [draft, setDraft] = useState({});
  const [save, { isLoading: saving, error }] = useSaveGoldPacksMutation();
  const errors = fieldErrors(error);
  const value = (pack, key) => draft[pack.id]?.[key] ?? pack[key];
  const { data: countries = [] } = useGetCountriesQuery();
  const priced = countries.filter((c) => !c.is_base && c.status === "active");
  // Worked out from what's typed, so a price change shows its effect before saving
  const current = packs.map((pack) => ({ ...pack, strixgold_quantity: Number(value(pack, "strixgold_quantity")), price_in_dollars: Number(value(pack, "price_in_dollars")) }));
  const worse = worseValuePacks(current);
  const change = (pack, key, v) => setDraft({ ...draft, [pack.id]: { ...draft[pack.id], [key]: v } });

  const submit = async (event) => {
    event.preventDefault();
    const data = Object.entries(draft).map(([id, changes]) => ({
      id: Number(id),
      ...(changes.strixgold_quantity != null && { strixgold_quantity: Number(changes.strixgold_quantity) }),
      ...(changes.price_in_dollars != null && { price_in_dollars: Number(changes.price_in_dollars) }),
    }));
    try {
      await save(data).unwrap();
      toast.success("Gold packs updated");
      setDraft({});
    } catch {
      // inline or toast
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strix Gold packs</CardTitle>
        <CardDescription>
          In the Play Store build, the price players pay is the one set on the product in Play Console. Keep the dollar price here the same.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48" /> : (
          <form onSubmit={submit} className="space-y-3">
            {packs.map((pack, index) => (
              <div key={pack.id} className="grid grid-cols-[2rem_1fr_1fr] items-end gap-3 rounded-lg border p-3">
                <img src={pack.claimable_item?.image} alt="" className="mb-1 size-8 object-contain" />
                <label className="space-y-1 text-xs text-muted-foreground">Gold
                  <Input type="number" min={1} disabled={!canEdit} value={value(pack, "strixgold_quantity")} onChange={(e) => change(pack, "strixgold_quantity", e.target.value)} aria-invalid={!!errors[`data.${index}.strixgold_quantity`]} />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">Price (USD)
                  <Input type="number" min={0.01} step={0.01} disabled={!canEdit} value={value(pack, "price_in_dollars")} onChange={(e) => change(pack, "price_in_dollars", e.target.value)} />
                </label>
                <div className="col-span-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                  <span className={worse.has(pack.id) ? "font-medium text-destructive" : undefined}>
                    {formatNumber(Math.round(current[index].strixgold_quantity / current[index].price_in_dollars))} Gold per $1
                    {worse.has(pack.id) && " (less than a cheaper pack)"}
                  </span>
                  {priced.map((country) => (
                    <span key={country.id}>
                      {country.name}: {country.symbol}
                      {localPrice(current[index].price_in_dollars, country).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  ))}
                </div>
                <p className="col-span-3 text-xs text-muted-foreground">
                  Store product: <code>{pack.android_product_id ?? "none"}</code>
                  {pack.ios_product_id ? <> · iOS <code>{pack.ios_product_id}</code></> : null}
                </p>
              </div>
            ))}
            {canEdit && (
              <div className="flex gap-2">
                <Button type="submit" disabled={saving || Object.keys(draft).length === 0}>{saving && <Loader2 className="animate-spin" />}Save gold packs</Button>
                {Object.keys(draft).length > 0 && <Button type="button" variant="ghost" onClick={() => setDraft({})}><RotateCcw /> Discard</Button>}
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function Chests() {
  const { data: chests = [], isLoading } = useGetChestsQuery();
  const canEdit = useCan("edit_shop_sale_items");
  const [draft, setDraft] = useState({});
  const [save, { isLoading: saving }] = useSaveChestsMutation();

  const submit = async (event) => {
    event.preventDefault();
    try {
      await save(Object.entries(draft).map(([id, price]) => ({ id: Number(id), price_in_strixgold: Number(price) }))).unwrap();
      toast.success("Chest prices updated");
      setDraft({});
    } catch {
      // toast from the store
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chests</CardTitle>
        <CardDescription>Players buy chests with Strix Gold. The free daily chest stays free.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-48" /> : (
          <form onSubmit={submit} className="space-y-3">
            {chests.map((chest) => {
              const free = chest.id === 1;
              return (
                <div key={chest.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <img src={chest.claimable_item?.image} alt="" className="size-10 object-contain" />
                    <div className="flex-1">
                      <p className="font-medium">{chest.claimable_item?.name}</p>
                      {chest.daily_limit && <p className="text-xs text-muted-foreground">{chest.daily_limit} per day</p>}
                    </div>
                    {free ? <Badge variant="secondary">Free</Badge> : (
                      <label className="w-32 space-y-1 text-xs text-muted-foreground">Price (gold)
                        <Input type="number" min={0} disabled={!canEdit} value={draft[chest.id] ?? chest.price_in_strixgold} onChange={(e) => setDraft({ ...draft, [chest.id]: e.target.value })} />
                      </label>
                    )}
                  </div>
                  {!free && maxGold(chest) >= Number(draft[chest.id] ?? chest.price_in_strixgold) && (
                    <p className="text-xs font-medium text-destructive">
                      This chest can give back {formatNumber(maxGold(chest))} Gold, more than it costs. Raise the price, or lower its Gold on the Economy page.
                    </p>
                  )}
                  {chest.odds && (
                    <div className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                      {chest.odds.outcomes?.map((o, i) => (
                        <p key={i}>{o.chance_percent}%: {o.rewards.map((r) => `${formatNumber(r.min)}–${formatNumber(r.max)} ${r.type === "strixgold" ? "gold" : "XP"}`).join(" + ")}</p>
                      ))}
                      {chest.odds.note && <p className="pt-1">{chest.odds.note}</p>}
                    </div>
                  )}
                </div>
              );
            })}
            {canEdit && (
              <div className="flex gap-2">
                <Button type="submit" disabled={saving || Object.keys(draft).length === 0}>{saving && <Loader2 className="animate-spin" />}Save chest prices</Button>
                {Object.keys(draft).length > 0 && <Button type="button" variant="ghost" onClick={() => setDraft({})}><RotateCcw /> Discard</Button>}
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// The most Gold a chest can give in any outcome
function maxGold(chest) {
  const amounts = (chest.odds?.outcomes ?? []).flatMap((o) => o.rewards.filter((r) => r.type === "strixgold").map((r) => r.max));
  return amounts.length ? Math.max(...amounts) : 0;
}
