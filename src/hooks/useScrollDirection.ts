import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that tracks scroll direction.
 * Returns true when scrolling up or near the top of the page.
 * Returns false when scrolling down.
 */
export function useScrollDirection(threshold: number = 8): boolean {
  const [isVisible, setIsVisible] = useState(true);
  const prevScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Always visible near top of the page
          if (currentScrollY < 60) {
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isVisible;
}
