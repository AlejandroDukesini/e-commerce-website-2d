import { useEffect, useRef, useState } from 'react';

/**
 * Asset depot / loader with graceful fallback.
 *
 * Assets live in `src/resources/` and are referenced lazily. If the requested
 * texture is missing (empty template), the hook resolves with `image: null`
 * and `missing: true` so the canvas can draw a procedural placeholder instead
 * of crashing. Swapping art later = drop a file in resources, no code change.
 *
 * @param {string|null} src  URL/path of the texture (or null to skip)
 * @returns {{ image: HTMLImageElement|null, status: string, missing: boolean }}
 */
export function useTextureLoader(src) {
  const [state, setState] = useState({ image: null, status: src ? 'loading' : 'idle', missing: !src });
  const cache = useRef(new Map());

  useEffect(() => {
    if (!src) {
      setState({ image: null, status: 'idle', missing: true });
      return;
    }
    if (cache.current.has(src)) {
      setState({ image: cache.current.get(src), status: 'loaded', missing: false });
      return;
    }

    let active = true;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!active) return;
      cache.current.set(src, img);
      setState({ image: img, status: 'loaded', missing: false });
    };
    img.onerror = () => {
      if (!active) return;
      // Missing asset is an expected state for an empty template, not an error.
      setState({ image: null, status: 'missing', missing: true });
    };
    img.src = src;
    return () => { active = false; };
  }, [src]);

  return state;
}

/**
 * Convenience wrapper: eagerly import everything under resources/.
 * Returns a flat map { name: url } (last extension wins). Empty when no assets.
 */
export function useResourceManifest() {
  const [manifest] = useState(() => {
    try {
      const files = import.meta.glob('../resources/**/*.{png,jpg,jpeg,webp,avif,svg}', {
        eager: true,
        query: '?url',
        import: 'default',
      });
      const out = {};
      for (const [path, url] of Object.entries(files)) {
        const name = path.split('/').pop().replace(/\.[^.]+$/, '');
        out[name] = url;
      }
      return out;
    } catch {
      return {};
    }
  });
  return manifest;
}

/**
 * Grouped manifest: { baseName: { webp, png, jpg, ... } } so a single asset
 * offered in multiple formats resolves without collisions.
 */
export function useResourceGroups() {
  const [groups] = useState(() => {
    try {
      const files = import.meta.glob('../resources/**/*.{png,jpg,jpeg,webp,avif,svg}', {
        eager: true,
        query: '?url',
        import: 'default',
      });
      const out = {};
      for (const [path, url] of Object.entries(files)) {
        const file = path.split('/').pop();
        const ext = file.split('.').pop().toLowerCase();
        const name = file.replace(/\.[^.]+$/, '');
        (out[name] ||= {})[ext] = url;
      }
      return out;
    } catch {
      return {};
    }
  });
  return groups;
}

/**
 * Pick the best source for a format group, preferring WebP with a raster
 * fallback. Returns { src, fallback } — `src` is what to try first, `fallback`
 * is the compatibility asset used if WebP fails to load / decode.
 */
export function preferWebp(group) {
  if (!group) return { src: '', fallback: '' };
  const raster = group.png || group.jpg || group.jpeg || group.avif || group.svg || '';
  return { src: group.webp || raster, fallback: raster || group.webp || '' };
}
