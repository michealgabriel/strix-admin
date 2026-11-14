import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import { useListParams } from "@/hooks/useListParams";
import EconomyOverview from "./EconomyOverview";
import EconomySettings from "./EconomySettings";

export default function EconomyPage() {
  const list = useListParams();
  const tab = list.get("tab") === "settings" ? "settings" : "overview";

  return (
    <>
      <PageHeader title="Economy" description="How Strix Gold moves between players and the shop, and the numbers that control it." />
      <Tabs value={tab} onValueChange={(value) => list.set({ tab: value })}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <EconomyOverview />
        </TabsContent>
        <TabsContent value="settings">
          <EconomySettings />
        </TabsContent>
      </Tabs>
    </>
  );
}
