export function Skeleton({ className = '', width, height, ...props }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded transition-colors ${className}`}
      style={{ width, height }}
      {...props}
    />
  )
}

export function LinkSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-64" />
          </div>

          <Skeleton className="h-4 w-80 mb-2" />

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-8" />
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  )
}

export function LinkListSkeleton({ count = 5 }) {
  return (
    <section className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/50 overflow-hidden sm:rounded-lg transition-colors">
      <div className="px-4 py-5 sm:p-6">
        <div className="grid gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <LinkSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function HeaderSkeleton() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </header>
  )
}

export function SearchSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}

export function CreateFormSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/30 backdrop-blur-sm backdrop-saturate-150 overflow-y-auto h-full w-full z-50 transition duration-200 ease-out flex items-start sm:items-center justify-center p-4">
      <div className="mx-auto p-4 sm:p-5 border border-gray-200 dark:border-gray-700 w-full max-w-md sm:max-w-lg shadow-lg rounded-md bg-white dark:bg-gray-800 transition-colors">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-20 w-full rounded" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Skeleton className="h-10 w-20 rounded" />
            <Skeleton className="h-10 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function BulkToolbarSkeleton() {
  return (
    <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 px-4 py-3 transition-colors">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-24 rounded" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-20 rounded" />
        <Skeleton className="h-8 w-24 rounded" />
      </div>
    </div>
  )
}