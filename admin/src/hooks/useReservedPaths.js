import { useState, useEffect } from 'react';
import { http } from '../services/http';

/**
 * Custom hook to fetch and cache reserved paths metadata.
 * 
 * Returns:
 * - reservedPaths: Set of reserved paths (lowercase)
 * - loading: boolean indicating if the request is in progress
 * - error: error message if the request failed
 * - refetch: function to manually refetch the data
 */
export function useReservedPaths() {
  const [reservedPaths, setReservedPaths] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservedPaths = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await http.get('/api/meta/reserved-paths');
      
      if (data && Array.isArray(data.reserved)) {
        setReservedPaths(new Set(data.reserved.map(path => path.toLowerCase())));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch reserved paths:', err);
      setError(err.message || 'Failed to fetch reserved paths');
      
      // Fallback to basic reserved paths if API fails
      setReservedPaths(new Set([
        'admin', 'api', 'auth', 'oauth', 'callback', 'login', 'logout',
        'www', 'mail', 'ftp', 'assets', 'static', 'public'
      ]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservedPaths();
  }, []);

  return {
    reservedPaths,
    loading,
    error,
    refetch: fetchReservedPaths
  };
}

/**
 * Check if a shortcode is reserved.
 * 
 * @param {string} shortcode - The shortcode to check
 * @param {Set<string>} reservedPaths - Set of reserved paths
 * @returns {boolean} true if the shortcode is reserved
 */
export function isShortcodeReserved(shortcode, reservedPaths) {
  if (!shortcode || typeof shortcode !== 'string') {
    return false;
  }
  
  return reservedPaths.has(shortcode.toLowerCase().trim());
}

/**
 * Get a user-friendly error message for reserved shortcodes.
 * 
 * @param {string} shortcode - The reserved shortcode
 * @returns {string} Error message
 */
export function getReservedShortcodeError(shortcode) {
  if (!shortcode) return 'Shortcode is required';
  
  const normalized = shortcode.toLowerCase().trim();
  
  if (normalized === 'admin') {
    return 'The shortcode "admin" is reserved for the administration panel';
  }
  
  if (normalized === 'api') {
    return 'The shortcode "api" is reserved for API endpoints';
  }
  
  if (['auth', 'login', 'logout', 'oauth', 'callback'].includes(normalized)) {
    return `The shortcode "${normalized}" is reserved for authentication routes`;
  }
  
  if (['www', 'mail', 'ftp'].includes(normalized)) {
    return `The shortcode "${normalized}" is reserved to avoid conflicts with common server configurations`;
  }
  
  return `The shortcode "${normalized}" is reserved and cannot be used`;
}
