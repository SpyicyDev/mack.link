import { Link as LinkIcon, Github, Shield } from 'lucide-react'
import { authService } from '../services/auth'

export function LoginScreen() {
  const handleLogin = () => {
    authService.login();
  };
  const authDisabled = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AUTH_DISABLED === 'true'

  // In dev-auth-disabled mode, attempt zero-click bootstrap once the screen mounts
  if (authDisabled) {
    // Fire-and-forget; if it succeeds, the app layer will react to auth:change and navigate
    setTimeout(() => authService.bootstrapDevAuthIfNeeded(), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <LinkIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            link.mackhaymond.co
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Sign in to manage your short links
          </p>
        </div>
        
        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
          <div>
            <button
              onClick={handleLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors active:scale-[0.98]"
            >
              <Github className="w-5 h-5 mr-2" />
              Sign in with GitHub
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p>
              Secure authentication via GitHub OAuth
            </p>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md transition-colors">
              <p className="text-blue-800 dark:text-blue-400 text-sm">
                🔒 This system is restricted to authorized users only
              </p>
              {authDisabled && (
                <p className="mt-2 text-amber-700 dark:text-amber-300 flex items-center justify-center"><Shield className="w-4 h-4 mr-1" /> Dev mode: OAuth disabled</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
