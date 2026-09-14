import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that tracks scroll direction.
 * Returns true when scrolling up or near the top of the page.
 * Returns false when scrolling down.
 */
export function useScrollDirection(
  threshold: number = 8,
  containerRef?: React.RefObject<HTMLElement | null>
): boolean {
  const [isVisible, setIsVisible] = useState(true);
  const prevScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const getScrollY = (target?: EventTarget | null) => {
      if (containerRef?.current) {
        return containerRef.current.scrollTop;
      }
      if (target instanceof HTMLElement && target !== document.body && target !== document.documentElement) {
        return target.scrollTop;
      }
      if (typeof window !== 'undefined') {
        const scrollContainer = document.querySelector('.page-scrollable');
        if (scrollContainer instanceof HTMLElement) {
          return scrollContainer.scrollTop;
        }
        return window.scrollY;
      }
      return 0;
    };

    const handleScroll = (e: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = getScrollY(e.target);

          // Always visible near top of the page
          if (currentScrollY < 40) {
            setIsVisible(true);
            prevScrollY.current = currentScrollY;
            ticking = false;
            return;
          }

          const diff = currentScrollY - prevScrollY.current;

          // Only trigger if scroll delta exceeds threshold
          if (Math.abs(diff) > threshold) {
            if (diff > 0) {
              // Scrolling down -> hide
              setIsVisible(false);
            } else {
              // Scrolling up -> reveal
              setIsVisible(true);
            }
            prevScrollY.current = currentScrollY;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Capture true intercepts scroll events from nested scroll containers like .page-scrollable
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [threshold, containerRef]);

  return isVisible;
}
