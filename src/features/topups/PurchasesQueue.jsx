import { useState } from "react";
import { Link } from "react-router";
import { Check, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DataTable from "@/components/common/DataTable";
import FormField from "@/components/common/FormField";
import SearchInput from "@/components/common/SearchInput";
import StatusBadge from "@/components/common/StatusBadge";
import { useCan } from "@/features/auth/useCan";
import { useListParams } from "@/hooks/useListParams";
import { formatDate, formatMoney } from "@/lib/format";
import { useDecideTopupMutation, useGetTopupPurchasesQuery } from "./topupsApi";

// kind: "purchases" (paid top-ups) or "claims" (game currency won in chests)
export default function PurchasesQueue({ kind }) {
  const list = useListParams();
  const status = list.get("status") || "pending";
  const search = list.get("q");
  const { data, isLoading, isFetching, error, refetch } = useGetTopupPurchasesQuery({ page: list.page, status, kind, search });
  const canProcess = useCan("process_topup_purchases");
  const [deciding, setDeciding] = useState(null); // { purchase, approve }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Gamer ID copied");
    } catch {
      // clipboard blocked
    }
  };

  const columns = [
    {
      key: "item",
      header: "Deliver",
      cell: (p) => (
        <div className="min-w-0">
          <p className="font-medium">{p.quantity_text} {p.topup_item_title}</p>
          <p className="text-sm text-muted-foreground">{p.topup_game_name}{p.country ? ` · ${p.country.name}` : ""}</p>
        </div>
      ),
    },
    {
      key: "gamer",
      header: "To gamer ID",
      cell: (p) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); copy(p.topup_player_gamerid); }} className="flex items-center gap-1 font-mono text-sm hover:text-primary" title="Copy">
          {p.topup_player_gamerid} <Copy className="size-3.5" />
        </button>
      ),
    },
    { key: "player", header: "Player", cell: (p) => (p.user ? <Link className="hover:underline" to={`/players/${p.user.id}`}>{p.user.username}</Link> : "—") },
    ...(kind === "purchases"
      ? [{ key: "paid", header: "Paid", className: "tabular-nums", cell: (p) => `${formatMoney(p.amount_paid, p.country?.currency ?? "USD")} · ${p.payment_channel}` }]
      : []),
    { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.approval_status} /> },
    { key: "when", header: "Requested", cell: (p) => formatDate(p.created_at, true) },
    ...(canProcess && status === "pending"
      ? [{
          key: "actions",
          header: <span className="sr-only">Actions</span>,
          className: "text-right",
          cell: (p) => (
            <div className="flex justify-end gap-1">
              <Button size="sm" onClick={() => setDeciding({ purchase: p, approve: true })}><Check /> Delivered</Button>
              <Button size="sm" variant="ghost" onClick={() => setDeciding({ purchase: p, approve: false })}><X /> Decline</Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        emptyTitle={status === "pending" ? "Nothing waiting" : "Nothing here"}
        emptyDescription={status === "pending" ? (kind === "claims" ? "Game currency players claim from chests shows up here." : "Paid top-ups waiting for delivery show up here, oldest first.") : undefined}
        pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
        toolbar={
          <>
            <SearchInput value={search} onChange={(q) => list.set({ q })} placeholder="Gamer ID, game or player" />
            <div className="flex gap-1">
              {[["pending", "Waiting"], ["approved", "Delivered"], ["rejected", "Declined"], ["all", "All"]].map(([value, label]) => (
                <Button key={value} size="sm" variant={status === value ? "secondary" : "ghost"} onClick={() => list.set({ status: value === "pending" ? "" : value })}>{label}</Button>
              ))}
            </div>
          </>
        }
      />
      <Dialog open={!!deciding} onOpenChange={(open) => !open && setDeciding(null)}>
        <DialogContent className="sm:max-w-md">{deciding && <Decision {...deciding} kind={kind} onDone={() => setDeciding(null)} />}</DialogContent>
      </Dialog>
    </>
  );
}

function Decision({ purchase, approve, kind, onDone }) {
  const [message, setMessage] = useState("");
  const [decide, { isLoading }] = useDecideTopupMutation();

  const submit = async (event) => {
    event.preventDefault();
    try {
      await decide({ id: purchase.id, approve, message: message.trim() }).unwrap();
      toast.success(approve ? "Marked as delivered. The player has been told." : "Declined. The player has been told.");
      onDone();
    } catch {
      // toast from the store
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{approve ? "Mark as delivered?" : "Decline this request?"}</DialogTitle>
        <DialogDescription>
          {purchase.quantity_text} {purchase.topup_item_title} for {purchase.topup_game_name} to gamer ID <span className="font-mono">{purchase.topup_player_gamerid}</span>.{" "}
          {approve
            ? "Only confirm once the currency is in their game account."
            : kind === "claims"
              ? "The player can claim the reward again with a corrected gamer ID."
              : "The player's payment is refunded."}
        </DialogDescription>
      </DialogHeader>
      <FormField label={approve ? "Note to the player (optional)" : "Reason, shown to the player"} htmlFor="topup-msg">
        <Textarea id="topup-msg" rows={3} required={!approve} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={approve ? "" : "That gamer ID doesn't exist in COD Mobile."} />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>Cancel</Button>
        <Button type="submit" variant={approve ? "default" : "destructive"} disabled={isLoading || (!approve && !message.trim())}>
          {isLoading && <Loader2 className="animate-spin" />}
          {approve ? "Mark delivered" : "Decline"}
        </Button>
      </DialogFooter>
    </form>
  );
}
