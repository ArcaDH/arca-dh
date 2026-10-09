"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, clearTokenCookie } from "@/api/client";

const isClientError = (error: unknown) => error instanceof ApiError && error.status >= 400 && error.status < 500;

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof ApiError && error.status === 401) {
              // Token is invalid/expired – clear it and redirect to login
              clearTokenCookie();
              router.push("/login");
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // one minute
            retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
