/**
 * React Query Provider
 * 
 * Handles server state management with:
 * - Automatic caching
 * - Background refetching
 * - Optimistic updates
 * - Retry logic
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Configure query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh
      staleTime: 30 * 1000, // 30 seconds
      
      // Cache time: how long to keep unused data in cache
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      
      // Retry failed requests
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus
      refetchOnWindowFocus: false,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Provides React Query client to app
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export { queryClient };
