import { carry1stUrl } from "./carry1st";

test("each Strix country opens its own Carry1st store", () => {
  expect(carry1stUrl({ name: "Nigeria", currency: "NGN" })).toBe("https://shop.carry1st.com/en/NG");
  expect(carry1stUrl({ name: "Ghana", currency: "GHS" })).toBe("https://shop.carry1st.com/en/GH");
  expect(carry1stUrl({ name: "United States", currency: "USD" })).toBe("https://shop.carry1st.com/en/US");
  expect(carry1stUrl({ name: "Ghana", currency: "ghs" })).toBe("https://shop.carry1st.com/en/GH");
  expect(carry1stUrl({ name: "Nigeria" })).toBe("https://shop.carry1st.com/en/NG");
});

test("anything else opens Carry1st's home page", () => {
  expect(carry1stUrl({ name: "Kenya", currency: "KES" })).toBe("https://shop.carry1st.com");
  expect(carry1stUrl(null)).toBe("https://shop.carry1st.com");
});
