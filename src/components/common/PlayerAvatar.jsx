import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function PlayerAvatar({ player, className }) {
  return (
    <Avatar className={cn("size-9", className)}>
      {player?.profile_image && <AvatarImage src={player.profile_image} alt="" />}
      <AvatarFallback>{(player?.username ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
