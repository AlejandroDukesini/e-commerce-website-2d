import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

/**
 * Role-aware portal. The same page adapts its widgets to the user's role,
 * demonstrating the RBAC wiring end-to-end (backend claim → context → UI).
 */
const ROLE_CONTENT = {
  cliente: {
    title: 'Tu garaje',
    cards: [
      { h: 'Favoritos', kpi: '3', p: 'Autos que estás siguiendo.' },
      { h: 'Pruebas de manejo', kpi: '1', p: 'Agendada para el sábado.' },
      { h: 'Financiación', kpi: 'Pre-aprobada', p: 'Cupo disponible para estrenar.' },
    ],
  },
  empleado: {
    title: 'Panel de ventas',
    cards: [
      { h: 'Leads asignados', kpi: '12', p: 'Contactos por atender hoy.' },
      { h: 'Cierres del mes', kpi: '4', p: 'Vas por buen camino.' },
      { h: 'Inventario', kpi: '40', p: 'Vehículos disponibles.' },
    ],
  },
  gerente: {
    title: 'Tablero gerencial',
    cards: [
      { h: 'Ventas del mes', kpi: '$1.2 B', p: '+18% vs. mes anterior.' },
      { h: 'Equipo', kpi: '8', p: 'Asesores activos.' },
      { h: 'Rotación inventario', kpi: '22 días', p: 'Promedio por vehículo.' },
    ],
  },
  desarrollador: {
    title: 'Consola técnica',
    cards: [
      { h: 'API', kpi: 'OK', p: 'FastAPI · puerto 8081.' },
      { h: 'Rol / JWT', kpi: 'HS256', p: 'RBAC de 4 niveles activo.' },
      { h: 'Endpoints', kpi: '6', p: 'auth + catalog + health.' },
    ],
  },
};

export function Panel() {
  const { user, logout } = useAuth();
  const content = ROLE_CONTENT[user?.role] || ROLE_CONTENT.cliente;

  return (
    <>
      <section className="panel-head">
        <div className="container">
          <span className="eyebrow">Portal privado</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <h1 className="section-title" style={{ margin: 0 }}>Hola, {user?.full_name?.split(' ')[0]}</h1>
            <Badge variant="accent" className="role-pill">{user?.role}</Badge>
          </div>
          <p style={{ color: 'var(--text-soft)', marginTop: 'var(--sp-3)' }}>{content.title}</p>
        </div>
      </section>

      <section className="section container">
        <div className="panel-grid">
          {content.cards.map((c) => (
            <div key={c.h} className="panel-card">
              <span className="kpi">{c.kpi}</span>
              <h3 style={{ marginTop: '0.5rem' }}>{c.h}</h3>
              <p>{c.p}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'var(--sp-7)', flexWrap: 'wrap' }}>
          <Button to="/catalogo" variant="primary">Explorar catálogo</Button>
          <Button onClick={logout} variant="ghost">Cerrar sesión</Button>
        </div>
      </section>
    </>
  );
}
