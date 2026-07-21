import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Colección' },
  { to: '/#entrega', label: 'Estándar' },
  { to: '/#juego', label: 'Reto vial' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { toggle } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="container navbar__inner" aria-label="Principal">
        <NavLink to="/" className="brand" aria-label="Autos del Camino, inicio">
          <span className="brand__mark"><span>◈</span></span>
          Autos del Camino
        </NavLink>

        <ul className="nav-links">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <button className="icon-btn" onClick={toggle} aria-label="Cambiar tema" title="Cambiar tema">◐</button>
          {isAuthenticated ? (
            <>
              <Button to="/panel" variant="ghost" size="sm">{user?.full_name?.split(' ')[0] || 'Mi panel'}</Button>
              <Button onClick={handleLogout} variant="brand" size="sm">Salir</Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm">Ingresar</Button>
              <Button to="/catalogo" variant="primary" size="sm">Ver autos</Button>
            </>
          )}
          <button
            className="icon-btn nav-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            {open ? '×' : '☰'}
          </button>
        </div>
      </nav>

      <div className="container">
        <div className={`mobile-menu ${open ? 'is-open' : ''}`}>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link" onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            {isAuthenticated ? (
              <>
                <Button to="/panel" variant="ghost" size="sm" block onClick={() => setOpen(false)}>Mi panel</Button>
                <Button onClick={handleLogout} variant="brand" size="sm" block>Salir</Button>
              </>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm" block onClick={() => setOpen(false)}>Ingresar</Button>
                <Button to="/catalogo" variant="primary" size="sm" block onClick={() => setOpen(false)}>Ver autos</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
