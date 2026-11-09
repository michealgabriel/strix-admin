import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Label, control and the server's error for one field.
// The child control gets aria-invalid when there is an error.
export default function FormField({ label, htmlFor, error, hint, className, children }) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
