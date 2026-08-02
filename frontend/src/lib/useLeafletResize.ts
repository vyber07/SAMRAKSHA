import { useEffect, useRef, useCallback } from 'react';
import type L from 'leaflet';

export interface UseLeafletResizeOptions {
  mapInstance?: L.Map | null;
  mapRef?: React.RefObject<L.Map | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  activeTab?: string | number;
  triggerDeps?: unknown[];
}

/**
 * Custom React hook for robust Leaflet map container resizing.
 * Performs multi-frame staggered map.invalidateSize() calls (0ms, rAF, 100ms, 300ms, 500ms)
 * bound to container ResizeObserver and window resize events.
 */
export function useLeafletResize(
  optionsOrMap: UseLeafletResizeOptions | React.RefObject<L.Map | null> | L.Map | null,
  argContainerRef?: React.RefObject<HTMLElement | null>,
  argTriggerDeps: unknown[] = []
) {
  // Normalize parameters
  let mapInstance: L.Map | null = null;
  let containerRef: React.RefObject<HTMLElement | null>;
  let activeTab: string | number | undefined;
  let triggerDeps: unknown[] = argTriggerDeps;

  if (optionsOrMap && typeof optionsOrMap === 'object' && 'containerRef' in optionsOrMap) {
    const opts = optionsOrMap as UseLeafletResizeOptions;
    mapInstance = opts.mapInstance ?? opts.mapRef?.current ?? null;
    containerRef = opts.containerRef;
    activeTab = opts.activeTab;
    triggerDeps = opts.triggerDeps ?? [];
  } else if (optionsOrMap && typeof optionsOrMap === 'object' && 'current' in optionsOrMap) {
    mapInstance = (optionsOrMap as React.RefObject<L.Map | null>).current;
    containerRef = argContainerRef!;
  } else {
    mapInstance = optionsOrMap as L.Map | null;
    containerRef = argContainerRef!;
  }

  const cleanupStaggerRef = useRef<(() => void) | null>(null);

  const invalidate = useCallback(() => {
    if (!mapInstance) return;

    if (cleanupStaggerRef.current) {
      cleanupStaggerRef.current();
    }

    // Phase 1: 0ms (Immediate synchronous invocation)
    mapInstance.invalidateSize({ animate: false });

    // Phase 2: requestAnimationFrame (Invoked right before browser paint frame)
    const rafId = requestAnimationFrame(() => {
      if (mapInstance) {
        mapInstance.invalidateSize({ animate: false });
      }
    });

    // Phase 3: 100ms timeout
    const t100 = setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize({ animate: false });
      }
    }, 100);

    // Phase 4: 300ms timeout
    const t300 = setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize({ animate: false });
      }
    }, 300);

    // Phase 5: 500ms timeout
    const t500 = setTimeout(() => {
      if (mapInstance) {
        mapInstance.invalidateSize({ animate: false });
      }
    }, 500);

    cleanupStaggerRef.current = () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t100);
      clearTimeout(t300);
      clearTimeout(t500);
    };
  }, [mapInstance]);

  // Trigger staggered invalidation on mapInstance ready or tab/dep change
  useEffect(() => {
    if (!mapInstance) return;

    invalidate();

    return () => {
      if (cleanupStaggerRef.current) {
        cleanupStaggerRef.current();
      }
    };
  }, [mapInstance, activeTab, invalidate, ...triggerDeps]);

  // ResizeObserver on container element + Window resize listener
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !mapInstance) return;

    let resizeRafId: number;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          cancelAnimationFrame(resizeRafId);
          resizeRafId = requestAnimationFrame(() => {
            if (mapInstance) {
              mapInstance.invalidateSize({ animate: false });
            }
          });
        }
      }
    });

    observer.observe(container);

    const handleWindowResize = () => {
      invalidate();
    };

    window.addEventListener('resize', handleWindowResize, { passive: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(resizeRafId);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [mapInstance, containerRef, invalidate]);

  return { triggerResize: invalidate };
}
