import { Link as LinkIcon } from 'lucide-react'

export function Header() {
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
          <div>
            <span className="text-sm text-gray-600">Welcome back!</span>
          </div>
        </div>
      </div>
    </header>
  )
}