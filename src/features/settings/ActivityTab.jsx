import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTable from "@/components/common/DataTable";
import { useListParams } from "@/hooks/useListParams";
import { api, listQuery, toList } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { activityLink, describeActivity } from "./activityLabels";
import { useGetAdminsQuery } from "./settingsApi";

const activityApi = api.injectEndpoints({
  endpoints: (build) => ({
    getActivity: build.query({
      query: ({ page = 1, adminId = "", failed = false } = {}) => listQuery("/admin/activity", { page, admin_id: adminId, failed: failed ? 1 : "", limit: 30 }),
      transformResponse: toList,
    }),
  }),
});

function Details({ input }) {
  const entries = Object.entries(input ?? {});
  if (!entries.length) return null;
  return (
    <details className="mt-1 text-xs text-muted-foreground">
      <summary className="cursor-pointer">What was sent</summary>
      <pre className="mt-1 max-h-48 max-w-xl overflow-auto rounded bg-muted p-2 whitespace-pre-wrap">{JSON.stringify(input, null, 2)}</pre>
    </details>
  );
}

export default function ActivityTab() {
  const list = useListParams();
  const adminId = list.get("admin");
  const failed = list.get("failed") === "1";
  const { data, isLoading, isFetching, error, refetch } = activityApi.useGetActivityQuery({ page: list.page, adminId, failed });
  const { data: admins } = useGetAdminsQuery({ page: 1 });

  const columns = [
    { key: "when", header: "When", className: "whitespace-nowrap", cell: (e) => formatDate(e.created_at, true) },
    { key: "who", header: "Admin", cell: (e) => e.admin_name ?? `#${e.admin_id}` },
    {
      key: "what",
      header: "What",
      className: "whitespace-normal",
      cell: (e) => {
        const link = activityLink(e);
        const text = describeActivity(e);
        return (
          <div>
            {link ? <Link to={link} className="hover:underline">{text}</Link> : text}
            <Details input={e.input} />
          </div>
        );
      },
    },
    { key: "result", header: "Result", cell: (e) => (e.status < 400 ? <span className="text-muted-foreground">Done</span> : <Badge variant="destructive">Refused ({e.status})</Badge>) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={data?.items}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={refetch}
      emptyTitle="Nothing recorded yet"
      emptyDescription="Every change an admin makes shows up here. Passwords are never stored."
      pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
      toolbar={
        <>
          <Select value={adminId || "all"} onValueChange={(v) => list.set({ admin: v === "all" ? "" : v, tab: "activity" })}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Admin"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Every admin</SelectItem>
              {(admins?.items ?? []).map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant={failed ? "secondary" : "ghost"} onClick={() => list.set({ failed: failed ? "" : "1", tab: "activity" })}>Only refused</Button>
        </>
      }
    />
  );
}
