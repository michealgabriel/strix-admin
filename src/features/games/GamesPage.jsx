import { useState } from "react";
import { ListChecks, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import SearchInput from "@/components/common/SearchInput";
import StatusBadge from "@/components/common/StatusBadge";
import { Can } from "@/features/auth/permissions";
import { useCan } from "@/features/auth/useCan";
import { useListParams } from "@/hooks/useListParams";
import { errorMessage } from "@/lib/api";
import { Gamepad2 } from "lucide-react";
import GameFormDialog from "./GameFormDialog";
import GameObjectivesSheet from "./GameObjectivesSheet";
import GenresTab from "./GenresTab";
import { useGetGamesQuery } from "./gamesApi";

export default function GamesPage() {
  const list = useListParams();
  const tab = list.get("tab") || "games";
  const canSeeGenres = useCan("view_genres");

  return (
    <>
      <PageHeader title="Games" description="The games players can pick, and the genres they belong to." />
      <Tabs value={tab} onValueChange={(value) => list.set({ tab: value === "games" ? "" : value, q: "" })}>
        <TabsList className="mb-4">
          <TabsTrigger value="games">Games</TabsTrigger>
          {canSeeGenres && <TabsTrigger value="genres">Genres</TabsTrigger>}
        </TabsList>
        <TabsContent value="games">
          <GamesGrid list={list} />
        </TabsContent>
        {canSeeGenres && (
          <TabsContent value="genres">
            <GenresTab />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

function GamesGrid({ list }) {
  const search = list.get("q");
  const { data, isLoading, isFetching, error, refetch } = useGetGamesQuery({ page: list.page, search });
  const [editing, setEditing] = useState(null); // null closed, {} new, game to edit
  const [objectivesFor, setObjectivesFor] = useState(null);
  const canEdit = useCan("edit_games");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={(q) => list.set({ q })} placeholder="Search games" />
        <Can permission="create_games">
          <Button className="sm:ml-auto" onClick={() => setEditing({})}>
            <Plus /> Add game
          </Button>
        </Can>
      </div>

      {error ? (
        <EmptyState icon={Gamepad2} title="Couldn't load games" description={errorMessage(error)}>
          <Button variant="outline" size="sm" onClick={refetch}>
            Try again
          </Button>
        </EmptyState>
      ) : !isLoading && data?.items.length === 0 ? (
        <EmptyState
          icon={Gamepad2}
          title={search ? "No games match your search" : "No games yet"}
          description={search ? undefined : "Add the first game players can pick."}
        />
      ) : (
        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${isFetching && !isLoading ? "opacity-70" : ""}`}>
          {isLoading
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)
            : data.items.map((game) => (
                <Card key={game.id} className="gap-0 overflow-hidden py-0">
                  <div className="relative aspect-video bg-muted">
                    {game.cover_image && (
                      <img src={game.cover_image} alt="" className="size-full object-cover" loading="lazy" />
                    )}
                    <StatusBadge status={game.status} className="absolute top-2 right-2 bg-background/90" />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{game.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[game.genre?.name, game.platform?.name].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => setEditing(game)}>
                          <Pencil /> Edit
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setObjectivesFor(game)}>
                        <ListChecks /> Objectives
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
        </div>
      )}

      {!error && (
        <Pagination
          page={list.page}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={list.setPage}
        />
      )}

      <GameFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        game={editing?.id ? editing : null}
      />
      <GameObjectivesSheet game={objectivesFor} onOpenChange={(open) => !open && setObjectivesFor(null)} />
    </div>
  );
}
