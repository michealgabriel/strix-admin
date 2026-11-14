import { localPrice, worseValuePacks } from "./localPrice";

const nigeria = { is_base: false, rate_per_base: 1601.16, price_round_to: null };

test("local prices match the backend's conversion and rounding", () => {
  expect(localPrice(2.99, nigeria)).toBe(4787.47);
  expect(localPrice(2.99, { ...nigeria, price_round_to: 100 })).toBe(4800);
  expect(localPrice(2.99, { is_base: false, rate_per_base: 12.4, price_round_to: 1 })).toBe(38);
  // An exact multiple stays put
  expect(localPrice(3, { is_base: false, rate_per_base: 1600, price_round_to: 100 })).toBe(4800);
  expect(localPrice(2.99, { is_base: true })).toBe(2.99);
});

test("a bigger pack with less Gold per dollar is flagged", () => {
  const packs = [
    { id: 1, strixgold_quantity: 350, price_in_dollars: 2.99 },
    { id: 2, strixgold_quantity: 650, price_in_dollars: 6.99 },
    { id: 3, strixgold_quantity: 2500, price_in_dollars: 17.99 },
  ];
  expect([...worseValuePacks(packs)]).toEqual([2]);
});
