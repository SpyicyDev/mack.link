import { useCallback, useEffect, useRef, useState } from 'react'

export function usePullToRefresh({
  onRefresh,
  threshold = 60,
  enabled = true,
  containerSelector = 'main'
}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  const container = useRef(null)

  const handleTouchStart = useCallback((e) => {
    if (!enabled || isRefreshing) return
    
    const touch = e.touches[0]
    startY.current = touch.clientY
    currentY.current = touch.clientY
    
    // Only enable pull-to-refresh if we're at the top of the scroll
    const element = container.current || document.querySelector(containerSelector)
    if (element && element.scrollTop === 0) {
      setIsPulling(true)
    }
  }, [enabled, isRefreshing, containerSelector])

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || !enabled || isRefreshing) return

    const touch = e.touches[0]
    currentY.current = touch.clientY
    const deltaY = currentY.current - startY.current

    if (deltaY > 0) {
      // Prevent default scroll behavior when pulling down
      e.preventDefault()
      
      // Apply rubber band effect - diminishing returns as we pull further
      const rubberBandDistance = Math.min(deltaY * 0.5, threshold * 1.5)
      setPullDistance(rubberBandDistance)
    } else {
      setPullDistance(0)
    }
  }, [isPulling, enabled, isRefreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || !enabled || isRefreshing) return

    setIsPulling(false)

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      setPullDistance(0)
      
      try {
        await onRefresh?.()
      } catch (error) {
        console.error('Pull to refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    } else {
      setPullDistance(0)
    }
  }, [isPulling, enabled, isRefreshing, pullDistance, threshold, onRefresh])

  useEffect(() => {
    const element = container.current || document.querySelector(containerSelector)
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, containerSelector])

  return {
    isRefreshing,
    pullDistance,
    isPulling,
    containerRef: container,
    showRefreshIndicator: isPulling && pullDistance > 20
  }
}