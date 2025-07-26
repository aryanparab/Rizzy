'use client';

'use client'

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }) {
  return (
    <SessionProvider
      // Reduce refetch frequency to minimize API calls when switching tabs
      refetchInterval={5 * 60} // Refetch every 5 minutes (300 seconds) instead of constantly
      refetchOnWindowFocus={false} // Disable refetch when switching tabs/windows
      refetchWhenOffline={false} // Don't refetch when offline
    >
      {children}
    </SessionProvider>
  );
}

// Alternative configuration if you want some balance between security and performance:
/*
export function Providers({ children }) {
  return (
    <SessionProvider
      refetchInterval={10 * 60} // 10 minutes
      refetchOnWindowFocus={true} // Keep this but make it less aggressive with the NextAuth config
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
*/