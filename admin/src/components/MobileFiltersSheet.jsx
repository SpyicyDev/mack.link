import { useEffect, useRef } from 'react'

export function MobileFiltersSheet({
  isOpen,
  onClose,
  values,
  onApply,
  onClear,
}) {
  const dialogRef = useRef(null)
  const firstFocusRef = useRef(null)
  const lastFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const prevActive = document.activeElement
    // Focus first element after open
    setTimeout(() => firstFocusRef.current?.focus(), 0)

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
      }
      if (e.key === 'Tab') {
        // Simple focus trap
        const focusable = dialogRef.current?.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (prevActive && prevActive.focus) prevActive.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleApply = () => {
    // Read current form values and pass back
    const form = dialogRef.current?.querySelector('form')
    const data = new FormData(form)
    const next = {
      sortBy: data.get('sortBy'),
      sortOrder: data.get('sortOrder'),
      dateFilter: data.get('dateFilter'),
      clicksFilter: data.get('clicksFilter'),
      tagFilter: data.get('tagFilter'),
      showArchived: data.get('showArchived') === 'on',
    }
    onApply?.(next)
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="absolute inset-x-0 bottom-0 top-0 bg-white dark:bg-gray-800 shadow-xl rounded-t-lg flex flex-col pb-safe"
      >
        <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          <div className="flex items-center gap-3">
            <button
              ref={firstFocusRef}
              type="button"
              onClick={onClear}
              className="px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 touch-target"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 touch-target"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4 ios-momentum">
          <form className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</label>
              <div className="flex gap-3">
                <select
                  name="sortBy"
                  defaultValue={values.sortBy}
                  className="flex-1 px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base mobile-input"
                >
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                  <option value="clicks">Clicks</option>
                  <option value="shortcode">Shortcode</option>
                  <option value="url">URL</option>
                </select>
                <select
                  name="sortOrder"
                  defaultValue={values.sortOrder}
                  className="w-32 px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base mobile-input"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created after</label>
              <input
                type="date"
                name="dateFilter"
                defaultValue={values.dateFilter}
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base mobile-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min. clicks</label>
              <input
                type="number"
                min="0"
                name="clicksFilter"
                defaultValue={values.clicksFilter}
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base mobile-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tag contains</label>
              <input
                type="text"
                name="tagFilter"
                defaultValue={values.tagFilter}
                placeholder="work"
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base mobile-input"
              />
            </div>

            <div>
              <label className="inline-flex items-center space-x-3 text-base text-gray-700 dark:text-gray-300 py-2">
                <input type="checkbox" name="showArchived" defaultChecked={values.showArchived} className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span>Show archived</span>
              </label>
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClear}
            className="px-6 py-4 text-base rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 touch-target mobile-button"
          >
            Clear
          </button>
          <button
            ref={lastFocusRef}
            type="button"
            onClick={handleApply}
            className="px-6 py-4 text-base rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target mobile-button"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}