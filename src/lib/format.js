const numberFormat = new Intl.NumberFormat("en");

export const formatNumber = (value) => (value == null ? "—" : numberFormat.format(value));

export function formatMoney(amount, currency) {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${numberFormat.format(amount)} ${currency ?? ""}`.trim();
  }
}

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

// "in 3 days", "2 hours ago"
export function formatRelative(value) {
  if (!value) return "—";
  const diff = new Date(value).getTime() - Date.now();
  const units = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === "minute") return rtf.format(Math.round(diff / ms), unit);
  }
  return "";
}
