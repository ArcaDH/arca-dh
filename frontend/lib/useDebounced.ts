"use client";

import { useEffect, useState } from "react";

/** The value, but only after it has stopped changing for `delayMs` (so searching waits until typing pauses). */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
