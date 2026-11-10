import { useState } from "react";
import { Link } from "react-router";
import { EyeOff, Flag, Heart, MessageCircle, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import PlayerAvatar from "@/components/common/PlayerAvatar";
import { useCan } from "@/features/auth/useCan";
import { ClipReports } from "@/features/clips/EpicClipsPage";
import { REASON_LABELS } from "@/features/clips/reasons";
import { useGetClipReportsQuery } from "@/features/clips/clipsApi";
import { useListParams } from "@/hooks/useListParams";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useGetPostReportsQuery, useResolvePostReportsMutation } from "./reportsApi";

export default function ReportsPage() {
  const list = useListParams();
  const canPosts = useCan("moderate_posts");
  const canClips = useCan("view_epic_clips");
  const tab = list.get("tab") || (canPosts ? "posts" : "clips");
  const { data: posts } = useGetPostReportsQuery({ status: "open" }, { skip: !canPosts });
  const { data: clips } = useGetClipReportsQuery({ status: "open" }, { skip: !canClips });
  const count = (d) => (d?.total > 0 ? <Badge className="ml-1 h-5 px-1.5">{d.total}</Badge> : null);

  return (
    <>
      <PageHeader title="Reports" description="Posts and clips players reported. Three reports hide them until someone here decides." />
      <Tabs value={tab} onValueChange={(value) => list.set({ tab: value, status: "" })}>
        <TabsList className="mb-4">
          {canPosts && <TabsTrigger value="posts">Posts {count(posts)}</TabsTrigger>}
          {canClips && <TabsTrigger value="clips">Epic Clips {count(clips)}</TabsTrigger>}
        </TabsList>
        {canPosts && <TabsContent value="posts"><PostReports list={list} /></TabsContent>}
        {canClips && <TabsContent value="clips"><ClipReports list={list} /></TabsContent>}
      </Tabs>
    </>
  );
}

function PostReports({ list }) {
  const status = list.get("status") || "open";
  const { data, isLoading, isFetching, error, refetch } = useGetPostReportsQuery({ page: list.page, status });
  const [resolve, { isLoading: resolving }] = useResolvePostReportsMutation();
  const [pending, setPending] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {[["open", "Waiting for review"], ["dismissed", "Dismissed"]].map(([value, label]) => (
          <Button key={value} size="sm" variant={status === value ? "secondary" : "ghost"} onClick={() => list.set({ status: value === "open" ? "" : value, tab: "posts" })}>{label}</Button>
        ))}
      </div>
      {error ? (
        <EmptyState icon={Flag} title="Couldn't load reports" description={errorMessage(error)}>
          <Button size="sm" variant="outline" onClick={refetch}>Try again</Button>
        </EmptyState>
      ) : !isLoading && data.items.length === 0 ? (
        <EmptyState icon={Flag} title={status === "open" ? "No posts to review" : "No dismissed reports"} />
      ) : (
        <div className={`grid gap-4 lg:grid-cols-2 ${isFetching && !isLoading ? "opacity-70" : ""}`}>
          {isLoading ? Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-56 rounded-xl" />) : data.items.map((post) => (
            <Card key={post.id} className="gap-0 py-0">
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <PlayerAvatar player={post.user} />
                  <div className="min-w-0 flex-1">
                    {post.user ? <Link to={`/players/${post.user.id}`} className="font-medium hover:underline">{post.user.username}</Link> : <p className="font-medium">Deleted player</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(post.created_at, true)}</p>
                  </div>
                  {post.hidden_at && <Badge variant="secondary"><EyeOff /> Hidden</Badge>}
                </div>
                <div>
                  <p className="font-medium">{post.post_title}</p>
                  <p className="line-clamp-4 text-sm whitespace-pre-wrap text-muted-foreground">{post.post_text_content}</p>
                </div>
                {post.post_image && <img src={post.post_image} alt="" className="max-h-60 w-full rounded-md object-cover" />}
                {post.post_video && <video src={post.post_video} controls preload="none" className="max-h-60 w-full rounded-md bg-black" />}
                <div className="flex gap-4 text-sm text-muted-foreground tabular-nums">
                  <span className="flex items-center gap-1"><Heart className="size-4" /> {post.likes_count ?? 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="size-4" /> {post.comments_count ?? 0}</span>
                </div>
                <div className="space-y-1 rounded-md bg-muted/60 p-3 text-sm">
                  <p className="font-medium">{post.reports_count} {post.reports_count === 1 ? "report" : "reports"}</p>
                  {(post.reports ?? []).slice(0, 4).map((r) => (
                    <p key={r.id} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{REASON_LABELS[r.reason] ?? r.reason}</span>
                      {r.details ? `: ${r.details}` : ""}<span className="text-xs"> · {r.user?.username ?? "player"}</span>
                    </p>
                  ))}
                </div>
                {status === "open" && (
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={() => setPending({ post, action: "remove" })}><Trash2 /> Remove post</Button>
                    <Button variant="outline" size="sm" onClick={() => setPending({ post, action: "dismiss" })}><Undo2 /> Keep it</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {!error && <Pagination page={list.page} totalPages={data?.totalPages ?? 1} total={data?.total} onPageChange={list.setPage} />}
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.action === "remove" ? "Remove this post?" : "Keep this post?"}
        description={pending?.action === "remove" ? "It disappears from every feed and the author is told why." : "The reports are dismissed and the post shows again if it was hidden."}
        confirmLabel={pending?.action === "remove" ? "Remove post" : "Keep post"}
        destructive={pending?.action === "remove"}
        busy={resolving}
        onConfirm={async () => {
          try {
            const result = await resolve({ id: pending.post.id, action: pending.action }).unwrap();
            toast.success(result.message);
            setPending(null);
          } catch {
            // toast from the store
          }
        }}
      />
    </div>
  );
}
