import { api, listQuery, toList } from "@/lib/api";

const ordersApi = api.enhanceEndpoints({ addTagTypes: ["Orders", "Order"] }).injectEndpoints({
  endpoints: (build) => ({
    getOrders: build.query({
      query: ({ page = 1, status = "", type = "", provider = "", search = "", userId = "" } = {}) =>
        listQuery("/admin/orders", { page, status, type, provider, search, user_id: userId, limit: 20 }),
      transformResponse: toList,
      providesTags: ["Orders"],
    }),
    getOrder: build.query({
      query: (id) => `/admin/orders/${id}`,
      transformResponse: (response) => response.order,
      providesTags: (r, e, id) => [{ type: "Order", id: Number(id) }],
    }),
    orderAction: build.mutation({
      // action: sync | refund | mark-refunded
      query: ({ id, action, note }) => ({ url: `/admin/orders/${id}/${action}`, method: "POST", body: note ? { note } : {} }),
      invalidatesTags: (r, e, { id }) => ["Orders", "Dashboard", { type: "Order", id: Number(id) }],
    }),
  }),
});

export const { useGetOrdersQuery, useGetOrderQuery, useOrderActionMutation } = ordersApi;

export const ORDER_STATUSES = [
  ["pending", "Waiting for payment"],
  ["paid", "Paid, not delivered"],
  ["fulfilled", "Delivered"],
  ["refund_pending", "Refund needed"],
  ["refunded", "Refunded"],
  ["failed", "Failed"],
  ["expired", "Expired"],
];
export const ORDER_TYPES = [
  ["gold_pack", "Gold pack"],
  ["vip_pass", "VIP pass"],
  ["game_topup", "Game top-up"],
];
export const PROVIDERS = [
  ["flutterwave", "Flutterwave"],
  ["google_play", "Google Play"],
];
