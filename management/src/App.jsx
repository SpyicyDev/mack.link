import { useState, useEffect } from 'react'
import { LinkList } from './components/LinkList'
import { CreateLinkForm } from './components/CreateLinkForm'
import { Header } from './components/Header'
import { LoginScreen } from './components/LoginScreen'
import { AuthCallback } from './components/AuthCallback'
import { linkAPI } from './services/api'
import { authService } from './services/auth'
import { Plus } from 'lucide-react'

function App() {
  const [links, setLinks] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())

  // Handle OAuth callback
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    try {
      setLoading(true)
      const data = await linkAPI.getAllLinks()
      setLinks(data)
    } catch (error) {
      setError('Failed to load links')
      console.error('Error loading links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async (linkData) => {
    try {
      const newLink = await linkAPI.createLink(
        linkData.shortcode,
        linkData.url,
        linkData.description,
        linkData.redirectType
      )
      setLinks(prev => ({
        ...prev,
        [newLink.shortcode]: newLink
      }))
      setShowCreateForm(false)
    } catch (error) {
      throw error
    }
  }

  const handleDeleteLink = async (shortcode) => {
    try {
      await linkAPI.deleteLink(shortcode)
      setLinks(prev => {
        const updated = { ...prev }
        delete updated[shortcode]
        return updated
      })
    } catch (error) {
      setError('Failed to delete link')
    }
  }

  const handleUpdateLink = async (shortcode, updates) => {
    try {
      const updatedLink = await linkAPI.updateLink(shortcode, updates)
      setLinks(prev => ({
        ...prev,
        [shortcode]: updatedLink
      }))
    } catch (error) {
      setError('Failed to update link')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Link Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your short links and view analytics
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Link
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <LinkList 
          links={links}
          onDelete={handleDeleteLink}
          onUpdate={handleUpdateLink}
        />

        {showCreateForm && (
          <CreateLinkForm
            onSubmit={handleCreateLink}
            onClose={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </div>
  )
}

export default App
