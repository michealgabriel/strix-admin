import { useState } from "react";
import { Link } from "react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTable from "@/components/common/DataTable";
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import StatusBadge from "@/components/common/StatusBadge";
import { useListParams } from "@/hooks/useListParams";
import { formatDate, formatMoney } from "@/lib/format";
import OrderSheet from "./OrderSheet";
import { ORDER_STATUSES, ORDER_TYPES, PROVIDERS, useGetOrdersQuery } from "./ordersApi";

function Filter({ value, onChange, options, all, label }) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
      <SelectTrigger className="w-full sm:w-44" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

const statusLabel = (status) => ORDER_STATUSES.find(([v]) => v === status)?.[1] ?? status;

export default function OrdersPage() {
  const list = useListParams();
  const filters = { status: list.get("status"), type: list.get("type"), provider: list.get("provider"), search: list.get("q") };
  const { data, isLoading, isFetching, error, refetch } = useGetOrdersQuery({ page: list.page, ...filters });
  const [openId, setOpenId] = useState(null);

  const columns = [
    { key: "id", header: "Order", cell: (o) => <span className="font-mono text-sm">#{o.id}</span> },
    { key: "item", header: "What", cell: (o) => <span className="font-medium">{o.item_title}</span> },
    { key: "player", header: "Player", cell: (o) => (o.user ? <Link onClick={(e) => e.stopPropagation()} className="hover:underline" to={`/players/${o.user.id}`}>{o.user.username}</Link> : "—") },
    { key: "amount", header: "Amount", className: "tabular-nums", cell: (o) => (o.amount != null ? formatMoney(o.amount, o.currency) : "Set by the store") },
    { key: "provider", header: "Paid with", cell: (o) => PROVIDERS.find(([v]) => v === o.provider)?.[1] ?? o.provider },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status}>{statusLabel(o.status)}</StatusBadge> },
    { key: "when", header: "Created", cell: (o) => formatDate(o.created_at, true) },
  ];

  return (
    <>
      <PageHeader title="Orders" description="Every purchase made with real money. Re-check a payment that never arrived, and settle refunds." />
      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        onRowClick={(o) => setOpenId(o.id)}
        emptyTitle="No orders match"
        pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
        toolbar={
          <>
            <SearchInput value={filters.search} onChange={(q) => list.set({ q })} placeholder="Order #, reference, player" />
            <Filter label="Status" value={filters.status} onChange={(status) => list.set({ status })} options={ORDER_STATUSES} all="Any status" />
            <Filter label="Type" value={filters.type} onChange={(type) => list.set({ type })} options={ORDER_TYPES} all="Any item" />
            <Filter label="Provider" value={filters.provider} onChange={(provider) => list.set({ provider })} options={PROVIDERS} all="Any provider" />
          </>
        }
      />
      <OrderSheet id={openId} onOpenChange={(open) => !open && setOpenId(null)} />
    </>
  );
}
