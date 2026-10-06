"use client";

import { useEffect, useState } from "react";
import { ApiError } from "./api";

interface QueryState<T> {
  key: string;
  data?: T;
  error?: { message: string; status?: number };
}

/**
 * Loads data whenever `key` changes (put everything the request depends on into the key).
 * The previous data stays available while the next load runs, so lists don't flash empty.
 */
export function useQuery<T>(key: string, load: () => Promise<T>) {
  const [state, setState] = useState<QueryState<T>>({ key: "" });

  useEffect(() => {
    let ignore = false;
    load().then(
      (data) => {
        if (!ignore) setState({ key, data });
      },
      (error: unknown) => {
        if (ignore) return;
        const message = error instanceof Error ? error.message : "Something went wrong.";
        const status = error instanceof ApiError ? error.status : undefined;
        setState((previous) => ({ key, data: previous.data, error: { message, status } }));
      },
    );
    return () => {
      ignore = true;
    };
    // `load` is a new function every render, the key is what says the inputs changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data: state.data, error: state.error, loading: state.key !== key };
}
