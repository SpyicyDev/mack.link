import { Link as LinkIcon, Github } from 'lucide-react'
import { authService } from '../services/auth'

export function LoginScreen() {
  const handleLogin = () => {
    authService.login();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <LinkIcon className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-blue-600" />
          <h2 className="mt-6 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            link.mackhaymond.co
          </h2>
          <p className="mt-3 text-base sm:text-sm text-gray-600 dark:text-gray-300">
            Sign in to manage your short links
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleLogin}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base sm:text-sm font-medium rounded-lg text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors min-h-[48px] touch-manipulation"
            >
              <Github className="w-5 h-5 mr-3" />
              Sign in with GitHub
            </button>
          </div>
          
          <div className="text-center text-sm sm:text-xs text-gray-500 dark:text-gray-400 space-y-3">
            <p>
              Secure authentication via GitHub OAuth
            </p>
            <div className="p-4 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors">
              <p className="text-blue-800 dark:text-blue-400 text-sm">
                🔒 This system is restricted to authorized users only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}