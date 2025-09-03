import { Link as LinkIcon, LogOut, User } from 'lucide-react'
import { authService } from '../services/auth'

export function Header() {
  const user = authService.getUser();
  
  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <LinkIcon className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">link.mackhaymond.co</h1>
              <p className="text-sm text-gray-600">URL Shortener Management</p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <img 
                  src={user.avatar_url} 
                  alt={user.login}
                  className="w-6 h-6 rounded-full"
                />
                <span>Welcome, {user.login}!</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}