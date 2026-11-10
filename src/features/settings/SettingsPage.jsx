import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import { useCan } from "@/features/auth/useCan";
import { useListParams } from "@/hooks/useListParams";
import ActivityTab from "./ActivityTab";
import AdminsTab from "./AdminsTab";
import CountriesTab from "./CountriesTab";
import RolesTab from "./RolesTab";

export default function SettingsPage() {
  const list = useListParams();
  const tabs = [
    { value: "admins", label: "Admins", allowed: useCan("view_system_admins"), Content: AdminsTab },
    { value: "roles", label: "Roles", allowed: useCan("view_roles"), Content: RolesTab },
    // Countries are public to read, but only shown to admins who manage them
    { value: "countries", label: "Countries", allowed: useCan("manage_system_countries"), Content: CountriesTab },
    { value: "activity", label: "Activity log", allowed: useCan("view_activity_log"), Content: ActivityTab },
  ].filter((tab) => tab.allowed);
  const current = tabs.some((tab) => tab.value === list.get("tab")) ? list.get("tab") : tabs[0]?.value;

  return (
    <>
      <PageHeader title="Settings" description="Who can use this dashboard, what they can do, and the countries top-ups are priced in." />
      <Tabs value={current} onValueChange={(tab) => list.set({ tab })}>
        <TabsList className="mb-4">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(({ value, Content }) => (
          <TabsContent key={value} value={value}>
            <Content />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
