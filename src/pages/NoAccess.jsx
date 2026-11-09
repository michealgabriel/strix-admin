import { ShieldOff } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

export default function NoAccess() {
  return (
    <EmptyState
      icon={ShieldOff}
      title="You don't have access to this page"
      description="Ask an admin who manages roles to grant you the permission."
    />
  );
}
