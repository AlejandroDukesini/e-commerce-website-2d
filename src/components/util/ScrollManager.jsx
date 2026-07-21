import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Restores scroll on route change and handles in-page #hash anchors
 * (e.g. navigating to /#experiencia from another route).
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait a tick for lazy sections to mount, then scroll to the anchor.
      const id = hash.slice(1);
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, [pathname, hash]);

  return null;
}
