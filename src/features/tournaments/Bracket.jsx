import { Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

// Positions 1..N are round one; each later round holds half as many; 2N-1 is the champion.
function bracketRounds(teamCount, brackets) {
  const byPosition = new Map(brackets.map((b) => [b.position, b]));
  const rounds = [];
  let start = 1;
  for (let size = teamCount; size >= 1; size = Math.floor(size / 2)) {
    rounds.push(Array.from({ length: size }, (_, i) => byPosition.get(start + i) ?? { position: start + i }));
    start += size;
  }
  return rounds;
}

const roundName = (index, total) =>
  index === total - 1 ? "Champion" : index === total - 2 ? "Final" : index === total - 3 ? "Semi-finals" : `Round ${index + 1}`;

function Slot({ slot, canPick, onPick }) {
  const team = slot.team?.[0];
  const name = team?.team_name ?? (slot.team_id ? slot.team_id : null);
  return (
    <button
      type="button"
      disabled={!canPick}
      onClick={onPick}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-card px-3 text-left text-sm",
        !name && "border-dashed text-muted-foreground",
        slot.elimination && "text-muted-foreground line-through opacity-60",
        slot.is_winner && "border-primary bg-accent font-medium",
        canPick && "cursor-pointer hover:border-primary hover:bg-accent",
      )}
      title={canPick ? `Pick ${name} as the winner` : undefined}
    >
      <span className="truncate">{name ?? "TBD"}</span>
      {slot.is_winner && <Crown className="size-4 shrink-0 text-primary" />}
    </button>
  );
}

// `onPickWinner(winnerSlot, loserSlot)` is offered for undecided matches with both sides filled
export default function Bracket({ teamCount, brackets, editable, onPickWinner }) {
  const rounds = bracketRounds(teamCount, brackets);
  return (
    <div className="flex gap-6 overflow-x-auto pb-2">
      {rounds.map((round, r) => (
        <div key={r} className="flex min-w-48 flex-col">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{roundName(r, rounds.length)}</p>
          <div className="flex flex-1 flex-col justify-around gap-4">
            {r === rounds.length - 1 ? (
              <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium dark:bg-amber-500/10">
                <Trophy className="size-4 text-amber-500" />
                {round[0]?.team?.[0]?.team_name ?? "To be decided"}
              </div>
            ) : (
              Array.from({ length: round.length / 2 }, (_, m) => {
                const [a, b] = [round[m * 2], round[m * 2 + 1]];
                const decided = a.elimination || b.elimination || a.is_winner || b.is_winner;
                const ready = editable && a.team_id && b.team_id && !decided;
                return (
                  <div key={m} className="space-y-1">
                    <Slot slot={a} canPick={ready} onPick={() => onPickWinner(a, b)} />
                    <Slot slot={b} canPick={ready} onPick={() => onPickWinner(b, a)} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
