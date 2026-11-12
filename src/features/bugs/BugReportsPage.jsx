import { useState } from "react";
import { Link } from "react-router";
import { Bug, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import DataTable from "@/components/common/DataTable";
import FormField from "@/components/common/FormField";
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import StatusBadge from "@/components/common/StatusBadge";
import { useListParams } from "@/hooks/useListParams";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { STATUSES, useGetBugReportQuery, useGetBugReportsQuery, useScreenshot, useUpdateBugReportMutation } from "./bugReportsApi";

const statusLabel = Object.fromEntries(STATUSES);
const TONES = { new: "warn", in_progress: "neutral", resolved: "good", wont_fix: "neutral" };
const ALL = "all";

export default function BugReportsPage() {
  const list = useListParams();
  const filters = {
    status: list.get("status"),
    platform: list.get("platform"),
    source: list.get("source"),
    app_version: list.get("app_version"),
    search: list.get("q"),
  };
  const { data, isLoading, isFetching, error, refetch } = useGetBugReportsQuery({ page: list.page, ...filters });
  const [open, setOpen] = useState(null);
  const counts = data?.counts ?? {};

  const filter = (key, label, options) => (
    <Select value={filters[key] || ALL} onValueChange={(value) => list.set({ [key]: value === ALL ? "" : value })}>
      <SelectTrigger className="w-40" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{`Any ${label.toLowerCase()}`}</SelectItem>
        {options.map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  const columns = [
    {
      key: "summary",
      header: "Report",
      cell: (r) => (
        <button type="button" className="min-w-0 max-w-md text-left" onClick={() => setOpen(r.id)}>
          <p className="truncate font-medium hover:underline">{r.summary}</p>
          <p className="truncate text-sm text-muted-foreground">{r.screen ?? "No screen"}</p>
        </button>
      ),
    },
    { key: "player", header: "Player", cell: (r) => (r.user ? <span>{r.user.username} <span className="text-muted-foreground">#{r.user.id}</span></span> : "Deleted") },
    { key: "platform", header: "Platform", cell: (r) => <span className="capitalize">{r.platform}</span> },
    { key: "version", header: "App version", cell: (r) => r.app_version ?? "—" },
    { key: "shot", header: <span className="sr-only">Screenshot</span>, cell: (r) => (r.has_screenshot ? <ImageIcon className="size-4 text-muted-foreground" aria-label="Has a screenshot" /> : null) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge tone={TONES[r.status]}>{statusLabel[r.status]}</StatusBadge> },
    { key: "created", header: "Sent", cell: (r) => formatDate(r.created_at, true) },
  ];

  return (
    <>
      <PageHeader title="Bug reports" description="Bugs players report from the app, by shaking their phone or from Settings." />
      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={refetch}
        emptyTitle={filters.status || filters.platform || filters.search ? "No reports match" : "No bug reports yet"}
        pagination={{ page: list.page, totalPages: data?.totalPages ?? 1, total: data?.total, onPageChange: list.setPage }}
        toolbar={
          <>
            <div className="flex flex-wrap gap-1" role="tablist">
              {[["", "All"], ...STATUSES].map(([value, label]) => (
                <Button key={value || "all"} role="tab" aria-selected={filters.status === value} size="sm" variant={filters.status === value ? "secondary" : "ghost"} onClick={() => list.set({ status: value })}>
                  {label} {value && counts[value] ? <Badge variant="outline" className="ml-1">{counts[value]}</Badge> : null}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {filter("platform", "Platform", [["android", "Android"], ["ios", "iOS"]])}
              {filter("source", "Source", [["shake", "Shake"], ["settings", "Settings"]])}
              {filter("app_version", "Version", (data?.appVersions ?? []).map((version) => [version, version]))}
              <SearchInput value={filters.search} onChange={(q) => list.set({ q })} placeholder="Search reports" />
            </div>
          </>
        }
      />
      <Sheet open={!!open} onOpenChange={(value) => !value && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{open && <ReportDetail id={open} />}</SheetContent>
      </Sheet>
    </>
  );
}

function ReportDetail({ id }) {
  const { data: report, isLoading, error } = useGetBugReportQuery(id);

  if (error) return <p className="p-6 text-sm text-destructive">{errorMessage(error)}</p>;
  if (isLoading || !report) return <div className="space-y-3 p-6"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-40" /></div>;

  return <ReportBody key={report.id + report.updated_at} report={report} />;
}

function ReportBody({ report }) {
  const shot = useScreenshot(report.id, report.has_screenshot);
  const [zoom, setZoom] = useState(false);
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState(report.admin_note ?? "");
  const [notify, setNotify] = useState(true);
  const [save, { isLoading }] = useUpdateBugReportMutation();
  const willNotify = status === "resolved" && report.status !== "resolved" && !report.player_notified_at;

  const submit = async () => {
    try {
      await save({ id: report.id, status, admin_note: note.trim() || null, ...(willNotify ? { notify } : {}) }).unwrap();
      toast.success(willNotify && notify ? "Saved. The player has been told it's fixed." : "Saved");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const fields = [
    ["Screen", report.screen],
    ["Platform", report.platform],
    ["App version", report.app_version],
    ["OS", report.os_version],
    ["Device", report.device_name],
    ["Language", report.locale],
    ["Sent from", report.source === "shake" ? "Shaking the phone" : "Settings"],
    ["Sent", formatDate(report.created_at, true)],
  ];

  return (
    <div className="space-y-5 p-1">
      <SheetHeader className="px-0">
        <SheetTitle className="flex items-center gap-2"><Bug className="size-4" /> Bug report #{report.id}</SheetTitle>
        <SheetDescription>
          {report.user
            ? <>From <Link className="font-medium text-primary hover:underline" to={`/players/${report.user.id}`}>{report.user.username}</Link> (#{report.user.id}, STRIX-ID {report.user.strix_id})</>
            : "From a deleted account"}
        </SheetDescription>
      </SheetHeader>

      <p className="whitespace-pre-line rounded-lg border bg-muted/30 p-3 text-sm">{report.description}</p>

      {report.has_screenshot && (
        <div>
          {shot.url ? (
            <button type="button" onClick={() => setZoom(true)} className="block overflow-hidden rounded-lg border" aria-label="Enlarge the screenshot">
              <img src={shot.url} alt="Screenshot from the player's phone" className="max-h-80 w-auto" />
            </button>
          ) : shot.failed ? <p className="text-sm text-destructive">The screenshot couldn't be loaded.</p> : <Skeleton className="h-60 w-32" />}
          <p className="mt-1 text-xs text-muted-foreground">Private: it may show the player's messages, Gold or STRIX-ID.</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {fields.map(([label, value]) => (
          <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value || "—"}</dd></div>
        ))}
      </dl>

      <div className="space-y-3 rounded-lg border p-3">
        <FormField label="Status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full" aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="Internal note" htmlFor="b-note" hint="Only admins see this.">
          <Textarea id="b-note" rows={3} maxLength={5000} value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>
        {willNotify && (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={notify} onCheckedChange={(value) => setNotify(value === true)} aria-label="Tell the player it's fixed" />
            Tell the player it&apos;s fixed ("Thanks, we fixed the bug you reported")
          </label>
        )}
        {report.player_notified_at && <p className="text-xs text-muted-foreground">The player was told it's fixed on {formatDate(report.player_notified_at, true)}.</p>}
        <Button onClick={submit} disabled={isLoading}>{isLoading && <Loader2 className="animate-spin" />} Save</Button>
      </div>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-h-[95svh] overflow-auto sm:max-w-3xl">
          <DialogTitle className="sr-only">Screenshot</DialogTitle>
          {shot.url && <img src={shot.url} alt="Screenshot from the player's phone, full size" className="mx-auto h-auto max-w-full" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
