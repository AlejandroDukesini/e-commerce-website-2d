import { useCallback, useEffect, useState } from 'react';

const KEY = 'adc_theme';

/** Light/dark theme toggle persisted to localStorage; defaults to OS preference. */
export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || 'auto');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const isDark =
        t === 'dark' ||
        (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      return isDark ? 'light' : 'dark';
    });
  }, []);

  return { theme, toggle };
}
