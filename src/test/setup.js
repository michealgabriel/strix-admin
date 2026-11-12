import "@testing-library/jest-dom/vitest";

// jsdom has no ResizeObserver; Radix switches and popovers measure themselves with it
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
