import { useQuery } from '@tanstack/react-query'
import { http } from '../services/http'

// Query keys
export const analyticsKeys = {
  all: ['analytics'],
  overview: (scope, shortcode, range) => [...analyticsKeys.all, 'overview', scope, shortcode, range],
  timeseries: (scope, shortcode, range) => [...analyticsKeys.all, 'timeseries', scope, shortcode, range],
  timeseriesLinks: (range, limit) => [...analyticsKeys.all, 'timeseries-links', range, limit],
  breakdown: (scope, shortcode, range, dimension) => [...analyticsKeys.all, 'breakdown', scope, shortcode, range, dimension],
  hourlyPattern: (scope, shortcode, range) => [...analyticsKeys.all, 'hourly-pattern', scope, shortcode, range],
  utmBreakdowns: (scope, shortcode, range) => [...analyticsKeys.all, 'utm-breakdowns', scope, shortcode, range],
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

// Hook to fetch analytics timeseries for top links (global scope)
export function useAnalyticsTimeseriesLinks(params = {}, options = {}) {
  const { range = {}, limit = 5, enabled = true } = params
  const { refetchInterval = 15000, ...otherOptions } = options

  return useQuery({
    queryKey: analyticsKeys.timeseriesLinks(range, limit),
    queryFn: async () => {
      const queryParams = buildAnalyticsParams('all', undefined, range, { limit })
      return await http.get(`/api/analytics/timeseries-links?${queryParams}`)
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

// Hook to fetch UTM breakdowns (source, medium, campaign)
export function useUTMBreakdowns(params = {}, options = {}) {
  const { scope = 'all', shortcode, range = {}, enabled = true } = params
  const { refetchInterval = 15000, ...otherOptions } = options
  
  return useQuery({
    queryKey: analyticsKeys.utmBreakdowns(scope, shortcode, range),
    queryFn: async () => {
      // Fetch all three UTM dimensions in parallel
      const queryParams = buildAnalyticsParams(scope, shortcode, range, { limit: 10 })
      
      const [utmSource, utmMedium, utmCampaign] = await Promise.all([
        http.get(`/api/analytics/breakdown?${queryParams}&dimension=utm_source`),
        http.get(`/api/analytics/breakdown?${queryParams}&dimension=utm_medium`), 
        http.get(`/api/analytics/breakdown?${queryParams}&dimension=utm_campaign`)
      ])
      
      return {
        utmSource: utmSource.items || [],
        utmMedium: utmMedium.items || [],
        utmCampaign: utmCampaign.items || []
      }
    },
    enabled: enabled && !!(scope === 'all' || shortcode),
    refetchInterval,
    refetchIntervalInBackground: true,
    keepPreviousData: true,
    staleTime: 10000,
    ...otherOptions,
  })
}

// Hook to fetch hourly click patterns (mock for now, would need backend enhancement)
export function useHourlyPatterns(params = {}, options = {}) {
  const { scope = 'all', shortcode, range = {}, enabled = true } = params
  const { refetchInterval = 15000, ...otherOptions } = options
  
  return useQuery({
    queryKey: analyticsKeys.hourlyPattern(scope, shortcode, range),
    queryFn: async () => {
      // For now, we'll return mock data based on the daily timeseries
      // In a real implementation, this would be a new backend endpoint
      const queryParams = buildAnalyticsParams(scope, shortcode, range)
      const dailyData = await http.get(`/api/analytics/timeseries?${queryParams}`)
      
      // Generate synthetic hourly data from daily data for demonstration
      const hourlyPoints = []
      if (dailyData.points) {
        dailyData.points.forEach(point => {
          // Distribute daily clicks across hours with realistic patterns
          const date = new Date(point.date)
          const dailyClicks = point.clicks || 0
          
          // Simple distribution pattern: higher activity during business hours
          const hourlyDistribution = [
            0.02, 0.01, 0.01, 0.01, 0.02, 0.03, // 0-5 AM (low)
            0.04, 0.06, 0.08, 0.09, 0.08, 0.07, // 6-11 AM (rising)
            0.06, 0.05, 0.06, 0.07, 0.08, 0.09, // 12-5 PM (peak)
            0.08, 0.07, 0.06, 0.05, 0.04, 0.03  // 6-11 PM (declining)
          ]
          
          hourlyDistribution.forEach((ratio, hour) => {
            const hourlyDate = new Date(date)
            hourlyDate.setHours(hour, 0, 0, 0)
            hourlyPoints.push({
              date: hourlyDate.toISOString(),
              clicks: Math.round(dailyClicks * ratio)
            })
          })
        })
      }
      
      return { points: hourlyPoints }
    },
    enabled: enabled && !!(scope === 'all' || shortcode),
    refetchInterval,
    refetchIntervalInBackground: true,
    keepPreviousData: true,
    staleTime: 10000,
    ...otherOptions,
  })
}
