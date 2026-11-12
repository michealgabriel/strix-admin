import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { errorMessage } from "@/lib/api";
import { useSetPasswordFromLinkMutation } from "./authApi";

// Opened from an admin invite or password reset email: /set-password?email=…&token=…
export default function SetPasswordPage() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [setPassword, { isLoading, error, isSuccess }] = useSetPasswordFromLinkMutation();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [mismatch, setMismatch] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setPassword({ email, token, password: form.password, password_confirmation: form.confirm });
  };

  const message = mismatch
    ? "The two passwords don't match."
    : error
      ? errorMessage(error, "Couldn't set your password. Please try again.")
      : null;

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-2xl font-bold tracking-tight">
            STRIX <span className="text-primary">Admin</span>
          </div>
          <CardTitle className="text-base">Choose your password</CardTitle>
          {email && <CardDescription>{email}</CardDescription>}
        </CardHeader>
        <CardContent>
          {!email || !token ? (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              This link is incomplete. Open the button in your email again, or ask another admin to send a new one.
            </p>
          ) : isSuccess ? (
            <div className="space-y-4 text-center">
              <p className="text-sm">Your password is set.</p>
              <Button asChild className="w-full">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {message && (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {message}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="animate-spin" />}
                Set password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
