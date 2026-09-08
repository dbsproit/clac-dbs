"use client";
import { useEffect, useState } from "react";

/**
 * Returns true once the component has mounted on the client. Used to defer
 * rendering of persisted (localStorage-backed) state so server and first client
 * render match and React doesn't throw a hydration mismatch.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
