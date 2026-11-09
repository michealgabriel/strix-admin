import { NavLink } from "react-router";
import { navigation } from "@/config/navigation";
import { useCan } from "@/features/auth/useCan";
import { cn } from "@/lib/utils";

function NavItem({ item, onNavigate }) {
  const allowed = useCan(item.permission);
  if (!allowed) return null;
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </NavLink>
  );
}

function NavGroup({ group, onNavigate }) {
  // Hide a group heading when the admin can't open anything in it
  const visible = useCan(group.items.flatMap((item) => item.permission ?? []));
  const open = group.items.some((item) => !item.permission);
  if (!visible && !open) return null;

  return (
    <div className="space-y-1">
      {group.label && (
        <p className="px-3 pt-4 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {group.label}
        </p>
      )}
      {group.items.map((item) => (
        <NavItem key={item.path} item={item} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1 p-3">
      {navigation.map((group, i) => (
        <NavGroup key={group.label ?? i} group={group} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
