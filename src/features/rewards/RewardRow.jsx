import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { itemSlug } from "./rewardItems";

// One editable reward: what the player gets and how many
export function RewardRowEditor({ label, row, items, onChange, highlight }) {
  return (
    <div className={cn("grid grid-cols-[4.5rem_1fr_6rem] items-center gap-2 rounded-lg p-1", highlight && "bg-accent")}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Select value={itemSlug(row.item_name)} onValueChange={(item_name) => onChange({ ...row, item_name })}>
        <SelectTrigger className="w-full" aria-label={`${label} item`}>
          <SelectValue placeholder="Choose item" />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.slug} value={item.slug}>
              {item.image && <img src={item.image} alt="" className="size-4 object-contain" />}
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        min={1}
        required
        aria-label={`${label} quantity`}
        value={row.item_quantity}
        onChange={(e) => onChange({ ...row, item_quantity: e.target.value })}
      />
    </div>
  );
}

// One reward, read-only
export function RewardRowView({ label, row, items, highlight, done }) {
  const item = items.find((entry) => entry.slug === itemSlug(row.item_name));
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        highlight && "border-primary bg-accent",
        done && "opacity-60",
      )}
    >
      <span className="w-16 shrink-0 text-sm font-medium text-muted-foreground">{label}</span>
      {item?.image && <img src={item.image} alt="" className="size-8 object-contain" />}
      <span className="min-w-0 flex-1 truncate text-sm">{item?.name ?? row.item_name}</span>
      <span className="text-sm font-semibold tabular-nums">×{row.item_quantity}</span>
    </div>
  );
}
