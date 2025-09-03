import { useEffect, useState } from 'react'
import { authService } from '../services/auth'

export function AuthCallback({ onAuthSuccess }) {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        setStatus('authenticating');
        await authService.handleCallback(code, state);
        
        setStatus('success');
        onAuthSuccess?.();
        
        // Redirect to main app after short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        
      } catch (error) {
        console.error('OAuth callback failed:', error);
        setError(error.message);
        setStatus('error');
      }
    };

    handleCallback();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticating') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Authenticating with GitHub...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Authentication successful! Redirecting...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center max-w-md">
          <div className="rounded-full h-12 w-12 bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Authentication Failed</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}