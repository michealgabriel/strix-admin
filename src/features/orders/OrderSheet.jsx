import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import FormField from "@/components/common/FormField";
import StatusBadge from "@/components/common/StatusBadge";
import { useCan } from "@/features/auth/useCan";
import { formatDate, formatMoney } from "@/lib/format";
import { ORDER_STATUSES, useGetOrderQuery, useOrderActionMutation } from "./ordersApi";

const statusLabel = (status) => ORDER_STATUSES.find(([v]) => v === status)?.[1] ?? status;

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-all">{children ?? "—"}</dd>
    </div>
  );
}

export default function OrderSheet({ id, onOpenChange }) {
  return (
    <Sheet open={!!id} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{id && <OrderDetail id={id} />}</SheetContent>
    </Sheet>
  );
}

function OrderDetail({ id }) {
  const { data: order, isLoading } = useGetOrderQuery(id);
  const canManage = useCan("manage_orders");
  const [act, { isLoading: busy }] = useOrderActionMutation();
  const [confirm, setConfirm] = useState(null); // "sync" | "refund" | "mark-refunded"
  const [note, setNote] = useState("");

  if (isLoading) return <div className="p-6"><Skeleton className="h-64" /></div>;

  const run = async (action) => {
    try {
      const result = await act({ id, action, note: action === "mark-refunded" ? note.trim() : undefined }).unwrap();
      toast.success(result.message);
      setConfirm(null);
      setNote("");
    } catch {
      // toast from the store
    }
  };

  const flutterwave = order.provider === "flutterwave";
  const canSync = canManage && flutterwave && ["pending", "expired"].includes(order.status);
  const needsRefund = canManage && order.status === "refund_pending";

  return (
    <>
      <SheetHeader>
        <SheetTitle>Order #{order.id}</SheetTitle>
        <SheetDescription>{order.item_title}</SheetDescription>
      </SheetHeader>
      <div className="space-y-6 px-4 pb-6">
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status}>{statusLabel(order.status)}</StatusBadge>
          <span className="text-sm text-muted-foreground">{order.amount != null ? formatMoney(order.amount, order.currency) : "Price set by the store"}</span>
        </div>

        {(canSync || needsRefund) && (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
            {canSync && (
              <>
                <p className="text-sm">The player may have paid without the payment reaching us. Ask Flutterwave again.</p>
                <Button size="sm" disabled={busy} onClick={() => run("sync")}>{busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Re-check payment</Button>
              </>
            )}
            {needsRefund && (
              <>
                <p className="text-sm">Money arrived for something that couldn't be delivered, and the automatic refund didn't go through.</p>
                <div className="flex flex-wrap gap-2">
                  {flutterwave && <Button size="sm" disabled={busy} onClick={() => setConfirm("refund")}><RotateCcw /> Try the refund again</Button>}
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm("mark-refunded")}><CheckCircle2 /> I refunded it by hand</Button>
                </div>
              </>
            )}
          </div>
        )}

        <dl className="divide-y">
          <Row label="Player">{order.user ? <Link className="text-primary hover:underline" to={`/players/${order.user.id}`}>{order.user.username}</Link> : null}</Row>
          <Row label="Email">{order.user?.email}</Row>
          <Row label="Paid with">{order.provider === "google_play" ? "Google Play" : "Flutterwave"}</Row>
          <Row label="Our reference">{order.provider === "flutterwave" ? <code className="text-xs">{order.provider_ref}</code> : "Hidden (store purchase token)"}</Row>
          <Row label="Provider transaction">{order.transaction_id}</Row>
          {order.topup_player_gamerid && <Row label="Gamer ID">{order.topup_player_gamerid}</Row>}
          {order.topup_purchase && <Row label="Top-up delivery">{order.topup_purchase.approval_status}</Row>}
          {order.decline_reason && <Row label="Declined because">{order.decline_reason}</Row>}
          {order.manual_refund && <Row label="Refunded by hand">{order.manual_refund.note}</Row>}
          <Row label="Created">{formatDate(order.created_at, true)}</Row>
          <Row label="Last change">{formatDate(order.updated_at, true)}</Row>
        </dl>

        <div className="space-y-2">
          <p className="text-sm font-medium">Payment events</p>
          {order.payment_events?.length ? (
            <ul className="space-y-2">
              {order.payment_events.map((event) => (
                <li key={event.id} className="rounded-md border p-2 text-xs">
                  <p className="font-medium">{event.event_id} · {formatDate(event.created_at, true)}</p>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-muted-foreground">Raw payload</summary>
                    <pre className="mt-1 max-h-60 overflow-auto rounded bg-muted p-2">{JSON.stringify(event.payload, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No webhook events recorded for this order.</p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "refund"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Ask Flutterwave to refund this payment?"
        description="If it works, the order is marked refunded and the player is told."
        confirmLabel="Refund"
        busy={busy}
        onConfirm={() => run("refund")}
      />
      <Dialog open={confirm === "mark-refunded"} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={(e) => { e.preventDefault(); run("mark-refunded"); }} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Mark as refunded?</DialogTitle>
              <DialogDescription>Only do this after refunding the player in the Flutterwave dashboard. The player is told.</DialogDescription>
            </DialogHeader>
            <FormField label="What you did" htmlFor="refund-note">
              <Textarea id="refund-note" rows={2} required value={note} onChange={(e) => setNote(e.target.value)} placeholder="Refunded in Flutterwave on 12 Nov, ref …" />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button>
              <Button type="submit" disabled={busy || !note.trim()}>{busy && <Loader2 className="animate-spin" />}Mark refunded</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
