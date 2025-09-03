import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { LinkList } from './components/LinkList'
import { LinkSearch } from './components/LinkSearch'
import { CreateLinkForm } from './components/CreateLinkForm'
import { Header } from './components/Header'
import { LoginScreen } from './components/LoginScreen'
import { AuthCallback } from './components/AuthCallback'
import { authService } from './services/auth'
import { Plus, HelpCircle } from 'lucide-react'
import { ErrorBoundary, ErrorMessage, PageLoader } from './components/ui'
import { useLinks, useCreateLink, useUpdateLink, useDeleteLink } from './hooks/useLinks'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  const [filteredLinks, setFilteredLinks] = useState({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const searchInputRef = useRef(null)
  
  // React Query hooks - only run when authenticated
  const { data: links = {}, isLoading, error, refetch } = useLinks({ 
    enabled: isAuthenticated 
  })
  const createLinkMutation = useCreateLink()
  const updateLinkMutation = useUpdateLink()
  const deleteLinkMutation = useDeleteLink()

  // Handle OAuth callback
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  useEffect(() => {
    setFilteredLinks(links)
  }, [links])

  // Listen for authentication state changes
  useEffect(() => {
    const checkAuth = () => {
      const newAuthState = authService.isAuthenticated()
      if (newAuthState !== isAuthenticated) {
        setIsAuthenticated(newAuthState)
      }
    }

    // Check immediately and then periodically
    checkAuth()
    const interval = setInterval(checkAuth, 1000)
    
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const handleCreateLink = useCallback(async (linkData) => {
    await createLinkMutation.mutateAsync(linkData)
    setShowCreateForm(false)
  }, [createLinkMutation])

  const handleDeleteLink = useCallback(async (shortcode) => {
    await deleteLinkMutation.mutateAsync(shortcode)
  }, [deleteLinkMutation])

  const handleUpdateLink = useCallback(async (shortcode, updates) => {
    await updateLinkMutation.mutateAsync({ shortcode, updates })
  }, [updateLinkMutation])

  const handleRetryError = useCallback(() => {
    refetch()
  }, [refetch])

  const handleFilteredResults = useCallback((filtered) => {
    setFilteredLinks(filtered)
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'mod+n': () => setShowCreateForm(true),
    'mod+k': () => searchInputRef.current?.focus(),
    '/': () => searchInputRef.current?.focus(),
    'escape': () => {
      setShowCreateForm(false)
      setShowKeyboardHelp(false)
    },
    'mod+/': () => setShowKeyboardHelp(true),
  })

  if (isLoading) {
    return <PageLoader message="Loading your links..." />
  }

  return (
    <ErrorBoundary fallbackMessage="Something went wrong with the link management system.">
      <div className="min-h-screen bg-gray-50">
        {/* Skip Navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Skip to main content
        </a>
        
        <Header />
        
        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <header>
              <h1 className="text-3xl font-bold text-gray-900">Link Management</h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage your short links and view analytics
              </p>
            </header>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label="Create new short link"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Create Link
              </button>
            </div>
          </div>

          <ErrorMessage 
            error={error}
            onRetry={handleRetryError}
            className="mb-4"
          />

          <LinkSearch 
            links={links}
            onFilteredResults={handleFilteredResults}
            searchInputRef={searchInputRef}
          />

          <LinkList 
            links={filteredLinks}
            onDelete={handleDeleteLink}
            onUpdate={handleUpdateLink}
          />

          {showCreateForm && (
            <CreateLinkForm
              onSubmit={handleCreateLink}
              onClose={() => setShowCreateForm(false)}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
