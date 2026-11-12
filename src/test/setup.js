import "@testing-library/jest-dom/vitest";

// jsdom has no ResizeObserver; Radix switches and popovers measure themselves with it
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom lacks the pointer-capture and scroll methods Radix selects call when they open
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
