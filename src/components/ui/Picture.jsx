/**
 * <Picture> — responsive image with WebP-first + raster fallback.
 * Renders <picture><source type="image/webp"><img src={fallback}></picture>,
 * so browsers pick WebP when supported and fall back to PNG/JPG otherwise,
 * and a decode failure still shows the <img>.
 */
export function Picture({ webp, fallback, alt = '', className = '', loading = 'lazy', ...rest }) {
  return (
    <picture className={className}>
      {webp && <source srcSet={webp} type="image/webp" />}
      <img src={fallback || webp} alt={alt} loading={loading} decoding="async" {...rest} />
    </picture>
  );
}
