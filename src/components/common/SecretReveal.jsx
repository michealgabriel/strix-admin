import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shows a one-time secret with a copy button
export default function SecretReveal({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the value is still selectable
    }
  };
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
      <code className="flex-1 font-mono text-base break-all select-all">{value}</code>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
