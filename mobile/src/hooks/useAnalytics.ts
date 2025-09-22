import { useQuery } from '@tanstack/react-query';
import { linkAPI } from '../services/api';

// Analytics hooks
export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => linkAPI.getAnalyticsOverview(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAnalyticsTimeseries(params: {
  from: string;
  to: string;
  scope?: 'all' | 'shortcode';
  shortcode?: string;
}) {
  return useQuery({
    queryKey: ['analytics', 'timeseries', params],
    queryFn: () => linkAPI.getAnalyticsTimeseries(params),
    staleTime: 1000 * 60 * 2,
    enabled: !!params.from && !!params.to,
  });
}

export function useAnalyticsBreakdown(params: {
  from: string;
  to: string;
  dimension: string;
  scope?: 'all' | 'shortcode';
  shortcode?: string;
}) {
  return useQuery({
    queryKey: ['analytics', 'breakdown', params],
    queryFn: () => linkAPI.getAnalyticsBreakdown(params),
    staleTime: 1000 * 60 * 2,
    enabled: !!params.from && !!params.to && !!params.dimension,
  });
}

export function useIsAnalyticsActive(currentView: string): boolean {
  return currentView === 'analytics';
}