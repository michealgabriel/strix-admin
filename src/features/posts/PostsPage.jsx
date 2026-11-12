import { useEffect, useState } from "react";
import { Bell, Bookmark, Eye, EyeOff, Film, Heart, Loader2, MessageCircle, Newspaper, Pencil, Plus, Trash2, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import FormField from "@/components/common/FormField";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import { useCan } from "@/features/auth/useCan";
import { useGetGamesQuery } from "@/features/games/gamesApi";
import { useListParams } from "@/hooks/useListParams";
import { errorMessage, fieldErrors } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { postFormData, useDeleteStrixPostMutation, useGetStrixPostsQuery, useSaveStrixPostMutation } from "./postsApi";

const TABS = [
  ["published", "Published"],
  ["draft", "Drafts"],
];

const IMAGE_MAX_MB = 2;
const VIDEO_MAX_MB = 10;

export default function PostsPage() {
  const list = useListParams();
  const search = list.get("q");
  const status = list.get("show") || "published";
  const { data, isLoading, isFetching, error, refetch } = useGetStrixPostsQuery({ page: list.page, search, status });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [remove, { isLoading: removing }] = useDeleteStrixPostMutation();

  const confirmDelete = async () => {
    try {
      await remove(deleting.id).unwrap();
      toast.success("Post deleted");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="Strix posts"
        description="Posts from Strix in the community feed. Players see them with the Strix name and badge."
        actions={<Button onClick={() => setEditing({})}><Plus /> New post</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="tablist">
          {TABS.map(([value, label]) => (
            <Button key={value} role="tab" aria-selected={status === value} size="sm" variant={status === value ? "secondary" : "ghost"} onClick={() => list.set({ show: value === "published" ? "" : value })}>
              {label}
            </Button>
          ))}
        </div>
        <SearchInput value={search} onChange={(q) => list.set({ q })} placeholder="Search posts" className="sm:ml-auto" />
      </div>

      {error ? (
        <EmptyState icon={Newspaper} title="Couldn't load posts" description={errorMessage(error)}>
          <Button variant="outline" size="sm" onClick={refetch}>Try again</Button>
        </EmptyState>
      ) : isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : !data?.items.length ? (
        <EmptyState
          icon={Newspaper}
          title={search ? "No posts match your search" : status === "draft" ? "No drafts" : "No Strix posts yet"}
          description={search ? undefined : "Write one to share news, events or tips with every player."}
        >
          {!search && <Button size="sm" onClick={() => setEditing({})}><Plus /> New post</Button>}
        </EmptyState>
      ) : (
        <div className={cn("space-y-3", isFetching && "opacity-60")}>
          {data.items.map((post) => <PostRow key={post.id} post={post} onEdit={() => setEditing(post)} onDelete={() => setDeleting(post)} />)}
          <Pagination page={list.page} totalPages={data.totalPages} total={data.total} onPageChange={list.setPage} />
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          {editing && <PostForm key={editing.id ?? "new"} post={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this post?"
        description={deleting?.push && ["scheduled", "sending"].includes(deleting.push.status)
          ? "It leaves the feed straight away, and the push about it stops going out."
          : "It leaves the feed straight away. This can't be undone."}
        confirmLabel="Delete post"
        destructive
        busy={removing}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function PostRow({ post, onEdit, onDelete }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        <Media post={post} className="aspect-video w-full shrink-0 sm:w-48" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="min-w-0 flex-1 font-semibold leading-snug">{post.post_title}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${post.post_title}`} onClick={onEdit}><Pencil /></Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Delete ${post.post_title}`} onClick={onDelete}><Trash2 /></Button>
            </div>
          </div>
          <p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">{post.post_text_content}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {post.is_draft && <Badge variant="secondary">Draft</Badge>}
            {post.hidden_at && <Badge variant="destructive"><EyeOff /> Hidden after reports</Badge>}
            {post.tournament_id && <Badge variant="outline"><Trophy /> Tournament</Badge>}
            {post.push && <PushBadge push={post.push} />}
            {post.tagged_games.map((game) => <Badge key={game.id} variant="outline">{game.name}</Badge>)}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {!post.is_draft && (
              <>
                <Stat icon={Eye} value={post.views_count} label="views" />
                <Stat icon={Heart} value={post.likes_count} label="likes" />
                <Stat icon={MessageCircle} value={post.comments_count} label="comments" />
                <Stat icon={Bookmark} value={post.bookmarks_count} label="saves" />
              </>
            )}
            <span>{post.admin?.name ? `${post.admin.name} · ` : ""}{formatDate(post.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <span className="flex items-center gap-1" title={label}>
      <Icon className="size-3.5" aria-hidden /> {formatNumber(value)} <span className="sr-only">{label}</span>
    </span>
  );
}

function PushBadge({ push }) {
  const text = {
    scheduled: "Push starting",
    sending: `Push sending · ${formatNumber(push.sent ?? 0)} sent`,
    sent: `Push sent · ${formatNumber(push.sent ?? 0)} sent, ${formatNumber(push.opened ?? 0)} opened`,
    cancelled: "Push stopped",
  }[push.status] ?? "Push";
  return <Badge variant="outline"><Bell /> {text}</Badge>;
}

function Media({ post, file, className }) {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!(file instanceof File)) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const isVideo = file instanceof File ? file.type === "video/mp4" : !!post?.post_video;
  const src = preview ?? (isVideo ? post?.post_video : post?.post_image);
  if (!src) return null;
  return (
    <div className={cn("overflow-hidden rounded-md bg-muted", className)}>
      {isVideo ? <video src={src} className="size-full object-cover" muted controls aria-label="Post video" /> : <img src={src} alt="" className="size-full object-cover" />}
    </div>
  );
}

function PostForm({ post, onDone }) {
  const creating = !post.id;
  const canNotify = useCan("send_push_campaigns");
  const alreadyNotified = !!post.push;
  const [values, setValues] = useState({
    post_title: post.post_title ?? "",
    post_text_content: post.post_text_content ?? "",
    tagged_games: (post.tagged_games ?? []).map((game) => game.id),
    is_draft: post.is_draft ?? false,
    media: null,
    removeMedia: false,
    notify: false,
    push_title: "",
    push_body: "",
  });
  const [mediaError, setMediaError] = useState(null);
  const [save, { isLoading, error }] = useSaveStrixPostMutation();
  const { data: games } = useGetGamesQuery({ limit: 100 });
  const errors = fieldErrors(error);
  const set = (key) => (eventOrValue) => setValues((v) => ({ ...v, [key]: eventOrValue?.target ? eventOrValue.target.value : eventOrValue }));

  const hasMedia = values.media instanceof File || (!values.removeMedia && (post.post_image || post.post_video));

  const pickMedia = (file) => {
    setMediaError(null);
    if (!file) return;
    const isVideo = file.type === "video/mp4";
    if (!isVideo && !["image/png", "image/jpeg"].includes(file.type)) return setMediaError("Use a PNG or JPG image, or an MP4 video.");
    const max = isVideo ? VIDEO_MAX_MB : IMAGE_MAX_MB;
    if (file.size > max * 1024 * 1024) return setMediaError(`${isVideo ? "Videos" : "Images"} must be under ${max} MB.`);
    setValues((v) => ({ ...v, media: file, removeMedia: false }));
  };

  const toggleGame = (id) =>
    setValues((v) => ({
      ...v,
      tagged_games: v.tagged_games.includes(id) ? v.tagged_games.filter((g) => g !== id) : v.tagged_games.length < 10 ? [...v.tagged_games, id] : v.tagged_games,
    }));

  const submit = async (asDraft) => {
    const next = { ...values, is_draft: asDraft };
    try {
      await save({ id: post.id, formData: postFormData(next, { creating }) }).unwrap();
      toast.success(asDraft ? "Draft saved" : next.notify ? "Post published. Players are being notified." : creating || post.is_draft ? "Post published" : "Post updated");
      onDone();
    } catch (e) {
      if (!Object.keys(fieldErrors(e)).length) toast.error(errorMessage(e));
    }
  };

  const publishedAlready = !creating && !post.is_draft;

  return (
    <form onSubmit={(event) => { event.preventDefault(); submit(false); }} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{creating ? "New Strix post" : "Edit post"}</DialogTitle>
        <DialogDescription>Shows in every player's feed as a post from Strix.</DialogDescription>
      </DialogHeader>

      <FormField label="Title" htmlFor="p-title" error={errors.post_title}>
        <Input id="p-title" maxLength={255} value={values.post_title} onChange={set("post_title")} placeholder="Season 2 is live 🔥" required />
      </FormField>
      <FormField label="Text" htmlFor="p-text" error={errors.post_text_content} hint="Hashtags written together at the very end, like #strix#season2, show as tags in the app.">
        <Textarea id="p-text" rows={5} maxLength={5000} value={values.post_text_content} onChange={set("post_text_content")} required />
      </FormField>

      <FormField label="Image or video (optional)" error={mediaError ?? errors.post_image ?? errors.post_video}>
        <div className="space-y-2">
          <Media post={values.removeMedia ? null : post} file={values.media} className="aspect-video w-full max-w-sm" />
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">
              <Film className="size-4" /> {hasMedia ? "Replace" : "Choose a file"}
              <input type="file" accept="image/png,image/jpeg,video/mp4" className="sr-only" aria-label="Choose an image or video" onChange={(e) => pickMedia(e.target.files?.[0])} />
            </label>
            {hasMedia && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setValues((v) => ({ ...v, media: null, removeMedia: !creating }))}>
                <X /> Remove
              </Button>
            )}
            <span className="text-xs text-muted-foreground">PNG or JPG up to {IMAGE_MAX_MB} MB, or MP4 up to {VIDEO_MAX_MB} MB.</span>
          </div>
        </div>
      </FormField>

      <FormField label="Games (optional)" error={errors.tagged_games} hint="Players who follow these games find the post under them. Up to 10.">
        <div className="flex flex-wrap gap-1.5">
          {(games?.items ?? []).map((game) => (
            <button
              key={game.id}
              type="button"
              aria-pressed={values.tagged_games.includes(game.id)}
              onClick={() => toggleGame(game.id)}
              className={cn("rounded-full border px-3 py-1 text-sm transition-colors", values.tagged_games.includes(game.id) ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted")}
            >
              {game.name}
            </button>
          ))}
        </div>
      </FormField>

      {canNotify && (
        alreadyNotified ? (
          <p className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground"><Bell className="size-4" /> Players were already notified about this post.</p>
        ) : (
          <div className="space-y-3 rounded-lg border p-3">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="font-medium">Notify players</span>
                <span className="block text-muted-foreground">
                  Sends a push that opens this post, to every player with News on. It goes out over the next hours and waits for each player's morning. It can only be sent once per post.
                </span>
              </span>
              <Switch checked={values.notify} onCheckedChange={set("notify")} aria-label="Notify players" />
            </label>
            {values.notify && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Push title (optional)" htmlFor="p-push-title" error={errors.push_title} hint="Uses the post title if empty.">
                  <Input id="p-push-title" maxLength={100} value={values.push_title} onChange={set("push_title")} />
                </FormField>
                <FormField label="Push message (optional)" htmlFor="p-push-body" error={errors.push_body} hint="Uses the start of the text if empty.">
                  <Input id="p-push-body" maxLength={500} value={values.push_body} onChange={set("push_body")} />
                </FormField>
              </div>
            )}
            {errors.notify && <p className="text-sm text-destructive">{errors.notify}</p>}
          </div>
        )
      )}

      <DialogFooter className="gap-2">
        {!publishedAlready && (
          <Button type="button" variant="outline" disabled={isLoading} onClick={() => submit(true)}>Save draft</Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="animate-spin" />}
          {publishedAlready ? "Save changes" : "Publish"}
        </Button>
      </DialogFooter>
    </form>
  );
}
