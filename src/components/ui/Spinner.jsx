export function Spinner({ size, label = 'Cargando…' }) {
  return (
    <div className="flex-center" role="status" aria-live="polite">
      <span className={size === 'sm' ? 'spinner spinner--sm' : 'spinner'} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
