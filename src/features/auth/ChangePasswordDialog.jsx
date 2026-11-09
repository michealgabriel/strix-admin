import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FormField from "@/components/common/FormField";
import { fieldErrors } from "@/lib/api";
import { useChangePasswordMutation } from "./authApi";

export default function ChangePasswordDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">{open && <ChangePasswordForm onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function ChangePasswordForm({ onDone }) {
  const [values, setValues] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [change, { isLoading, error }] = useChangePasswordMutation();
  const errors = fieldErrors(error);
  const set = (key) => (e) => setValues({ ...values, [key]: e.target.value });

  const submit = async (event) => {
    event.preventDefault();
    try {
      await change(values).unwrap();
      toast.success("Password changed. Your other sessions were signed out.");
      onDone();
    } catch {
      // inline or toast
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Change your password</DialogTitle>
        <DialogDescription>You stay signed in here; every other session is signed out.</DialogDescription>
      </DialogHeader>
      <FormField label="Current password" htmlFor="pw-current" error={errors.current_password}>
        <Input id="pw-current" type="password" autoComplete="current-password" required value={values.current_password} onChange={set("current_password")} />
      </FormField>
      <FormField label="New password" htmlFor="pw-new" error={errors.password} hint="At least 8 characters.">
        <Input id="pw-new" type="password" autoComplete="new-password" minLength={8} required value={values.password} onChange={set("password")} />
      </FormField>
      <FormField label="Confirm new password" htmlFor="pw-confirm">
        <Input id="pw-confirm" type="password" autoComplete="new-password" required value={values.password_confirmation} onChange={set("password_confirmation")} />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          Change password
        </Button>
      </DialogFooter>
    </form>
  );
}
