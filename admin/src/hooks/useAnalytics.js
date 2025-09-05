import { useQuery } from '@tanstack/react-query'
import { http } from '../services/http'

// Query keys
export const analyticsKeys = {
  all: ['analytics'],
  overview: (scope, shortcode, range) => [...analyticsKeys.all, 'overview', scope, shortcode, range],
  timeseries: (scope, shortcode, range) => [...analyticsKeys.all, 'timeseries', scope, shortcode, range],
  breakdown: (scope, shortcode, range, dimension) => [...analyticsKeys.all, 'breakdown', scope, shortcode, range, dimension],
}

// Helper to build query parameters
function buildAnalyticsParams(scope, shortcode, range = {}, extraParams = {}) {
  const params = new URLSearchParams()
  
  if (scope === 'shortcode' && shortcode) {
    params.set('shortcode', shortcode)
  }
  
  if (range.from) {
    params.set('from', range.from)
  }
  
  if (range.to) {
    params.set('to', range.to)
  }
  
  // Add any extra params
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value))
    }
  })
  
  return params.toString()
}

// Hook to fetch analytics overview
export function useAnalyticsOverview(params = {}, options = {}) {
  const { scope = 'all', shortcode, range = {}, enabled = true } = params
  const { refetchInterval = 15000, ...otherOptions } = options
  
  return useQuery({
    queryKey: analyticsKeys.overview(scope, shortcode, range),
    queryFn: async () => {
      const queryParams = buildAnalyticsParams(scope, shortcode, range)
      return await http.get(`/api/analytics/overview?${queryParams}`)
    },
    enabled: enabled && !!(scope === 'all' || shortcode), // Only fetch if we have required params
    refetchInterval,
    refetchIntervalInBackground: true,
    keepPreviousData: true,
    staleTime: 10000, // Consider data fresh for 10 seconds
    ...otherOptions,
  })
}

// Hook to fetch analytics timeseries
export function useAnalyticsTimeseries(params = {}, options = {}) {
  const { scope = 'all', shortcode, range = {}, enabled = true } = params
  const { refetchInterval = 15000, ...otherOptions } = options
  
  return useQuery({
    queryKey: analyticsKeys.timeseries(scope, shortcode, range),
    queryFn: async () => {
      const queryParams = buildAnalyticsParams(scope, shortcode, range)
      return await http.get(`/api/analytics/timeseries?${queryParams}`)
    },
    enabled: enabled && !!(scope === 'all' || shortcode), // Only fetch if we have required params
    refetchInterval,
    refetchIntervalInBackground: true,
    keepPreviousData: true,
    staleTime: 10000, // Consider data fresh for 10 seconds
    ...otherOptions,
  })
}

// Hook to fetch analytics breakdown
export function useAnalyticsBreakdown(params = {}, options = {}) {
  const { scope = 'all', shortcode, range = {}, dimension = 'ref', limit = 5, enabled = true } = params
  const { refetchInterval = 15000, ...otherOptions } = options
  
  return useQuery({
    queryKey: analyticsKeys.breakdown(scope, shortcode, range, dimension),
    queryFn: async () => {
      const queryParams = buildAnalyticsParams(scope, shortcode, range, { 
        dimension, 
        limit 
      })
      return await http.get(`/api/analytics/breakdown?${queryParams}`)
    },
    enabled: enabled && !!(scope === 'all' || shortcode), // Only fetch if we have required params
    refetchInterval,
    refetchIntervalInBackground: true,
    keepPreviousData: true,
    staleTime: 10000, // Consider data fresh for 10 seconds
    ...otherOptions,
  })
}

// Utility hook to check if analytics polling should be active
export function useIsAnalyticsActive(currentView) {
  return currentView === 'analytics'
}
