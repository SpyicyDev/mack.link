import { useState, useCallback, useMemo, memo } from 'react'
import { ExternalLink, Edit, Trash2, Copy, BarChart3, Link as LinkIcon, CheckSquare, Square, Download, X, QrCode, Upload, Archive, ArchiveRestore } from 'lucide-react'
import { EditLinkModal } from './EditLinkModal'
import { QRCodeModal } from './QRCodeModal'
import { ConfirmationModal } from './ui'
import { BulkImportModal } from './BulkImportModal'
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

  const linkEntries = useMemo(() => 
    Object.entries(links).sort(([,a], [,b]) => 
      new Date(b.created) - new Date(a.created)
    ), [links]
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
    setSelectedLinks(prev => {
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
        link.updated
      ])
    ]
    
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
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
      minute: '2-digit'
    })
  }

  if (linkEntries.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 transition-colors" role="status" aria-live="polite">
        <LinkIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No links yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by creating your first short link</p>
      </div>
    )
  }

  return (
    <>
      {/* Bulk Operations Toolbar */}
      {linkEntries.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 px-4 py-3 transition-colors">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleBulkMode}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                  disabled={selectedLinks.size === linkEntries.length}
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50"
                  disabled={selectedLinks.size === 0}
                >
                  Clear
                </button>
              </>
            )}
          </div>
          
          {bulkMode && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBulkImportOpen(true)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                title="Bulk import links from CSV"
              >
                <Upload className="w-4 h-4 mr-1" />
                Import CSV
              </button>
              <button
                onClick={handleExportSelected}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                title="Export selected links to CSV"
                disabled={selectedLinks.size === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-1 border border-red-300 dark:border-red-500 rounded-md text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                title={selectedLinks.size > 0 ? `Delete ${selectedLinks.size} selected links` : 'Delete selected links'}
                disabled={selectedLinks.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete{selectedLinks.size > 0 ? ` (${selectedLinks.size})` : ''}
              </button>
            </div>
          )}
        </div>
      )}

      <section className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/50 overflow-hidden sm:rounded-lg transition-colors" aria-labelledby="links-heading">
        <div className="px-4 py-5 sm:p-6">
          <h2 id="links-heading" className="sr-only">Your short links</h2>
          <div className="grid gap-4" role="list" aria-label="List of short links">
            {linkEntries.map(([shortcode, link]) => (
              <article key={shortcode} className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-700/50 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-800 bg-white dark:bg-gray-800 ${
                bulkMode && selectedLinks.has(shortcode) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              }`} role="listitem">
                <div className="flex items-start justify-between">
                  {bulkMode && (
                    <div className="flex items-center mr-4 mt-1">
                      <button
                        onClick={() => toggleLinkSelection(shortcode)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="flex items-center space-x-2 mb-2">
                      <code className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-mono rounded" aria-label={`Short URL: ${workerHost()}/${shortcode}`}>
                        {workerHost()}/{shortcode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(shortcode)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        aria-label={`Copy link for ${shortcode} to clipboard`}
                      >
                        <Copy className="w-4 h-4" aria-hidden="true" />
                      </button>
                      {copiedShortcode === shortcode && (
                        <span className="text-xs text-green-600" role="status" aria-live="polite">Copied!</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors"
                      >
                        {link.url}
                      </a>
                    </div>

                    {link.description && (
                      <p className="text-sm text-gray-600 mb-2">{link.description}</p>
                    )}

                    {/* Tags and archived badge */}
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      {Array.isArray(link.tags) && link.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{tag}</span>
                      ))}
                      {link.archived && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Archived</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>{link.clicks || 0} clicks</span>
                      </div>
                      <span>Created {formatDate(link.created)}</span>
                      {link.updated !== link.created && (
                        <span>Updated {formatDate(link.updated)}</span>
                      )}
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {link.redirectType || 301}
                      </span>
                      {link.activatesAt && (
                        <span title="Activates" className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">Starts {formatDate(link.activatesAt)}</span>
                      )}
                      {link.expiresAt && (
                        <span title="Expires" className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">Ends {formatDate(link.expiresAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4" role="group" aria-label={`Actions for ${shortcode}`}>
                    <button
                      onClick={() => onUpdate(shortcode, { archived: !link.archived })}
                      className={`p-2 ${link.archived ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'} hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded`}
                      aria-label={`${link.archived ? 'Unarchive' : 'Archive'} link ${shortcode}`}
                      title={link.archived ? 'Unarchive' : 'Archive'}
                    >
                      {link.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
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
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={handleCloseQRCode}
          shortcode={qrLink.shortcode}
          url={qrLink.url}
        />
      )}

      {bulkImportOpen && (
        <BulkImportModal
          isOpen={bulkImportOpen}
          onClose={() => setBulkImportOpen(false)}
        />
      )}
    </>
  )
})

export { LinkList }