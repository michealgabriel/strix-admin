import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import PageLoading from "@/components/common/PageLoading";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/features/auth/LoginPage";
import { RequireAuth, RequirePermission } from "@/features/auth/RequireAuth";
import { navItems } from "@/config/navigation";
import NotFound from "@/pages/NotFound";

// Each page loads on first visit, so the sign-in screen stays small.
// Pages from the first version live in src/components; each moves to src/pages as it is rebuilt.
const pages = {
  "/": lazy(() => import("@/features/dashboard/DashboardPage")),
  "/games": lazy(() => import("@/features/games/GamesPage")),
  "/daily-rewards": lazy(() => import("@/features/rewards/DailyRewardsPage")),
  "/missions": lazy(() => import("@/components/Gaming/Missions/Missions")),
  "/epic-clips": lazy(() => import("@/features/clips/EpicClipsPage")),
  "/strix-pass": lazy(() => import("@/features/rewards/StrixPassPage")),
  "/tournaments": lazy(() => import("@/components/Gaming/Tournaments/Tournaments")),
  "/players": lazy(() => import("@/components/User/Players/Players")),
  "/channels": lazy(() => import("@/components/User/Channels-Chats/Channels")),
  "/sale-items": lazy(() => import("@/components/Shop&Support/Sale-Items/SaleItems")),
  "/game-topup": lazy(() => import("@/components/Shop&Support/Game-Topup/GameTopup")),
  "/support": lazy(() => import("@/components/Shop&Support/Customer-Support/Customer")),
  "/settings": lazy(() => import("@/features/settings/SettingsPage")),
};

// The permission for each page comes from the same list as the sidebar
const guarded = (path) => {
  const Page = pages[path];
  const item = navItems.find((entry) => entry.path === path);
  return (
    <RequirePermission permission={item?.permission}>
      <Suspense fallback={<PageLoading />}>
        <Page />
      </Suspense>
    </RequirePermission>
  );
};

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: guarded("/") },
          ...Object.keys(pages)
            .filter((path) => path !== "/")
            .map((path) => ({ path: path.slice(1), element: guarded(path) })),
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
