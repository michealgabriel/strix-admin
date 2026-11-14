// The price a player in this country pays for a dollar price, worked out the way the backend's checkout does:
// USD × the country's rate, rounded up to its price step when it has one.
export function localPrice(dollars, country) {
  if (!country || country.is_base) return Math.round(dollars * 100) / 100;
  let amount = dollars * Number(country.rate_per_base);
  const step = Number(country.price_round_to);
  if (step > 0) amount = Math.ceil(Math.round((amount / step) * 1e6) / 1e6) * step;
  return Math.round(amount * 100) / 100;
}

// Packs whose Gold per dollar is lower than a cheaper pack's, which players notice
export function worseValuePacks(packs) {
  const sorted = [...packs].sort((a, b) => a.price_in_dollars - b.price_in_dollars);
  let best = 0;
  const worse = new Set();
  for (const pack of sorted) {
    const perDollar = pack.strixgold_quantity / pack.price_in_dollars;
    if (perDollar < best) worse.add(pack.id);
    best = Math.max(best, perDollar);
  }
  return worse;
}
