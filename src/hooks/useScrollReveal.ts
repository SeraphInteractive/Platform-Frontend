import { useEffect } from 'react';

/**
 * Initializes viewport intersection observer to add `.is-revealed` classes
 * to elements for smooth scroll-driven entrance animations across all browsers.
 */
export function useScrollReveal(dependencies: unknown[] = []) {
  useEffect(() => {
    // If native CSS scroll-driven animations are supported, we still add is-revealed for styling hooks
    const targets = document.querySelectorAll<HTMLElement>(
      '.landing-hero, .landing-metric-card, .landing-showcase-card, .landing-proposal-card, .ballot-slot, .pitch-card, .card, .white-card, .scroll-reveal'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    targets.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, dependencies);
}
