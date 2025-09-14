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
        <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Filters</h2>
          <div className="flex items-center gap-2">
            <button
              ref={firstFocusRef}
              type="button"
              onClick={onClear}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3 ios-momentum">
          <form className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort by</label>
              <div className="flex gap-2">
                <select
                  name="sortBy"
                  defaultValue={values.sortBy}
                  className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="w-28 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created after</label>
              <input
                type="date"
                name="dateFilter"
                defaultValue={values.dateFilter}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min. clicks</label>
              <input
                type="number"
                min="0"
                name="clicksFilter"
                defaultValue={values.clicksFilter}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag contains</label>
              <input
                type="text"
                name="tagFilter"
                defaultValue={values.tagFilter}
                placeholder="work"
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="inline-flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" name="showArchived" defaultChecked={values.showArchived} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                <span>Show archived</span>
              </label>
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-3 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 min-h-[44px]"
          >
            Clear
          </button>
          <button
            ref={lastFocusRef}
            type="button"
            onClick={handleApply}
            className="px-4 py-3 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}