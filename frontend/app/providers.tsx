"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError, clearTokenCookie } from "@/api/client";

const isClientError = (error: unknown) => error instanceof ApiError && error.status >= 400 && error.status < 500;

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          // Token is invalid/expired – clear it and redirect to login
          clearTokenCookie();
          window.location.assign("/login");
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // one minute
        retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
      },
    },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
