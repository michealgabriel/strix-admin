import { useState } from "react";
import { Ban, Coins, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import FormField from "@/components/common/FormField";
import { useCan } from "@/features/auth/useCan";
import { fieldErrors } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useAdjustWalletMutation, useSuspendPlayerMutation, useUnsuspendPlayerMutation } from "./playersApi";

export function SuspensionBanner({ suspension }) {
  if (!suspension) return null;
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
      <p className="font-medium text-destructive">
        {suspension.banned ? "Banned" : `Suspended until ${formatDate(suspension.suspended_until, true)}`}
      </p>
      <p className="text-muted-foreground">
        {suspension.reason}
        {suspension.by ? ` · by ${suspension.by.name}` : ""}
        {suspension.suspended_at ? ` · ${formatDate(suspension.suspended_at, true)}` : ""}
      </p>
    </div>
  );
}

export default function ModerationActions({ player, suspension }) {
  const canModerate = useCan("moderate_players");
  const canAdjust = useCan("adjust_wallets");
  const [open, setOpen] = useState(null); // "suspend" | "lift" | "wallet"
  const [unsuspend, lifting] = useUnsuspendPlayerMutation();
  if (player.account_deleted_at || (!canModerate && !canAdjust)) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {canAdjust && <Button variant="outline" size="sm" onClick={() => setOpen("wallet")}><Coins /> Adjust wallet</Button>}
      {canModerate && (suspension
        ? <Button variant="outline" size="sm" onClick={() => setOpen("lift")}><ShieldCheck /> Lift {suspension.banned ? "ban" : "suspension"}</Button>
        : <Button variant="destructive" size="sm" onClick={() => setOpen("suspend")}><Ban /> Suspend or ban</Button>)}

      <Dialog open={open === "suspend" || open === "wallet"} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-md">
          {open === "suspend" && <SuspendForm player={player} onDone={() => setOpen(null)} />}
          {open === "wallet" && <WalletForm player={player} onDone={() => setOpen(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={open === "lift"}
        onOpenChange={(o) => !o && setOpen(null)}
        title={`Let ${player.username} back in?`}
        description="They can sign in and use Strix again straight away."
        confirmLabel="Lift it"
        busy={lifting.isLoading}
        onConfirm={async () => {
          try {
            await unsuspend(player.id).unwrap();
            toast.success(`${player.username} can use Strix again`);
            setOpen(null);
          } catch {
            // toast from the store
          }
        }}
      />
    </div>
  );
}

const LENGTHS = [["1", "1 day"], ["3", "3 days"], ["7", "7 days"], ["30", "30 days"], ["ban", "Ban (until lifted)"]];

function SuspendForm({ player, onDone }) {
  const [length, setLength] = useState("3");
  const [reason, setReason] = useState("");
  const [suspend, { isLoading, error }] = useSuspendPlayerMutation();
  const errors = fieldErrors(error);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await suspend({ id: player.id, reason: reason.trim(), days: length === "ban" ? null : Number(length) }).unwrap();
      toast.success(result.message);
      onDone();
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Suspend {player.username}?</DialogTitle>
        <DialogDescription>They can't use the app until it ends, and they see the reason when they try. Their pushes stop.</DialogDescription>
      </DialogHeader>
      <FormField label="How long">
        <Select value={length} onValueChange={setLength}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{LENGTHS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </FormField>
      <FormField label="Reason, shown to the player" htmlFor="sus-reason" error={errors.reason}>
        <Textarea id="sus-reason" rows={3} required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Abusive messages in team-up chat" />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>Cancel</Button>
        <Button type="submit" variant="destructive" disabled={isLoading || !reason.trim()}>
          {isLoading && <Loader2 className="animate-spin" />}
          {length === "ban" ? "Ban player" : "Suspend player"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function WalletForm({ player, onDone }) {
  const [values, setValues] = useState({ currency: "strix_gold", direction: "add", amount: "", note: "" });
  const [adjust, { isLoading, error }] = useAdjustWalletMutation();
  const errors = fieldErrors(error);
  const balance = values.currency === "strix_gold" ? player.strix_gold : player.player_xp;

  const submit = async (event) => {
    event.preventDefault();
    const amount = Math.abs(Number(values.amount)) * (values.direction === "add" ? 1 : -1);
    try {
      const result = await adjust({ id: player.id, currency: values.currency, amount, note: values.note.trim() }).unwrap();
      toast.success(`New balance: ${result.transaction?.balance_after ?? "updated"}`);
      onDone();
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Adjust {player.username}'s wallet</DialogTitle>
        <DialogDescription>For fixing mistakes and goodwill gestures. The note stays in their wallet history and the activity log.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Currency">
          <Select value={values.currency} onValueChange={(currency) => setValues({ ...values, currency })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="strix_gold">Strix Gold</SelectItem>
              <SelectItem value="player_xp">XP</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Change">
          <Select value={values.direction} onValueChange={(direction) => setValues({ ...values, direction })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add</SelectItem>
              <SelectItem value="remove">Remove</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <FormField label="Amount" htmlFor="w-amount" error={errors.amount} hint={`Current balance: ${balance}`}>
        <Input id="w-amount" type="number" min={1} required value={values.amount} onChange={(e) => setValues({ ...values, amount: e.target.value })} />
      </FormField>
      <FormField label="Note" htmlFor="w-note" error={errors.note}>
        <Textarea id="w-note" rows={2} required maxLength={300} value={values.note} onChange={(e) => setValues({ ...values, note: e.target.value })} placeholder="Top-up never arrived, support chat #12" />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading || !values.amount || !values.note.trim()}>
          {isLoading && <Loader2 className="animate-spin" />}
          {values.direction === "add" ? "Add" : "Remove"} {values.amount || ""} {values.currency === "strix_gold" ? "gold" : "XP"}
        </Button>
      </DialogFooter>
    </form>
  );
}
