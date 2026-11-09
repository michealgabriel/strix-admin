import { useState } from "react";
import { Link, Outlet } from "react-router";
import { useSelector } from "react-redux";
import { KeyRound, LogOut, Menu, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { selectAdmin } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/authApi";
import ChangePasswordDialog from "@/features/auth/ChangePasswordDialog";
import Sidebar from "./Sidebar";

function Logo() {
  return (
    <Link to="/" className="text-lg font-bold tracking-tight">
      STRIX <span className="text-primary">Admin</span>
    </Link>
  );
}

function AccountMenu() {
  const admin = useSelector(selectAdmin);
  const [logout, { isLoading }] = useLogoutMutation();
  const { theme, setTheme } = useTheme();
  const [changingPassword, setChangingPassword] = useState(false);
  const initial = (admin?.name || admin?.email || "A").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
          <Avatar className="size-8">
            <AvatarFallback className="bg-accent text-accent-foreground">{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium">{admin?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{admin?.email}</p>
          <p className="truncate text-xs text-muted-foreground">
            {admin?.is_base ? "Owner" : (admin?.role?.name ?? "No role")}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setChangingPassword(true)}>
          <KeyRound /> Change password
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isLoading} onSelect={() => logout()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
      <ChangePasswordDialog open={changingPassword} onOpenChange={setChangingPassword} />
    </DropdownMenu>
  );
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu />
        </Button>
        <Logo />
        <div className="ml-auto">
          <AccountMenu />
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 overflow-y-auto bg-sidebar p-0">
          <SheetTitle className="px-6 pt-5">
            <Logo />
          </SheetTitle>
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r bg-sidebar lg:block">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
