import { formatDuration, parseDuration } from "./duration";

test("lengths are read the way people write them", () => {
  expect(parseDuration("24:05")).toBe(1445);
  expect(parseDuration("1:02:30")).toBe(3750);
  expect(parseDuration(" 1608 ")).toBe(1608);
  expect(parseDuration("0:45")).toBe(45);
  expect(parseDuration("")).toBeNull();
  expect(parseDuration("24:5")).toBeNull();
  expect(parseDuration("2 minutes")).toBeNull();
});

test("lengths are shown as minutes and seconds", () => {
  expect(formatDuration(1445)).toBe("24:05");
  expect(formatDuration(3750)).toBe("1:02:30");
  expect(formatDuration(91)).toBe("1:31");
  expect(formatDuration(null)).toBe("");
});
