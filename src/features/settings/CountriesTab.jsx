import { useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTable from "@/components/common/DataTable";
import FormField from "@/components/common/FormField";
import StatusBadge from "@/components/common/StatusBadge";
import { useCan } from "@/features/auth/useCan";
import { fieldErrors } from "@/lib/api";
import { useGetCountriesQuery, useSaveCountryMutation } from "./settingsApi";

export default function CountriesTab() {
  const { data = [], isLoading, isFetching, error, refetch } = useGetCountriesQuery();
  const canManage = useCan("manage_system_countries");
  const [editing, setEditing] = useState(null);
  const base = data.find((country) => country.is_base);

  const columns = [
    {
      key: "name",
      header: "Country",
      cell: (c) => (
        <span className="font-medium">
          {c.name} {c.is_base && <Badge variant="secondary" className="ml-1">Base</Badge>}
        </span>
      ),
    },
    { key: "currency", header: "Currency", cell: (c) => `${c.currency} (${c.symbol})` },
    {
      key: "rate",
      header: "Rate",
      cell: (c) => (c.is_base ? "—" : `1 ${base?.currency ?? "base"} = ${c.rate_per_base} ${c.currency}`),
    },
    { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
    ...(canManage
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            className: "w-12 text-right",
            cell: (c) => (
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}>
                <Pencil />
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={data}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        emptyTitle="No countries yet"
        toolbar={
          <>
            <p className="text-sm text-muted-foreground">
              Countries set the currency and exchange rate for game top-up prices.
            </p>
            {canManage && (
              <Button className="sm:ml-auto" onClick={() => setEditing({})}>
                <Plus /> Add country
              </Button>
            )}
          </>
        }
      />
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing && <CountryForm key={editing.id ?? "new"} country={editing} base={base} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CountryForm({ country, base, onDone }) {
  const [values, setValues] = useState({
    name: country.name ?? "",
    currency: country.currency ?? "",
    symbol: country.symbol ?? "",
    rate_per_base: country.rate_per_base ?? "",
    status: country.status ?? "active",
  });
  const [save, { isLoading, error }] = useSaveCountryMutation();
  const errors = fieldErrors(error);
  const set = (key) => (e) => setValues({ ...values, [key]: e?.target ? e.target.value : e });

  const submit = async (event) => {
    event.preventDefault();
    try {
      await save({ id: country.id, ...values, currency: values.currency.trim().toUpperCase() }).unwrap();
      toast.success(country.id ? "Country updated" : "Country added");
      onDone();
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{country.id ? `Edit ${country.name}` : "Add a country"}</DialogTitle>
        <DialogDescription>Players in this country see top-up prices in its currency.</DialogDescription>
      </DialogHeader>
      <FormField label="Country name" htmlFor="c-name" error={errors.name}>
        <Input id="c-name" required value={values.name} onChange={set("name")} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Currency code" htmlFor="c-currency" error={errors.currency}>
          <Input id="c-currency" required maxLength={3} placeholder="NGN" value={values.currency} onChange={set("currency")} />
        </FormField>
        <FormField label="Symbol" htmlFor="c-symbol" error={errors.symbol}>
          <Input id="c-symbol" required placeholder="₦" value={values.symbol} onChange={set("symbol")} />
        </FormField>
      </div>
      <FormField
        label={`Rate per 1 ${base?.currency ?? "base currency"}`}
        htmlFor="c-rate"
        error={errors.rate_per_base}
        hint={country.is_base ? "This is the base currency, so its rate stays 1." : undefined}
      >
        <Input
          id="c-rate"
          type="number"
          step="any"
          min="0"
          required
          disabled={country.is_base}
          value={values.rate_per_base}
          onChange={set("rate_per_base")}
        />
      </FormField>
      <FormField label="Status" error={errors.status}>
        <Select value={values.status} onValueChange={set("status")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
