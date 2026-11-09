import { Loader2 } from "lucide-react";

export default function PageLoading() {
  return (
    <div className="grid place-items-center py-24">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  );
}
