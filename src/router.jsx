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
  "/": lazy(() => import("@/components/Dashboards/Dashboard")),
  "/games": lazy(() => import("@/components/Gaming/Games/Games")),
  "/daily-rewards": lazy(() => import("@/components/Gaming/Daily-Rewards/DailyRewards")),
  "/missions": lazy(() => import("@/components/Gaming/Missions/Missions")),
  "/epic-clips": lazy(() => import("@/components/Gaming/Epic-Clips/EpicClips")),
  "/strix-pass": lazy(() => import("@/components/Gaming/Strix-Pass/StrixPass")),
  "/tournaments": lazy(() => import("@/components/Gaming/Tournaments/Tournaments")),
  "/players": lazy(() => import("@/components/User/Players/Players")),
  "/channels": lazy(() => import("@/components/User/Channels-Chats/Channels")),
  "/sale-items": lazy(() => import("@/components/Shop&Support/Sale-Items/SaleItems")),
  "/game-topup": lazy(() => import("@/components/Shop&Support/Game-Topup/GameTopup")),
  "/support": lazy(() => import("@/components/Shop&Support/Customer-Support/Customer")),
  "/settings": lazy(() => import("@/components/Shop&Support/Settings/Settings")),
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
