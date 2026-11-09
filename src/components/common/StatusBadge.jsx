import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tones = {
  good: "border-transparent bg-primary/15 text-primary",
  warn: "border-transparent bg-warning/20 text-amber-700 dark:text-amber-300",
  bad: "border-transparent bg-destructive/15 text-destructive",
  neutral: "border-transparent bg-muted text-muted-foreground",
};

const byStatus = {
  active: "good",
  approved: "good",
  verified: "good",
  fulfilled: "good",
  paid: "good",
  open: "warn",
  pending: "warn",
  refund_pending: "warn",
  inactive: "neutral",
  closed: "neutral",
  expired: "neutral",
  dismissed: "neutral",
  refunded: "neutral",
  rejected: "bad",
  failed: "bad",
  removed: "bad",
};

export default function StatusBadge({ status, tone, children, className }) {
  const label = children ?? String(status ?? "").replaceAll("_", " ");
  return (
    <Badge variant="outline" className={cn("capitalize", tones[tone ?? byStatus[status] ?? "neutral"], className)}>
      {label}
    </Badge>
  );
}
