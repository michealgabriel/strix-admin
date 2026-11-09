import { EyeOff, Heart, MessageCircle, Trophy, Vote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

// A clip with its player, game and counts. The video only loads when played.
export default function ClipCard({ clip, children }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="relative aspect-video bg-black">
        <video
          src={clip.clip}
          poster={clip.thumbnail ?? undefined}
          controls
          preload="none"
          className="size-full object-contain"
        />
        <div className="absolute top-2 left-2 flex gap-1">
          {!!clip.is_winner && (
            <Badge className="bg-amber-400 text-amber-950">
              <Trophy /> Winner
            </Badge>
          )}
          {clip.hidden_at && (
            <Badge variant="secondary">
              <EyeOff /> Hidden
            </Badge>
          )}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{clip.user?.username ?? "Deleted player"}</p>
          <p className="truncate text-sm text-muted-foreground">
            {clip.system_game?.name ?? "Unknown game"} · {formatDate(clip.created_at)}
          </p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground tabular-nums">
          <span className="flex items-center gap-1" title="Votes">
            <Vote className="size-4" /> {clip.votes_count ?? 0}
          </span>
          <span className="flex items-center gap-1" title="Likes">
            <Heart className="size-4" /> {clip.likes_count ?? 0}
          </span>
          <span className="flex items-center gap-1" title="Comments">
            <MessageCircle className="size-4" /> {clip.comments_count ?? 0}
          </span>
        </div>
        {children}
      </div>
    </Card>
  );
}
