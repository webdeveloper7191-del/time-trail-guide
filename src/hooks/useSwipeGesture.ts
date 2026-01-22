import { useRef, useCallback, useEffect } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance to trigger swipe (default: 50px)
  velocityThreshold?: number; // Minimum velocity to trigger swipe (default: 0.3)
  disabled?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture(config: SwipeConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3,
    disabled = false,
  } = config;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    touchEnd.current = null;
  }, [disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !touchStart.current) return;
    
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (disabled || !touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Calculate velocity (pixels per millisecond)
    const velocityX = absX / deltaTime;
    const velocityY = absY / deltaTime;

    // Determine if this is a horizontal or vertical swipe
    const isHorizontal = absX > absY;

    if (isHorizontal) {
      // Only trigger if above threshold and sufficient velocity
      if (absX >= threshold && velocityX >= velocityThreshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (absY >= threshold && velocityY >= velocityThreshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    // Reset
    touchStart.current = null;
    touchEnd.current = null;
  }, [disabled, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // Return refs and handlers for manual attachment
  const bind = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { bind };
}

// Hook that automatically binds to a ref
export function useSwipeRef<T extends HTMLElement>(config: SwipeConfig) {
  const ref = useRef<T>(null);
  const { bind } = useSwipeGesture(config);

  useEffect(() => {
    const cleanup = bind(ref.current);
    return cleanup;
  }, [bind]);

  return ref;
}
