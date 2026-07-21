import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="notfound container">
      <div>
        <h1>404</h1>
        <h2 style={{ marginBottom: 'var(--sp-4)' }}>Te saliste del camino</h2>
        <p style={{ color: 'var(--text-soft)', marginBottom: 'var(--sp-6)' }}>
          La página que buscas no existe o se mudó de carril.
        </p>
        <Button to="/" variant="primary" size="lg">Volver al inicio</Button>
      </div>
    </div>
  );
}
