import { Link as LinkIcon, Github, Shield } from 'lucide-react'
import { authService } from '../services/auth'

export function LoginScreen() {
  const handleLogin = () => {
    authService.login();
  };
  const authDisabled = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AUTH_DISABLED === 'true'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 transition-colors">
      <div className="max-w-md w-full space-y-8 sm:space-y-10">
        <div className="text-center">
          <LinkIcon className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <h2 className="mt-6 sm:mt-8 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            link.mackhaymond.co
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-300">
            Sign in to manage your short links
          </p>
        </div>
        
        <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-8">
          <div>
            <button
              onClick={handleLogin}
              className="group relative w-full flex justify-center py-4 sm:py-3 px-6 sm:px-4 border border-transparent text-base sm:text-sm font-medium rounded-lg sm:rounded-md text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-all duration-200 active:scale-[0.98] touch-target"
            >
              <Github className="w-6 h-6 sm:w-5 sm:h-5 mr-3 sm:mr-2" />
              Sign in with GitHub
            </button>
          </div>
          
          <div className="text-center text-sm sm:text-xs text-gray-500 dark:text-gray-400 space-y-3 sm:space-y-2">
            <p>
              Secure authentication via GitHub OAuth
            </p>
            <div className="p-4 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-md transition-colors">
              <p className="text-blue-800 dark:text-blue-400 text-sm">
                🔒 This system is restricted to authorized users only
              </p>
              {authDisabled && (
                <p className="mt-3 sm:mt-2 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Shield className="w-5 h-5 sm:w-4 sm:h-4 mr-2 sm:mr-1" /> 
                  Dev mode: OAuth disabled
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
