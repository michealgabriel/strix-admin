import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Outlet } from "react-router";
import { RequireAuth, RequirePermission } from "./RequireAuth";
import LoginPage from "./LoginPage";
import { makeStore, renderRoutes, stubApi } from "@/test/utils";

const admin = { id: 1, name: "Mike", email: "mike@strix.com", is_base: false, role: { name: "Support" } };

const routes = [
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Outlet />,
        children: [
          { index: true, element: <p>Dashboard home</p> },
          {
            path: "games",
            element: (
              <RequirePermission permission="view_games">
                <p>Games page</p>
              </RequirePermission>
            ),
          },
        ],
      },
    ],
  },
];

afterEach(() => localStorage.clear());

test("signing in stores the token and the permissions, then opens the dashboard", async () => {
  const calls = stubApi({
    "/auth/admin/login": [200, { admin, permissions: ["view_games"], admin_access_token: "tok-1" }],
  });
  const { store } = renderRoutes(routes, { path: "/login" });

  await userEvent.type(screen.getByLabelText("Email"), "mike@strix.com");
  await userEvent.type(screen.getByLabelText("Password"), "Secret@123");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Dashboard home")).toBeInTheDocument();
  expect(store.getState().auth.permissions).toEqual(["view_games"]);
  expect(localStorage.getItem("strix_token")).toBe("tok-1");
  expect(calls[0]).toMatchObject({ path: "/auth/admin/login", method: "POST" });
});

test("a wrong password shows the server's message", async () => {
  stubApi({ "/auth/admin/login": [401, { message: "Email or password incorrect" }] });
  renderRoutes(routes, { path: "/login" });

  await userEvent.type(screen.getByLabelText("Email"), "mike@strix.com");
  await userEvent.type(screen.getByLabelText("Password"), "nope");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Email or password incorrect");
});

test("a saved token loads the profile with the bearer header before showing pages", async () => {
  const calls = stubApi({ "/auth/admin/me": [200, { admin, permissions: ["view_games"] }] });
  renderRoutes(routes, { store: makeStore({ token: "tok-2" }), path: "/games" });

  expect(await screen.findByText("Games page")).toBeInTheDocument();
  expect(calls[0]).toMatchObject({ path: "/auth/admin/me", auth: "Bearer tok-2" });
});

test("pages need their permission", async () => {
  stubApi({ "/auth/admin/me": [200, { admin, permissions: [] }] });
  renderRoutes(routes, { store: makeStore({ token: "tok-3" }), path: "/games" });

  expect(await screen.findByText("You don't have access to this page")).toBeInTheDocument();
});

test("the base admin can open every page", async () => {
  stubApi({ "/auth/admin/me": [200, { admin: { ...admin, is_base: true }, permissions: [] }] });
  renderRoutes(routes, { store: makeStore({ token: "tok-4" }), path: "/games" });

  expect(await screen.findByText("Games page")).toBeInTheDocument();
});

test("an expired token sends the admin back to sign in with a reason", async () => {
  localStorage.setItem("strix_token", "old");
  stubApi({ "/auth/admin/me": [401, { message: "Unauthorized access" }] });
  const { store } = renderRoutes(routes, { store: makeStore({ token: "old" }), path: "/games" });

  expect(await screen.findByText("Your session has ended. Please sign in again.")).toBeInTheDocument();
  await waitFor(() => expect(store.getState().auth.token).toBeNull());
  expect(localStorage.getItem("strix_token")).toBeNull();
});
