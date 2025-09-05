import { useState, useEffect, useCallback, useRef } from 'react'
import { LinkList } from './components/LinkList'
import { LinkSearch } from './components/LinkSearch'
import { CreateLinkForm } from './components/CreateLinkForm'
import { Header } from './components/Header'
import { Analytics } from './components/Analytics'
import { LoginScreen } from './components/LoginScreen'
import { authService } from './services/auth'
import { Plus, HelpCircle, BarChart3, Link as LinkIcon, User } from 'lucide-react'
import ProfileTab from './components/ProfileTab'
import { 
  ErrorBoundary,
  ErrorMessage,
  PageLoader,
  LinkListSkeleton,
  SearchSkeleton,
  BulkToolbarSkeleton,
  KeyboardShortcutsModal,
} from './components/ui'
import {
  useLinks,
  useCreateLink,
  useUpdateLink,
  useDeleteLink,
  useBulkDeleteLinks,
} from './hooks/useLinks'
import { useIsAnalyticsActive } from './hooks/useAnalytics'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  const [filteredLinks, setFilteredLinks] = useState({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const [currentView, setCurrentView] = useState('links') // 'links' | 'analytics' | 'profile'
  const searchInputRef = useRef(null)

  // Check if analytics polling should be active
  const isAnalyticsActive = useIsAnalyticsActive(currentView)

  // React Query hooks - only run when authenticated
  // Make UI more realtime: periodic refetch tuned by current view
  const {
    data: links = {},
    isLoading,
    error,
    refetch,
  } = useLinks({
    enabled: isAuthenticated,
    // Reduce polling to cut KV list usage on the server - sync with analytics polling
    refetchInterval: isAnalyticsActive ? 15000 : 10000,
    refetchIntervalInBackground: isAnalyticsActive,
  })
  const createLinkMutation = useCreateLink()
  const updateLinkMutation = useUpdateLink()
  const deleteLinkMutation = useDeleteLink()
  const bulkDeleteMutation = useBulkDeleteLinks()

  // Listen for authentication state changes (no polling)
  useEffect(() => {
    const onAuthChange = () => setIsAuthenticated(authService.isAuthenticated())
    window.addEventListener('auth:change', onAuthChange)
    return () => window.removeEventListener('auth:change', onAuthChange)
  }, [])

  const handleCreateLink = useCallback(
    async (linkData) => {
      await createLinkMutation.mutateAsync(linkData)
      setShowCreateForm(false)
    },
    [createLinkMutation]
  )

  const handleDeleteLink = useCallback(
    async (shortcode) => {
      await deleteLinkMutation.mutateAsync(shortcode)
    },
    [deleteLinkMutation]
  )

  const handleBulkDeleteLinks = useCallback(
    async (shortcodes) => {
      await bulkDeleteMutation.mutateAsync(shortcodes)
    },
    [bulkDeleteMutation]
  )

  const handleUpdateLink = useCallback(
    async (shortcode, updates) => {
      await updateLinkMutation.mutateAsync({ shortcode, updates })
    },
    [updateLinkMutation]
  )

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
    // Focus app search instead of browser Find
    'mod+f': () => searchInputRef.current?.focus(),
    // Quick tab switching (note: browsers may reserve Cmd+1/2). Also support Alt+1/2 as fallback.
'mod+1': () => setCurrentView('links'),
    'mod+2': () => setCurrentView('analytics'),
    'mod+3': () => setCurrentView('profile'),
    'alt+1': () => setCurrentView('links'),
    'alt+2': () => setCurrentView('analytics'),
    'alt+3': () => setCurrentView('profile'),
    // Open shortcuts help
    'mod+/': () => setShowKeyboardHelp(true),
    'shift+?': () => setShowKeyboardHelp(true),
    // Global escape closes overlays
    escape: () => {
      setShowCreateForm(false)
      setShowKeyboardHelp(false)
    },
  })

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />
  }

  // Filter results are managed by LinkSearch via onFilteredResults

  if (isLoading) {
    return (
      <ErrorBoundary fallbackMessage="Something went wrong with the link management system.">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Skip to main content
          </a>

          <Header />

          <main
            id="main-content"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            role="main"
          >
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
              <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Link Management
                </h1>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  Manage your short links and view analytics
                </p>
              </header>
              <div className="mt-4 sm:mt-0">
                <button
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed"
                  aria-label="Create new short link (loading)"
                >
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create Link
                </button>
              </div>
            </div>

            <SearchSkeleton />
            <LinkListSkeleton count={6} />
          </main>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary fallbackMessage="Something went wrong with the link management system.">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Skip Navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Skip to main content
        </a>

        <Header onShowShortcuts={() => setShowKeyboardHelp(true)} />

        <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <header>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Link Management</h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Manage your short links and view analytics
              </p>
            </header>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
                aria-label="Create new short link"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Create Link
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 space-x-4 sm:space-x-8 no-scrollbar ios-momentum" aria-label="Tabs">
              <button
                onClick={() => setCurrentView('links')}
                className={`${
                  currentView === 'links'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Links
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`${
                  currentView === 'analytics'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className={`${
                  currentView === 'profile'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </button>
            </nav>
          </div>

          <ErrorMessage error={error} onRetry={handleRetryError} className="mb-4" />

          {/* Content based on current view */}
          {currentView === 'links' ? (
            <>
              <LinkSearch
                links={links}
                onFilteredResults={handleFilteredResults}
                searchInputRef={searchInputRef}
              />

              <LinkList
                links={filteredLinks}
                onDelete={handleDeleteLink}
                onUpdate={handleUpdateLink}
                onBulkDelete={handleBulkDeleteLinks}
              />
            </>
          ) : currentView === 'analytics' ? (
            <Analytics links={links} currentView={currentView} />
          ) : (
            <ProfileTab />
          )}

          {showCreateForm && (
            <CreateLinkForm onSubmit={handleCreateLink} onClose={() => setShowCreateForm(false)} />
          )}

          {/* Mobile Floating Create Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="sm:hidden fixed bottom-5 right-5 z-40 rounded-full p-4 shadow-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Create new short link"
          >
            <Plus className="w-5 h-5" />
          </button>
        </main>
        <KeyboardShortcutsModal isOpen={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />
      </div>
    </ErrorBoundary>
  )
}

export default App
