import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTable from "@/components/common/DataTable";
import PageHeader from "@/components/common/PageHeader";
import PlayerAvatar from "@/components/common/PlayerAvatar";
import SearchInput from "@/components/common/SearchInput";
import { useListParams } from "@/hooks/useListParams";
import { formatDate, formatNumber } from "@/lib/format";
import { useGetPlayersQuery } from "./playersApi";

const SORTS = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["active", "Recently active"],
  ["gold", "Most Strix Gold"],
  ["xp", "Most XP"],
];

export default function PlayersPage() {
  const list = useListParams();
  const navigate = useNavigate();
  const search = list.get("q");
  const sort = list.get("sort") || "newest";
  const { data, isLoading, isFetching, error, refetch } = useGetPlayersQuery({ page: list.page, search, sort });

  const columns = [
    {
      key: "player",
      header: "Player",
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <PlayerAvatar player={p} />
          <div className="min-w-0">
            <p className="truncate font-medium">
              {p.username}
              {p.account_deleted_at && <Badge variant="secondary" className="ml-2">Deleted</Badge>}
            </p>
            <p className="truncate text-sm text-muted-foreground">{p.email}</p>
          </div>
        </div>
      ),
    },
    { key: "gold", header: "Strix Gold", className: "text-right tabular-nums", cell: (p) => formatNumber(p.strix_gold) },
    { key: "xp", header: "XP", className: "text-right tabular-nums", cell: (p) => formatNumber(p.player_xp) },
    {
      key: "pass",
      header: "Pass",
      cell: (p) => (p.pass_type === "vippass" ? <Badge>VIP</Badge> : <span className="text-muted-foreground">Free</span>),
    },
    { key: "followers", header: "Followers", className: "text-right tabular-nums", cell: (p) => formatNumber(p.followers_count) },
    { key: "joined", header: "Joined", cell: (p) => formatDate(p.created_at) },
  ];

  return (
    <>
      <PageHeader title="Players" description="Everyone with a Strix account. Open a player to see their details, wallet and history." />
      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        onRowClick={(p) => navigate(`/players/${p.id}`)}
        emptyTitle={search ? "No players match your search" : "No players yet"}
        pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
        toolbar={
          <>
            <SearchInput value={search} onChange={(q) => list.set({ q })} placeholder="Search username or email" className="sm:w-80" />
            <Select value={sort} onValueChange={(value) => list.set({ sort: value === "newest" ? "" : value })}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Sort players">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
    </>
  );
}
