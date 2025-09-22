import { useQuery } from '@tanstack/react-query';
import { linkAPI } from '../services/api';

export function useReservedPaths() {
  return useQuery({
    queryKey: ['reserved-paths'],
    queryFn: () => linkAPI.getReservedPaths(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function isShortcodeReserved(shortcode: string, reservedPaths: string[] = []): boolean {
  if (!shortcode) return false;
  return reservedPaths.includes(shortcode.toLowerCase());
}

export function getReservedShortcodeError(shortcode: string, reservedPaths: string[] = []): string | null {
  if (isShortcodeReserved(shortcode, reservedPaths)) {
    return `"${shortcode}" is reserved and cannot be used as a shortcode.`;
  }
  return null;
}