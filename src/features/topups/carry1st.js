const SHOP = "https://shop.carry1st.com/en";

// Carry1st's store per country, found by the country's currency (Strix countries have no country code).
// Countries without a store of their own go to Carry1st's home page, which picks one.
const STORE_BY_CURRENCY = { USD: "US", NGN: "NG", GHS: "GH" };
const STORE_BY_NAME = { "united states": "US", usa: "US", nigeria: "NG", ghana: "GH" };

export function carry1stUrl(country) {
  const code = STORE_BY_CURRENCY[String(country?.currency ?? "").toUpperCase()] ?? STORE_BY_NAME[String(country?.name ?? "").trim().toLowerCase()];
  return code ? `${SHOP}/${code}` : "https://shop.carry1st.com";
}
