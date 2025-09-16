import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
})

function DevtoolsLazy() {
  const [Devtools, setDevtools] = useState(null)
  useEffect(() => {
    if (import.meta.env.DEV) {
      import('@tanstack/react-query-devtools').then((m) => {
        setDevtools(() => m.ReactQueryDevtools)
      })
    }
  }, [])
  return Devtools ? <Devtools initialIsOpen={false} /> : null
}

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <DevtoolsLazy />
    </QueryClientProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { queryClient }
