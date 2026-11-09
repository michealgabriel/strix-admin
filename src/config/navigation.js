import {
  Gamepad2,
  Gift,
  Flag,
  Clapperboard,
  Ticket,
  Trophy,
  Users,
  MessagesSquare,
  ShoppingBag,
  Wallet,
  Headset,
  Settings,
  LayoutDashboard,
} from "lucide-react";

// One list drives both the sidebar and the route guards.
// `permission` is any one of the names the admin must hold to see the page.
export const navigation = [
  {
    items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard, permission: null }],
  },
  {
    label: "Gaming",
    items: [
      { label: "Games", path: "/games", icon: Gamepad2, permission: "view_games" },
      { label: "Daily Rewards", path: "/daily-rewards", icon: Gift, permission: "view_daily_rewards" },
      { label: "Missions", path: "/missions", icon: Flag, permission: "view_missions" },
      { label: "Epic Clips", path: "/epic-clips", icon: Clapperboard, permission: "view_epic_clips" },
      { label: "Strix Pass", path: "/strix-pass", icon: Ticket, permission: "view_pass" },
      { label: "Tournaments", path: "/tournaments", icon: Trophy, permission: "view_tournaments" },
    ],
  },
  {
    label: "Users",
    items: [
      { label: "Players", path: "/players", icon: Users, permission: "view_users" },
      { label: "Channels", path: "/channels", icon: MessagesSquare, permission: "view_channels" },
    ],
  },
  {
    label: "Shop & Support",
    items: [
      { label: "Sale Items", path: "/sale-items", icon: ShoppingBag, permission: "view_shop_sale_items" },
      { label: "Game Top-up", path: "/game-topup", icon: Wallet, permission: "view_game_topups" },
      { label: "Customer Support", path: "/support", icon: Headset, permission: "manage_customer_supports" },
      {
        label: "Settings",
        path: "/settings",
        icon: Settings,
        permission: ["manage_system_countries", "view_system_admins", "view_roles"],
      },
    ],
  },
];

export const navItems = navigation.flatMap((group) => group.items);
