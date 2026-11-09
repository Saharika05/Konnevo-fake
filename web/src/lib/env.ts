/**
 * The ONLY setting the app reads. Empty means "use the built-in mock API".
 * Set it to the real API address and nothing else in the code changes.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const USE_MOCKS = API_URL === "";
