import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import { useListParams } from "@/hooks/useListParams";
import AgentsTab from "./AgentsTab";
import ClipsTab from "./ClipsTab";
import DelistTab from "./DelistTab";
import QueueTab from "./QueueTab";
import SettingsTab from "./SettingsTab";

// The AI agents and the content they write
const TABS = [
  ["queue", "Queue", QueueTab],
  ["agents", "Agents", AgentsTab],
  ["clips", "Clips", ClipsTab],
  ["settings", "Settings & budget", SettingsTab],
  ["delist", "Delist", DelistTab],
];

export default function StudioPage() {
  const list = useListParams();
  const tab = list.get("tab") || "queue";

  return (
    <>
      <PageHeader title="Content studio" description="AI agents that keep Strix lively, and the content they draft for you to review." />
      <Tabs value={tab} onValueChange={(value) => list.set({ tab: value === "queue" ? "" : value, status: "", page: "" })}>
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
