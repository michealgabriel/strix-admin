import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import { useCan } from "@/features/auth/useCan";
import { useListParams } from "@/hooks/useListParams";
import PurchasesQueue from "./PurchasesQueue";
import TopupGamesTab from "./TopupGamesTab";
import { useGetTopupPurchasesQuery } from "./topupsApi";

export default function GameTopupPage() {
  const list = useListParams();
  const canQueue = useCan("view_topup_purchases");
  const tab = list.get("tab") || (canQueue ? "purchases" : "games");
  const { data: waiting } = useGetTopupPurchasesQuery({ kind: "purchases", status: "pending" }, { skip: !canQueue });
  const { data: claims } = useGetTopupPurchasesQuery({ kind: "claims", status: "pending" }, { skip: !canQueue });
  const count = (d) => (d?.total > 0 ? <Badge className="ml-1 h-5 px-1.5">{d.total}</Badge> : null);

  return (
    <>
      <PageHeader title="Game Top-up" description="Deliver in-game currency players paid for or won, and set what can be bought." />
      <Tabs value={tab} onValueChange={(value) => list.set({ tab: value, status: "", q: "" })}>
        <TabsList className="mb-4">
          {canQueue && <TabsTrigger value="purchases">Purchases {count(waiting)}</TabsTrigger>}
          {canQueue && <TabsTrigger value="claims">Won currency {count(claims)}</TabsTrigger>}
          <TabsTrigger value="games">Top-up games</TabsTrigger>
        </TabsList>
        {canQueue && <TabsContent value="purchases"><PurchasesQueue kind="purchases" /></TabsContent>}
        {canQueue && <TabsContent value="claims"><PurchasesQueue kind="claims" /></TabsContent>}
        <TabsContent value="games"><TopupGamesTab /></TabsContent>
      </Tabs>
    </>
  );
}
