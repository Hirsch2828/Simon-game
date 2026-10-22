import '@testing-library/jest-dom/vitest';

// Every test starts with an empty history
beforeEach(() => {
  window.localStorage.clear();
});
