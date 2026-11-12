import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import SearchableSelect from "./SearchableSelect";

const GAMES = [
  { value: "", label: "No game (general)" },
  { value: "1", label: "Call of Duty: Mobile" },
  { value: "2", label: "Free Fire" },
  { value: "3", label: "Free Fire MAX" },
  { value: "4", label: "PUBG Mobile" },
];

function Picker({ onPick }) {
  const [value, setValue] = useState("");
  return <SearchableSelect label="Game" value={value} onChange={(next) => { setValue(next); onPick(next); }} options={GAMES} searchPlaceholder="Type a game's name" />;
}

test("typing filters the list and Enter picks the highlighted game", async () => {
  const onPick = vi.fn();
  render(<Picker onPick={onPick} />);

  await userEvent.click(screen.getByRole("combobox", { name: "Game" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Type a game's name" }), "free");
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Free Fire", "Free Fire MAX"]);

  await userEvent.keyboard("{ArrowDown}{Enter}");
  expect(onPick).toHaveBeenCalledWith("3");
  expect(screen.getByRole("combobox", { name: "Game" })).toHaveTextContent("Free Fire MAX");
});

test("clicking picks, and a search with no match says so", async () => {
  const onPick = vi.fn();
  render(<Picker onPick={onPick} />);

  await userEvent.click(screen.getByRole("combobox", { name: "Game" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Type a game's name" }), "zzz");
  expect(screen.getByText("Nothing matches")).toBeInTheDocument();
  await userEvent.clear(screen.getByRole("textbox", { name: "Type a game's name" }));
  await userEvent.click(screen.getByRole("option", { name: "PUBG Mobile" }));
  expect(onPick).toHaveBeenCalledWith("4");
});
