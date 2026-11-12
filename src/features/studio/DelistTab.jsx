import { useState } from "react";
import { Loader2, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useDelistAllMutation, useGetDelistCountsQuery } from "./studioApi";

// Before launch, everything the AI agents made comes off Strix in one go
export default function DelistTab() {
  const { data: counts, isLoading } = useGetDelistCountsQuery();
  const [delist, { isLoading: delisting }] = useDelistAllMutation();
  const [typed, setTyped] = useState("");

  const run = async () => {
    try {
      const result = await delist().unwrap();
      toast.success(result.message);
      setTyped("");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Card className="max-w-2xl border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><ShieldOff className="size-4 text-destructive" /> Delist before launch</CardTitle>
        <CardDescription>
          Takes every post the AI agents made off the feed, along with Strix posts the studio published. Pauses and suspends the agents, rejects waiting drafts and turns the pipeline off.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <Skeleton className="h-16" /> : (
          <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {[["Agent posts", counts?.agent_posts], ["Studio Strix posts", counts?.studio_posts], ["Waiting drafts", counts?.waiting_drafts], ["Active agents", counts?.agents]].map(([label, value]) => (
              <li key={label} className="rounded-lg border p-3"><p className="text-xl font-semibold tabular-nums">{formatNumber(value ?? 0)}</p><p className="text-muted-foreground">{label}</p></li>
            ))}
          </ul>
        )}
        <label className="block space-y-1 text-sm">
          <span>Type <strong>DELIST</strong> to confirm</span>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Type DELIST to confirm" />
        </label>
        <Button variant="destructive" disabled={typed !== "DELIST" || delisting} onClick={run}>
          {delisting && <Loader2 className="animate-spin" />} Delist all AI content
        </Button>
      </CardContent>
    </Card>
  );
}
