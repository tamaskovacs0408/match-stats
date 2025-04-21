"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Optional: Import React Query DevTools for debugging
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Use useState to ensure QueryClient is only created once per component instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default stale time for queries (e.g., 5 minutes)
            staleTime: 1000 * 60 * 5,
            // Default garbage collection time (e.g., 10 minutes)
            gcTime: 1000 * 60 * 10,
            // Disable refetching on window focus by default if desired
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Optional: Add React Query DevTools for development environment */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
