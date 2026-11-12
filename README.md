# Strix Admin

The operations dashboard for Strix: games, rewards, missions, the Strix Pass, tournaments, players, channels, the shop, game top-ups, support and system settings. It talks to the Strix backend API with an admin token.

## Run it

```bash
cp .env.example .env    # then point VITE_API_URL at the backend
npm install
npm run dev             # http://localhost:3000
```

`VITE_API_URL` is the backend's `/api` base, without a trailing slash. Use `http://localhost:8000/api` with a local backend (`php artisan serve`). Point it at production only on purpose: every change you make there is real.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit and component tests |
| `npm run format` | Prettier over `src/` |

## How it's built

- **React 19 + Vite**, plain JavaScript.
- **Routing:** React Router. Every page has its own URL, so pages survive a reload and can be shared.
- **Importing games:** Games → Import from JSON (`/games/import`) reads a file like `mobile_games_v3.json` in the browser, matches each game to Strix by name, and shows it as an editable card with its own cover picker. Import then creates missing genres and saves each game and its objectives one at a time, so a failure only affects its own card and can be retried. Existing games are updated; their objectives that aren't in the file are kept.
- **Signed-out pages:** `/login`, and `/set-password?email=…&token=…`, which new admins and admins whose password was reset open from their email to choose a password. The backend's `ADMIN_APP_URL` must point at this app for those links to work.
- **Data:** Redux Toolkit with **RTK Query**. `src/lib/api.js` holds the one API client. It adds the token, ends the session on a 401, and turns errors into readable messages. Each feature adds its endpoints with `api.injectEndpoints`, and a failed change shows a toast automatically.
- **UI:** Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com) components in `src/components/ui`. The theme tokens, Strix green and dark mode, are in `src/index.css`. Add a component with `npx shadcn@3 add <name>`.
- **Live updates:** Pusher, through `pusher-js`. The backend sends the Pusher key and cluster with the admin profile, so there's nothing to configure here. `useRealtimeChannel(name, handlers, onReconnect)` in `src/hooks` subscribes to a private channel while a page is open, and returns whether it's live. Customer Support uses it, and falls back to polling when it isn't live. The connection lives in `src/lib/realtime.js` and closes on sign-out.
- **Permissions:** the backend sends the admin's permission names at sign-in and from `GET /auth/admin/me`. `src/config/navigation.js` lists every page with the permission it needs, and both the sidebar and the route guards read it. Use `useCan("edit_games")` or `<Can permission="edit_games">` to hide actions. The backend enforces permissions too, so hiding is only for clarity.

```
src/
  app/store.js           Redux store
  lib/api.js             API client (RTK Query), list and form helpers, error messages
  lib/format.js          Numbers, money and dates
  lib/realtime.js        The Pusher connection
  config/navigation.js   Pages, icons and permissions
  router.jsx             Routes; each page loads on first visit
  features/<area>/       One folder per area: its API endpoints, page and parts
                         (auth, dashboard, games, rewards, clips, settings, …)
  layouts/               App shell: sidebar and top bar
  components/ui/         shadcn/ui primitives
  components/common/     DataTable, PageHeader, StatCard, ConfirmDialog, FormField, …
  hooks/                 useListParams (page/search in the URL), useDebouncedValue, useRealtimeChannel
  pages/                 Not found and no access
  components/<Area>/     Pages from the first version, being rebuilt into features/
```

## Conventions

- Lists keep their page, search and filters in the URL through `useListParams`.
- Ask before anything destructive or irreversible with `ConfirmDialog`.
- Forms show the server's field errors next to each field with `FormField` and `fieldErrors()`; other failures appear as a toast automatically.
- Never put secrets in this app: everything in `VITE_*` ships to the browser.
- Admin sessions last 12 hours. Signing out revokes the token on the server.
