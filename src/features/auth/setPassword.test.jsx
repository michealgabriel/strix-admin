import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetPasswordPage from "./SetPasswordPage";
import { renderRoutes, stubApi } from "@/test/utils";

const routes = [
  { path: "/set-password", element: <SetPasswordPage /> },
  { path: "/login", element: <p>Sign-in page</p> },
];

async function fillIn(password, confirm) {
  await userEvent.type(screen.getByLabelText("New password"), password);
  await userEvent.type(screen.getByLabelText("Confirm password"), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Set password" }));
}

test("an invited admin chooses a password from the emailed link, then signs in", async () => {
  const calls = stubApi({ "/auth/admin/set-password": [200, { message: "Password set. You can sign in now." }] });
  renderRoutes(routes, { path: "/set-password?email=ada%40strix.com&token=abc" });

  expect(screen.getByText("ada@strix.com")).toBeInTheDocument();
  await fillIn("Chosen@123", "Chosen@123");

  expect(await screen.findByText("Your password is set.")).toBeInTheDocument();
  expect(calls[0]).toMatchObject({ path: "/auth/admin/set-password", method: "POST", auth: null });
  await userEvent.click(screen.getByRole("link", { name: "Sign in" }));
  expect(await screen.findByText("Sign-in page")).toBeInTheDocument();
});

test("mismatched passwords are caught before sending", async () => {
  const calls = stubApi({});
  renderRoutes(routes, { path: "/set-password?email=ada%40strix.com&token=abc" });

  await fillIn("Chosen@123", "Other@1234");

  expect(screen.getByRole("alert")).toHaveTextContent("don't match");
  expect(calls).toHaveLength(0);
});

test("an expired link shows the server's explanation", async () => {
  stubApi({ "/auth/admin/set-password": [422, { message: "This link has expired or was already used. Ask another admin to send a new one." }] });
  renderRoutes(routes, { path: "/set-password?email=ada%40strix.com&token=old" });

  await fillIn("Chosen@123", "Chosen@123");

  expect(await screen.findByRole("alert")).toHaveTextContent("expired or was already used");
});

test("a link without its token says so", () => {
  stubApi({});
  renderRoutes(routes, { path: "/set-password?email=ada%40strix.com" });

  expect(screen.getByRole("alert")).toHaveTextContent("This link is incomplete");
});
