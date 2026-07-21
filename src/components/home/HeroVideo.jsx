import { useState } from 'react';
import { HeroScene } from './HeroScene';

/**
 * Hero background: a looping muted video from /public, with the SVG "open road"
 * scene rendered behind it as a graceful fallback. If the video file is absent
 * or fails to load, `onError` hides the <video> and the SVG shows through — the
 * page never breaks with a missing asset (empty-template friendly).
 */
export function HeroVideo({ src = '/hero-bg.mp4', poster = '/hero-poster.jpg' }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="hero__media" aria-hidden="true">
      {/* Fallback scene sits behind the video */}
      <HeroScene className="hero-scene" />
      {!failed && (
        <video
          className="hero__video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, objectFit: 'cover' }}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
