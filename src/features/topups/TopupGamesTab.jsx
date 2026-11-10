import { useMemo, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import FormField from "@/components/common/FormField";
import ImageUpload from "@/components/common/ImageUpload";
import Pagination from "@/components/common/Pagination";
import { Can } from "@/features/auth/permissions";
import { useGetCountriesQuery } from "@/features/settings/settingsApi";
import { errorMessage, fieldErrors } from "@/lib/api";
import { Wallet } from "lucide-react";
import { useGetTopupGamesQuery, useSaveTopupGameMutation } from "./topupsApi";

// The API stores one row per (currency, amount, country). Rebuild the nested shape the form edits.
function toCurrencies(game) {
  const types = new Map();
  for (const row of game?.currency_types ?? []) {
    if (!types.has(row.type_index)) types.set(row.type_index, { title: row.title, coverUrl: row.cover_image, cover: null, original: types.size, values: new Map() });
    const type = types.get(row.type_index);
    if (!type.values.has(row.quantity_text)) type.values.set(row.quantity_text, {});
    type.values.get(row.quantity_text)[row.country_id] = String(row.price);
  }
  return [...types.values()].map((t) => ({ ...t, values: [...t.values.entries()].map(([value, prices]) => ({ value, prices })) }));
}

export default function TopupGamesTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useGetTopupGamesQuery({ page });
  const [editing, setEditing] = useState(null);

  if (error) {
    return (
      <EmptyState icon={Wallet} title="Couldn't load top-up games" description={errorMessage(error)}>
        <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex">
        <p className="text-sm text-muted-foreground">Games players can buy in-game currency for, with a price per country.</p>
        <Can permission="create_game_topups">
          <Button className="ml-auto" onClick={() => setEditing({})}><Plus /> Add top-up game</Button>
        </Can>
      </div>
      {!isLoading && data.items.length === 0 ? <EmptyState icon={Wallet} title="No top-up games yet" /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-48 rounded-xl" />) : data.items.map((game) => {
            const currencies = toCurrencies(game);
            return (
              <Card key={game.id} className="gap-0 overflow-hidden py-0">
                <img src={game.cover_image} alt="" className="aspect-video w-full bg-muted object-cover" />
                <div className="space-y-2 p-4">
                  <p className="font-medium">{game.name}</p>
                  <p className="text-sm text-muted-foreground">{currencies.map((c) => `${c.title} (${c.values.length})`).join(" · ")}</p>
                  <div className="flex flex-wrap gap-1">
                    {(game.availability_countries ?? []).map((a) => <Badge key={a.id} variant="secondary">{a.country?.name}</Badge>)}
                  </div>
                  <Can permission="create_game_topups">
                    <Button variant="outline" size="sm" onClick={() => setEditing(game)}><Pencil /> Edit</Button>
                  </Can>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total} onPageChange={setPage} />
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
          {editing && <TopupGameForm key={editing.id ?? "new"} game={editing.id ? editing : null} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TopupGameForm({ game, onDone }) {
  const { data: allCountries = [] } = useGetCountriesQuery();
  const countries = useMemo(() => allCountries.filter((c) => c.status === "active"), [allCountries]);
  const [values, setValues] = useState({ name: game?.name ?? "", currencies_title: game?.currencies_title ?? "", cover_image: null, finding_id_gif: null });
  const [currencies, setCurrencies] = useState(() => (game ? toCurrencies(game) : [{ title: "", cover: null, coverUrl: null, original: null, values: [{ value: "", prices: {} }] }]));
  const [save, { isLoading, error }] = useSaveTopupGameMutation();
  const errors = fieldErrors(error);

  const setCurrency = (i, changes) => setCurrencies(currencies.map((c, j) => (j === i ? { ...c, ...changes } : c)));
  const setValue = (i, v, changes) => setCurrency(i, { values: currencies[i].values.map((row, k) => (k === v ? { ...row, ...changes } : row)) });

  // The backend reuses an unchanged picture by position, so a currency that moved needs its picture again
  const needsCover = (c, i) => !c.cover && (!game || c.original !== i);
  const missingCover = currencies.some(needsCover);

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData();
    form.append("name", values.name.trim());
    form.append("currencies_title", values.currencies_title.trim());
    if (values.cover_image) form.append("cover_image", values.cover_image);
    if (values.finding_id_gif) form.append("finding_id_gif", values.finding_id_gif);
    const currency_types = currencies.map((c, i) => {
      let currency_cover = null;
      if (c.cover) {
        currency_cover = `currency_cover_${i}`;
        form.append(currency_cover, c.cover);
      }
      return {
        currency_title: c.title.trim(),
        ...(currency_cover ? { currency_cover } : {}),
        values_and_country_prices: c.values.map((row) => ({
          value: row.value.trim(),
          country_prices: Object.entries(row.prices).filter(([, price]) => price !== "" && price != null).map(([country_id, price]) => ({ country_id: Number(country_id), price: Number(price) })),
        })),
      };
    });
    form.append("currency_types_json", JSON.stringify({ currency_types }));
    try {
      await save({ id: game?.id, formData: form }).unwrap();
      toast.success(game ? "Top-up game updated" : "Top-up game added");
      onDone();
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{game ? `Edit ${game.name}` : "Add a top-up game"}</DialogTitle>
        <DialogDescription>Leave a country's price empty to not sell that amount there. A game is offered in every country that has at least one price.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Game name" htmlFor="tg-name" error={errors.name}>
          <Input id="tg-name" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="COD Mobile" />
        </FormField>
        <FormField label="What the currency is called" htmlFor="tg-ct" error={errors.currencies_title}>
          <Input id="tg-ct" required value={values.currencies_title} onChange={(e) => setValues({ ...values, currencies_title: e.target.value })} placeholder="COD Points" />
        </FormField>
        <FormField label="Cover image" error={errors.cover_image}>
          <ImageUpload value={values.cover_image} onChange={(f) => setValues({ ...values, cover_image: f })} currentUrl={game?.cover_image} />
        </FormField>
        <FormField label="How to find your gamer ID (GIF)" error={errors.finding_id_gif}>
          <ImageUpload value={values.finding_id_gif} onChange={(f) => setValues({ ...values, finding_id_gif: f })} currentUrl={game?.finding_id_gif} accept="image/gif" />
        </FormField>
      </div>

      {currencies.map((c, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-end gap-3">
            <label className="flex size-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/40" title="Currency picture">
              {c.cover ? <img src={URL.createObjectURL(c.cover)} alt="" className="size-full object-cover" /> : c.coverUrl && !needsCover(c, i) ? <img src={c.coverUrl} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5 text-muted-foreground" />}
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => setCurrency(i, { cover: e.target.files?.[0] ?? null })} />
            </label>
            <FormField label={`Currency ${i + 1}`} htmlFor={`cur-${i}`} className="flex-1" error={errors[`currency_types.${i}.currency_title`]}>
              <Input id={`cur-${i}`} required value={c.title} onChange={(e) => setCurrency(i, { title: e.target.value })} placeholder="COD Points" />
            </FormField>
            {currencies.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remove currency ${i + 1}`} onClick={() => setCurrencies(currencies.filter((_, j) => j !== i))}><Trash2 /></Button>}
          </div>
          {needsCover(c, i) && <p className="text-xs text-destructive">Choose a picture for this currency.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-1 font-medium">Amount</th>
                  {countries.map((country) => <th key={country.id} className="pb-1 pl-2 font-medium">{country.name} ({country.symbol})</th>)}
                  <th />
                </tr>
              </thead>
              <tbody>
                {c.values.map((row, v) => (
                  <tr key={v}>
                    <td className="py-1"><Input required aria-label="Amount" value={row.value} onChange={(e) => setValue(i, v, { value: e.target.value })} placeholder="80CP" className="w-28" /></td>
                    {countries.map((country) => (
                      <td key={country.id} className="py-1 pl-2">
                        <Input type="number" min={0} step="any" aria-label={`Price in ${country.name}`} value={row.prices[country.id] ?? ""} onChange={(e) => setValue(i, v, { prices: { ...row.prices, [country.id]: e.target.value } })} className="w-28" />
                      </td>
                    ))}
                    <td className="py-1 pl-2">{c.values.length > 1 && <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove amount" onClick={() => setCurrency(i, { values: c.values.filter((_, k) => k !== v) })}><Trash2 /></Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setCurrency(i, { values: [...c.values, { value: "", prices: {} }] })}><Plus /> Add amount</Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => setCurrencies([...currencies, { title: "", cover: null, coverUrl: null, original: null, values: [{ value: "", prices: {} }] }])}><Plus /> Add currency</Button>
      {errors.currency_types && <p className="text-sm text-destructive">{errors.currency_types}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading || missingCover || (!game && (!values.cover_image || !values.finding_id_gif))}>
          {isLoading && <Loader2 className="animate-spin" />}
          {game ? "Save" : "Add game"}
        </Button>
      </DialogFooter>
    </form>
  );
}
