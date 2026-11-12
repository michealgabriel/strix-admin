import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * A dropdown you can type into to filter, for long lists like games.
 * options: [{ value, label }]. value is a string ("" for none).
 */
export default function SearchableSelect({ value, onChange, options, placeholder = "Choose…", searchPlaceholder = "Type to filter", emptyText = "Nothing matches", label, className }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const listRef = useRef(null);

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? options.filter((option) => option.label.toLowerCase().includes(term)) : options;
  }, [options, query]);
  const selected = options.find((option) => option.value === value);

  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  };

  const move = (step) => {
    const next = Math.max(0, Math.min(shown.length - 1, active + step));
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView?.({ block: "nearest" });
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") { event.preventDefault(); move(1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); move(-1); }
    else if (event.key === "Enter") { event.preventDefault(); if (shown[active]) choose(shown[active]); }
    else if (event.key === "Escape") { setOpen(false); }
  };

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) { setQuery(""); setActive(Math.max(0, options.findIndex((o) => o.value === value))); } }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={label}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 opacity-50" />
          <input
            autoFocus
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            aria-controls={listId}
            aria-activedescendant={shown[active] ? `${listId}-${active}` : undefined}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul ref={listRef} id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1">
          {shown.length === 0 && <li className="px-2 py-1.5 text-sm text-muted-foreground">{emptyText}</li>}
          {shown.map((option, index) => (
            <li
              key={option.value || "none"}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm",
                index === active && "bg-accent text-accent-foreground",
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check className="size-4 shrink-0" />}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
