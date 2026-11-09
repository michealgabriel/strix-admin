import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// A single number with a label; links to the page behind it when `to` is set
export default function StatCard({ label, value, hint, icon: Icon, to, loading, tone }) {
  const body = (
    <Card className={cn("h-full gap-0 py-0 transition-colors", to && "hover:border-primary/40")}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className={cn("text-2xl font-semibold tabular-nums", tone === "warning" && "text-warning")}>
              {value}
            </p>
          )}
          {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return to ? (
    <Link to={to} className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  );
}
