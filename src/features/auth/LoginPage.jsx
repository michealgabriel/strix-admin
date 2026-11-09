import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { errorMessage } from "@/lib/api";
import { useLoginMutation } from "./authApi";
import { selectToken } from "./authSlice";

export default function LoginPage() {
  const token = useSelector(selectToken);
  const endedReason = useSelector((state) => state.auth.endedReason);
  const location = useLocation();
  const [login, { isLoading, error }] = useLoginMutation();
  const [form, setForm] = useState({ email: "", password: "" });

  if (token) {
    return <Navigate to={location.state?.from?.pathname ?? "/"} replace />;
  }

  const submit = (event) => {
    event.preventDefault();
    login({ email: form.email.trim(), password: form.password });
  };

  const message = error ? errorMessage(error, "Couldn't sign in. Please try again.") : endedReason;

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="text-2xl font-bold tracking-tight">
            STRIX <span className="text-primary">Admin</span>
          </div>
          <CardTitle className="sr-only">Sign in</CardTitle>
          <CardDescription>Sign in to the operations dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {message && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {message}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
