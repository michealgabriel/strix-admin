import { useState } from "react";
import { Crown, Loader2, Minus, Plus, RotateCcw, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { useCan } from "@/features/auth/useCan";
import { errorMessage } from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/format";
import { RewardRowEditor, RewardRowView } from "./RewardRow";
import { itemSlug } from "./rewardItems";
import { useGetClaimableItemsQuery, useGetStrixPassQuery, useSaveStrixPassMutation } from "./rewardsApi";

const MANIFEST_NAME = "Strix Pass Manifest";
const TRACKS = [
  { key: "freepass", label: "Free", icon: Ticket },
  { key: "vippass", label: "VIP", icon: Crown },
];
const blankLevel = (level) => ({ level: String(level), item_name: "strixgold", item_quantity: "50" });

export default function StrixPassPage() {
  const { data, isLoading, error, refetch } = useGetStrixPassQuery();
  const { data: items = [] } = useGetClaimableItemsQuery();

  return (
    <>
      <PageHeader
        title="Strix Pass"
        description="The season pass: players unlock a level for every 1,000 XP. Everyone gets the free track; VIP holders also get the VIP track. A season runs 24 days."
      />
      {error ? (
        <EmptyState icon={Ticket} title="Couldn't load the seasons" description={errorMessage(error)}>
          <Button variant="outline" size="sm" onClick={refetch}>
            Try again
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <CurrentSeason season={data?.active} items={items} isLoading={isLoading} />
          <NextSeason season={data?.next} hasActive={!!data?.active} items={items} isLoading={isLoading} />
        </div>
      )}
    </>
  );
}

function TrackTabs({ children }) {
  return (
    <Tabs defaultValue="freepass">
      <TabsList>
        {TRACKS.map(({ key, label, icon: Icon }) => (
          <TabsTrigger key={key} value={key}>
            <Icon /> {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TRACKS.map(({ key }) => (
        <TabsContent key={key} value={key} className="space-y-2 pt-2">
          {children(key)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function CurrentSeason({ season, items, isLoading }) {
  const levels = season?.manifest?.data?.freepass?.length ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          This season {season && <Badge variant="secondary">{levels} levels</Badge>}
        </CardTitle>
        <CardDescription>
          {season ? `Ends ${formatDate(season.expiration_date, true)} (${formatRelative(season.expiration_date)})` : " "}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : !season ? (
          <p className="text-sm text-muted-foreground">No season is running.</p>
        ) : (
          <TrackTabs>
            {(track) =>
              (season.manifest?.data?.[track] ?? []).map((row, i) => (
                <RewardRowView key={i} label={`Level ${row.level}`} row={row} items={items} />
              ))
            }
          </TrackTabs>
        )}
      </CardContent>
    </Card>
  );
}

function NextSeason({ season, hasActive, items, isLoading }) {
  const canEdit = useCan("create_pass");
  const [draft, setDraft] = useState(null);
  const [save, { isLoading: saving }] = useSaveStrixPassMutation();
  const tracks = draft ?? season?.manifest?.data ?? null;
  const levels = tracks?.freepass?.length ?? 0;

  const start = () => setDraft({ freepass: [1, 2, 3, 4, 5].map(blankLevel), vippass: [1, 2, 3, 4, 5].map(blankLevel) });

  // Both tracks always have the same number of levels
  const resize = (delta) => {
    const size = Math.max(1, levels + delta);
    const fit = (rows) =>
      size > rows.length ? [...rows, ...Array.from({ length: size - rows.length }, (_, i) => blankLevel(rows.length + i + 1))] : rows.slice(0, size);
    setDraft({ freepass: fit(tracks.freepass), vippass: fit(tracks.vippass) });
  };

  const setRow = (track, index, row) =>
    setDraft({ ...tracks, [track]: tracks[track].map((r, i) => (i === index ? row : r)) });

  const submit = async (event) => {
    event.preventDefault();
    const clean = (rows) =>
      rows.map((row, i) => ({ level: String(i + 1), item_name: itemSlug(row.item_name), item_quantity: String(row.item_quantity) }));
    try {
      await save({
        manifest: { name: MANIFEST_NAME, data: { vippass: clean(tracks.vippass), freepass: clean(tracks.freepass) } },
        replaceNext: !!season,
      }).unwrap();
      toast.success(season ? "Next season updated" : hasActive ? "Next season queued" : "Season started");
      setDraft(null);
    } catch {
      // toast from the store
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Next season {tracks && <Badge variant="secondary">{levels} levels</Badge>}
        </CardTitle>
        <CardDescription>
          {season
            ? `Starts when this season ends and runs until ${formatDate(season.expiration_date, true)}.`
            : hasActive
              ? "Nothing is queued. Without a next season the pass stops when this one ends."
              : "Set up a season to start the pass now."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : !tracks ? (
          canEdit ? (
            <Button onClick={start}>
              <Plus /> {hasActive ? "Queue next season" : "Start a season"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing queued.</p>
          )
        ) : !canEdit ? (
          <TrackTabs>
            {(track) => tracks[track].map((row, i) => <RewardRowView key={i} label={`Level ${i + 1}`} row={row} items={items} />)}
          </TrackTabs>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Levels</span>
              <Button type="button" variant="outline" size="icon-sm" aria-label="Remove a level" disabled={levels <= 1} onClick={() => resize(-1)}>
                <Minus />
              </Button>
              <span className="w-8 text-center font-medium tabular-nums">{levels}</span>
              <Button type="button" variant="outline" size="icon-sm" aria-label="Add a level" disabled={levels >= 100} onClick={() => resize(1)}>
                <Plus />
              </Button>
            </div>
            <TrackTabs>
              {(track) =>
                tracks[track].map((row, i) => (
                  <RewardRowEditor key={i} label={`Level ${i + 1}`} row={row} items={items} onChange={(next) => setRow(track, i, next)} />
                ))
              }
            </TrackTabs>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || (!draft && !!season)}>
                {saving && <Loader2 className="animate-spin" />}
                {season ? "Save next season" : hasActive ? "Queue next season" : "Start this season"}
              </Button>
              {draft && (
                <Button type="button" variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
                  <RotateCcw /> Discard changes
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
