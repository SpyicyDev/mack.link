import { useState, useCallback, useMemo, memo, lazy, Suspense } from 'react'
import {
  ExternalLink,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Link as LinkIcon,
  CheckSquare,
  Square,
  Download,
  X,
  QrCode,
  Upload,
  Archive,
  ArchiveRestore,
  Lock,
  MoreVertical,
} from 'lucide-react'
import { EditLinkModal } from './EditLinkModal'
const QRCodeModal = lazy(() => import('./QRCodeModal').then(m => ({ default: m.QRCodeModal })))
const BulkImportModal = lazy(() => import('./BulkImportModal').then(m => ({ default: m.BulkImportModal })))
import { ConfirmationModal } from './ui'
import { shortUrl, workerHost } from '../services/links'

const LinkList = memo(function LinkList({ links, onDelete, onUpdate, onBulkDelete }) {
  const [editingLink, setEditingLink] = useState(null)
  const [copiedShortcode, setCopiedShortcode] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState(null)
  const [selectedLinks, setSelectedLinks] = useState(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrLink, setQrLink] = useState(null)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [openMenuFor, setOpenMenuFor] = useState(null)

  const linkEntries = useMemo(
    () => Object.entries(links).sort(([, a], [, b]) => new Date(b.created) - new Date(a.created)),
    [links]
  )

  const copyToClipboard = useCallback(async (shortcode) => {
    try {
      await navigator.clipboard.writeText(shortUrl(shortcode))
      setCopiedShortcode(shortcode)
      setTimeout(() => setCopiedShortcode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [])

  const handleDeleteClick = useCallback((shortcode) => {
    setLinkToDelete(shortcode)
    setDeleteModalOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (linkToDelete) {
      onDelete(linkToDelete)
      setLinkToDelete(null)
    }
  }, [linkToDelete, onDelete])

  const toggleBulkMode = useCallback(() => {
    setBulkMode(!bulkMode)
    setSelectedLinks(new Set())
  }, [bulkMode])

  const toggleLinkSelection = useCallback((shortcode) => {
    setSelectedLinks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(shortcode)) {
        newSet.delete(shortcode)
      } else {
        newSet.add(shortcode)
      }
      return newSet
    })
  }, [])

  const selectAllLinks = useCallback(() => {
    setSelectedLinks(new Set(linkEntries.map(([shortcode]) => shortcode)))
  }, [linkEntries])

  const clearSelection = useCallback(() => {
    setSelectedLinks(new Set())
  }, [])

  const handleBulkDelete = useCallback(() => {
    if (selectedLinks.size > 0 && onBulkDelete) {
      onBulkDelete(Array.from(selectedLinks))
      setSelectedLinks(new Set())
      setBulkMode(false)
    }
  }, [selectedLinks, onBulkDelete])

  const handleExportSelected = useCallback(() => {
    const selectedEntries = linkEntries.filter(([shortcode]) => selectedLinks.has(shortcode))
    const csvData = [
      ['Shortcode', 'URL', 'Description', 'Clicks', 'Created', 'Updated'],
      ...selectedEntries.map(([shortcode, link]) => [
        shortcode,
        link.url,
        link.description || '',
        link.clicks || 0,
        link.created,
        link.updated,
      ]),
    ]

    const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `links-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [linkEntries, selectedLinks])

  const handleShowQRCode = useCallback((shortcode, link) => {
    setQrLink({ shortcode, ...link })
    setQrModalOpen(true)
  }, [])

  const handleCloseQRCode = useCallback(() => {
    setQrModalOpen(false)
    setQrLink(null)
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (linkEntries.length === 0) {
    return (
      <div
        className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 transition-colors mx-3 sm:mx-0"
        role="status"
        aria-live="polite"
      >
        <LinkIcon
          className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4"
          aria-hidden="true"
        />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No links yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
          Get started by creating your first short link
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Bulk Operations Toolbar */}
      {linkEntries.length > 0 && (
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 px-3 sm:px-4 py-3 transition-colors space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-y-2">
            <button
              onClick={toggleBulkMode}
              className={`px-3 py-2 sm:py-1 rounded-md text-sm font-medium transition-colors min-h-[44px] sm:min-h-[auto] ${
                bulkMode
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              aria-pressed={bulkMode}
            >
              {bulkMode ? 'Exit Bulk Mode' : 'Bulk Mode'}
            </button>

            {bulkMode && (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedLinks.size} of {linkEntries.length} selected
                </span>
                <button
                  onClick={selectAllLinks}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 py-2 px-1"
                  disabled={selectedLinks.size === linkEntries.length}
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50 py-2 px-1"
                  disabled={selectedLinks.size === 0}
                >
                  Clear
                </button>
              </>
            )}
          </div>

          {bulkMode && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:space-x-2">
              <button
                onClick={() => setBulkImportOpen(true)}
                className="inline-flex items-center justify-center px-3 py-2 sm:py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors min-h-[44px] sm:min-h-[auto]"
                title="Bulk import links from CSV"
              >
                <Upload className="w-4 h-4 mr-1" />
                Import CSV
              </button>
              <button
                onClick={handleExportSelected}
                className="inline-flex items-center justify-center px-3 py-2 sm:py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-[auto]"
                title="Export selected links to CSV"
                disabled={selectedLinks.size === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center justify-center px-3 py-2 sm:py-1 border border-red-300 dark:border-red-500 rounded-md text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-[auto]"
                title={
                  selectedLinks.size > 0
                    ? `Delete ${selectedLinks.size} selected links`
                    : 'Delete selected links'
                }
                disabled={selectedLinks.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete{selectedLinks.size > 0 ? ` (${selectedLinks.size})` : ''}
              </button>
            </div>
          )}
        </div>
      )}

      <section
        className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/50 overflow-hidden sm:rounded-lg transition-colors"
        aria-labelledby="links-heading"
      >
        <div className="px-3 sm:px-4 py-4 sm:py-5 sm:p-6">
          <h2 id="links-heading" className="sr-only">
            Your short links
          </h2>
          <div className="grid gap-3 sm:gap-4" role="list" aria-label="List of short links">
            {linkEntries.map(([shortcode, link]) => (
              <article
                key={shortcode}
                className={`border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md dark:hover:shadow-gray-700/50 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-800 bg-white dark:bg-gray-800 ${
                  bulkMode && selectedLinks.has(shortcode)
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
                role="listitem"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {bulkMode && (
                    <div className="flex items-center mr-4 mt-1">
                      <button
                        onClick={() => toggleLinkSelection(shortcode)}
                        className="p-2 sm:p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] sm:min-h-[auto] sm:min-w-[auto] flex items-center justify-center"
                        aria-label={`${selectedLinks.has(shortcode) ? 'Unselect' : 'Select'} link ${shortcode}`}
                      >
                        {selectedLinks.has(shortcode) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2 sm:mb-2">
                      <code
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-mono rounded break-all sm:break-normal"
                        aria-label={`Short URL: ${workerHost()}/${shortcode}`}
                      >
                        {workerHost()}/{shortcode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(shortcode)}
                        className="p-2 sm:p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded min-h-[44px] min-w-[44px] sm:min-h-[auto] sm:min-w-[auto] flex items-center justify-center flex-shrink-0"
                        aria-label={`Copy link for ${shortcode} to clipboard`}
                      >
                        <Copy className="w-4 h-4" aria-hidden="true" />
                      </button>
                      {copiedShortcode === shortcode && (
                        <span className="text-xs text-green-600 dark:text-green-400" role="status" aria-live="polite">
                          Copied!
                        </span>
                      )}
                    </div>

                    <div className="flex items-start space-x-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 break-all sm:break-normal sm:truncate transition-colors text-sm sm:text-base"
                      >
                        {link.url}
                      </a>
                    </div>

                    {link.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{link.description}</p>
                    )}

                    {/* Tags and badges - mobile scrollable */}
                    <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar ios-momentum whitespace-nowrap sm:flex-wrap sm:whitespace-normal">
                      {Array.isArray(link.tags) &&
                        link.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex-shrink-0"
                          >
                            {tag}
                          </span>
                        ))}
                      {link.archived && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 flex-shrink-0">
                          Archived
                        </span>
                      )}
                      {link.passwordEnabled && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 flex-shrink-0">
                          <Lock className="w-3 h-3 mr-1" />
                          Protected
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>{link.clicks || 0} clicks</span>
                      </div>
                      <span>Created {formatDate(link.created)}</span>
                      {link.updated !== link.created && (
                        <span>Updated {formatDate(link.updated)}</span>
                      )}
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        {link.redirectType || 301}
                      </span>
                      {link.activatesAt && (
                        <span
                          title="Activates"
                          className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs"
                        >
                          Starts {formatDate(link.activatesAt)}
                        </span>
                      )}
                      {link.expiresAt && (
                        <span
                          title="Expires"
                          className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs"
                        >
                          Ends {formatDate(link.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile kebab menu */}
                  <div className="sm:hidden relative self-start mt-1" role="group" aria-label={`Actions for ${shortcode}`}>
                    <button
                      onClick={() => setOpenMenuFor((prev) => (prev === shortcode ? null : shortcode))}
                      className="p-2 min-h-[44px] min-w-[44px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded flex items-center justify-center"
                      aria-label={`More actions for ${shortcode}`}
                      aria-expanded={openMenuFor === shortcode}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuFor === shortcode && (
                      <div className="absolute right-0 mt-2 w-48 max-h-[60vh] overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20" role="menu">
                        <button
                          onClick={() => { setEditingLink({ shortcode, ...link }); setOpenMenuFor(null) }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                          role="menuitem"
                        >
                          <Edit className="w-4 h-4 mr-3 text-gray-400" />
                          Edit
                        </button>
                        <button
                          onClick={() => { onUpdate(shortcode, { archived: !link.archived }); setOpenMenuFor(null) }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                          role="menuitem"
                        >
                          {link.archived ? (
                            <ArchiveRestore className="w-4 h-4 mr-3 text-gray-400" />
                          ) : (
                            <Archive className="w-4 h-4 mr-3 text-gray-400" />
                          )}
                          {link.archived ? 'Unarchive' : 'Archive'}
                        </button>
                        <button
                          onClick={() => { handleShowQRCode(shortcode, link); setOpenMenuFor(null) }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
                          role="menuitem"
                        >
                          <QrCode className="w-4 h-4 mr-3 text-gray-400" />
                          QR Code
                        </button>
                        <button
                          onClick={() => { handleDeleteClick(shortcode); setOpenMenuFor(null) }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                          role="menuitem"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Desktop action icons */}
                  <div
                    className="hidden sm:flex items-center space-x-1 mt-3 sm:mt-0 sm:ml-4 self-start sm:self-auto"
                    role="group"
                    aria-label={`Actions for ${shortcode}`}
                  >
                    <button
                      onClick={() => onUpdate(shortcode, { archived: !link.archived })}
                      className={`p-2 ${link.archived ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'} hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded`}
                      aria-label={`${link.archived ? 'Unarchive' : 'Archive'} link ${shortcode}`}
                      title={link.archived ? 'Unarchive' : 'Archive'}
                    >
                      {link.archived ? (
                        <ArchiveRestore className="w-4 h-4" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleShowQRCode(shortcode, link)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                      aria-label={`Generate QR code for ${shortcode}`}
                      title="Generate QR Code"
                    >
                      <QrCode className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">QR Code</span>
                    </button>
                    <button
                      onClick={() => setEditingLink({ shortcode, ...link })}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      aria-label={`Edit link ${shortcode}`}
                    >
                      <Edit className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(shortcode)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      aria-label={`Delete link ${shortcode}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onSave={(updates) => {
            onUpdate(editingLink.shortcode, updates)
            setEditingLink(null)
          }}
          onClose={() => setEditingLink(null)}
        />
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Link"
        message={`Are you sure you want to delete the link "${linkToDelete}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {qrLink && (
        <Suspense>
          <QRCodeModal
            isOpen={qrModalOpen}
            onClose={handleCloseQRCode}
            shortcode={qrLink.shortcode}
            url={qrLink.url}
          />
        </Suspense>
      )}

      {bulkImportOpen && (
        <Suspense>
          <BulkImportModal isOpen={bulkImportOpen} onClose={() => setBulkImportOpen(false)} />
        </Suspense>
      )}
    </>
  )
})

export { LinkList }
