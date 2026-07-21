export function Badge({ variant = 'default', children, className = '' }) {
  const cls = ['badge', variant !== 'default' && `badge--${variant}`, className]
    .filter(Boolean)
    .join(' ');
  return <span className={cls}>{children}</span>;
}
