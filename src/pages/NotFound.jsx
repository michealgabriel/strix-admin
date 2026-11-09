import { Link } from "react-router";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";

export default function NotFound() {
  return (
    <EmptyState icon={SearchX} title="Page not found" description="This page doesn't exist or has moved.">
      <Button asChild variant="outline">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </EmptyState>
  );
}
