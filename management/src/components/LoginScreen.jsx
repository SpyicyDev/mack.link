import { Link as LinkIcon, Github } from 'lucide-react'
import { authService } from '../services/auth'

export function LoginScreen() {
  const handleLogin = () => {
    authService.login();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <LinkIcon className="mx-auto h-16 w-16 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            link.mackhaymond.co
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your short links
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <Github className="w-5 h-5 mr-2" />
              Sign in with GitHub
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-500 space-y-2">
            <p>
              Secure authentication via GitHub OAuth
            </p>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                🔒 This system is restricted to authorized users only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}