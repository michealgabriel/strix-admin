import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import { useListParams } from "@/hooks/useListParams";
import AgentsTab from "./AgentsTab";

// The AI agents and the content they write. More tabs (queue, schedule, clips, budget) arrive with each phase.
const TABS = [["agents", "Agents", AgentsTab]];

export default function StudioPage() {
  const list = useListParams();
  const tab = list.get("tab") || "agents";

  return (
    <>
      <PageHeader title="Content studio" description="AI agents that keep Strix lively, and the content they draft for you to review." />
      <Tabs value={tab} onValueChange={(value) => list.set({ tab: value === "agents" ? "" : value })}>
        <TabsList className="mb-4">
          {TABS.map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}
        </TabsList>
        {TABS.map(([value, , Component]) => (
          <TabsContent key={value} value={value}><Component /></TabsContent>
        ))}
      </Tabs>
    </>
  );
}
