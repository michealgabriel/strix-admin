import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RolesTab from "./RolesTab";
import { makeStore, renderRoutes } from "@/test/utils";

const PERMISSIONS = [
  { id: 1, name: "view_users" },
  { id: 2, name: "moderate_players" },
  { id: 3, name: "manage_strix_posts" },
];
const ROLES = [
  { id: 1, name: "Admin", is_full_access: true, permissions: PERMISSIONS },
  { id: 2, name: "Customer Support", is_full_access: false, permissions: [PERMISSIONS[0]] },
];

function fakeBackend() {
  const calls = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  globalThis.fetch = vi.fn(async (input) => {
    const request = input instanceof Request ? input : new Request(input);
    const path = new URL(request.url).pathname.replace(/^\/api/, "");
    const call = { method: request.method, path, body: request.method === "PUT" ? await request.json() : null };
    calls.push(call);
    if (path === "/systemroles" && request.method === "GET") return json(200, { data: ROLES });
    if (path === "/systempermissions") return json(200, { data: PERMISSIONS });
    if (request.method === "PUT") return json(200, { role: ROLES[0] });
    return json(404, { message: "Not found" });
  });
  return calls;
}

const routes = [{ path: "/", element: <RolesTab /> }];
const store = () => makeStore({ token: "tok", permissions: ["view_roles", "edit_roles"] });

test("the Admin role shows full access, can't be deleted, and its boxes are locked on", async () => {
  const calls = fakeBackend();
  renderRoutes(routes, { store: store() });

  expect(await screen.findByText("Full access")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete Admin" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Delete Customer Support" })).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Edit Admin" }));
  const dialog = await screen.findByRole("dialog");
  const box = await within(dialog).findByRole("checkbox", { name: "Write, edit and delete Strix posts" });
  expect(box).toBeChecked();
  expect(box).toBeDisabled();
  expect(within(dialog).getByText(/always has every permission/)).toBeInTheDocument();

  await userEvent.click(within(dialog).getByRole("button", { name: "Save role" }));
  await waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true));
  expect(calls.find((call) => call.method === "PUT").body.permission_ids).toBeUndefined();
});

test("other roles show their groups with plain labels and can be changed", async () => {
  fakeBackend();
  renderRoutes(routes, { store: store() });

  await userEvent.click(await screen.findByRole("button", { name: "Edit Customer Support" }));
  const dialog = await screen.findByRole("dialog");
  const ban = await within(dialog).findByRole("checkbox", { name: "Suspend and ban players" });
  expect(ban).not.toBeChecked();
  expect(ban).toBeEnabled();
  expect(within(dialog).getByText("(1 of 3 selected)")).toBeInTheDocument();
});
