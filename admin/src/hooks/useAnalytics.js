import { useQuery } from '@tanstack/react-query'
import { http } from '../services/http'
import { API_ENDPOINTS, buildAnalyticsParams } from '@mack-link/shared'

// Query keys
export const analyticsKeys = {
  all: ['analytics'],
  overview: (scope, shortcode, range) => [...analyticsKeys.all, 'overview', scope, shortcode, range],
  timeseries: (scope, shortcode, range) => [...analyticsKeys.all, 'timeseries', scope, shortcode, range],
  timeseriesLinks: (range, limit) => [...analyticsKeys.all, 'timeseries-links', range, limit],
  breakdown: (scope, shortcode, range, dimension) => [...analyticsKeys.all, 'breakdown', scope, shortcode, range, dimension],
}

// Hook to fetch analytics overview
export function useAnalyticsOverview(params = {}, options = {}) {
  const { scope = 'all', shortcode, range = {}, enabled = true } = params
  const { refetchInterval = 15000, ...otherOptions } = options
  
  return useQuery({
    queryKey: analyticsKeys.overview(scope, shortcode, range),
    queryFn: async () => {
      const params = buildAnalyticsParams({ scope, shortcode, from: range.from, to: range.to })
      return await http.get(`${API_ENDPOINTS.ANALYTICS.OVERVIEW}?${params.toString()}`)
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
      const params = buildAnalyticsParams({ scope, shortcode, from: range.from, to: range.to })
      return await http.get(`${API_ENDPOINTS.ANALYTICS.TIMESERIES}?${params.toString()}`)
    },
    enabled: enabled && !!(scope === 'all' || shortcode), // Only fetch if we have required params
    refetchInterval,
    refetchIntervalInBackground: true,
    keepPreviousData: true,
    staleTime: 10000, // Consider data fresh for 10 seconds
    ...otherOptions,
  })
}

// Hook to fetch analytics timeseries for top links (global scope)
export function useAnalyticsTimeseriesLinks(params = {}, options = {}) {
  const { range = {}, limit = 5, enabled = true } = params
  const { refetchInterval = 15000, ...otherOptions } = options

  return useQuery({
    queryKey: analyticsKeys.timeseriesLinks(range, limit),
    queryFn: async () => {
      const params = buildAnalyticsParams({ scope: 'all', from: range.from, to: range.to, limit })
      return await http.get(`${API_ENDPOINTS.ANALYTICS.TIMESERIES_LINKS}?${params.toString()}`)
    },
    enabled,
    refetchInterval,
    refetchIntervalInBackground: true,
    keepPreviousData: true,
    staleTime: 10000,
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
      const params = buildAnalyticsParams({ 
        scope, 
        shortcode, 
        from: range.from, 
        to: range.to, 
        dimension, 
        limit 
      })
      return await http.get(`${API_ENDPOINTS.ANALYTICS.BREAKDOWN}?${params.toString()}`)
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
