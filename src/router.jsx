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
  "/missions": lazy(() => import("@/features/missions/MissionsPage")),
  "/epic-clips": lazy(() => import("@/features/clips/EpicClipsPage")),
  "/strix-pass": lazy(() => import("@/features/rewards/StrixPassPage")),
  "/tournaments": lazy(() => import("@/features/tournaments/TournamentsPage")),
  "/players": lazy(() => import("@/features/players/PlayersPage")),
  "/channels": lazy(() => import("@/features/channels/ChannelsPage")),
  "/sale-items": lazy(() => import("@/features/shop/SaleItemsPage")),
  "/game-topup": lazy(() => import("@/features/topups/GameTopupPage")),
  "/support": lazy(() => import("@/features/support/SupportPage")),
  "/reports": lazy(() => import("@/features/reports/ReportsPage")),
  "/orders": lazy(() => import("@/features/orders/OrdersPage")),
  "/campaigns": lazy(() => import("@/features/campaigns/CampaignsPage")),
  "/settings": lazy(() => import("@/features/settings/SettingsPage")),
};

// Pages inside an area, guarded like the area's main page
const extraRoutes = [
  { path: "players/:playerId", parent: "/players", Page: lazy(() => import("@/features/players/PlayerDetailPage")) },
  { path: "campaigns/new", parent: "/campaigns", Page: lazy(() => import("@/features/campaigns/CampaignEditorPage")) },
  { path: "campaigns/:campaignId", parent: "/campaigns", Page: lazy(() => import("@/features/campaigns/CampaignEditorPage")) },
  { path: "tournaments/:tournamentId", parent: "/tournaments", Page: lazy(() => import("@/features/tournaments/TournamentDetailPage")) },
];

// The permission for each page comes from the same list as the sidebar
const guarded = (path) => guardedPage(path, pages[path]);

function guardedPage(path, Page) {
  const item = navItems.find((entry) => entry.path === path);
  return (
    <RequirePermission permission={item?.permission}>
      <Suspense fallback={<PageLoading />}>
        <Page />
      </Suspense>
    </RequirePermission>
  );
}

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
          ...extraRoutes.map(({ path, parent, Page }) => ({ path, element: guardedPage(parent, Page) })),
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
