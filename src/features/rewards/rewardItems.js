// Older manifests used "commonbox"; the backend reads it as the common chest
const ALIASES = { commonbox: "commonchest" };
export const itemSlug = (slug) => ALIASES[slug] ?? slug;

export function itemLabel(items, slug) {
  return items.find((item) => item.slug === itemSlug(slug))?.name ?? slug;
}
