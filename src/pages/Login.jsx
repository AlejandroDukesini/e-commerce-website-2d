import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { HeroScene } from '../components/home/HeroScene';

// SECURITY: the "tipo de cuenta" selector that used to live here let anyone
// self-register as `desarrollador` (maximum privilege) — the client simply
// chose its own role and the API trusted it. The backend now assigns
// `cliente` to every self-registration and rejects a `role` in the body, so
// the control is gone from the form as well: leaving it would only render a
// choice the server ignores. The four roles remain fully explorable through
// the demo accounts below.
const DEMOS = [
  { role: 'Cliente', email: 'cliente@demo.com', password: 'cliente1234' },
  { role: 'Empleado', email: 'empleado@demo.com', password: 'empleado1234' },
  { role: 'Gerente', email: 'gerente@demo.com', password: 'gerente1234' },
  { role: 'Desarrollador', email: 'dev@demo.com', password: 'developer1234' },
];

export function Login() {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dest = location.state?.from || '/panel';

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Algo salió mal. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (d) => { setMode('login'); set({ email: d.email, password: d.password }); setError(''); };

  return (
    <div className="auth">
      <aside className="auth__aside">
        <HeroScene />
        <div className="auth__aside-inner">
          <div className="brand" style={{ color: '#fff' }}>
            <span className="brand__mark" style={{ background: 'rgba(255,255,255,0.15)' }}><span>◈</span></span>
            Autos del Camino
          </div>
        </div>
        <div className="auth__aside-inner">
          <h2>Tu garaje digital, siempre contigo.</h2>
          <p>Guarda tus favoritos, sigue tu financiación y agenda pruebas de manejo desde un solo lugar.</p>
        </div>
        <div className="auth__aside-inner" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--fs-sm)' }}>
          Portal multirrol · Cliente · Empleado · Gerente · Desarrollador
        </div>
      </aside>

      <div className="auth__form-wrap">
        <form className="auth__form stack" onSubmit={submit} noValidate>
          <div>
            <span className="eyebrow">{mode === 'login' ? 'Bienvenido de vuelta' : 'Únete al camino'}</span>
            <h1>{mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h1>
          </div>

          {error && <div className="alert alert--error" role="alert">{error}</div>}

          {mode === 'register' && (
            <div className="field">
              <label className="field__label" htmlFor="name">Nombre completo</label>
              <input id="name" className="input" required minLength={2}
                value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} />
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" className="input" required autoComplete="email"
              value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="pass">Contraseña</label>
            <input id="pass" type="password" className="input" required minLength={mode === 'register' ? 8 : 1}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={form.password} onChange={(e) => set({ password: e.target.value })} />
          </div>

          {mode === 'register' && (
            <p className="auth__hint" style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
              Las cuentas nuevas se crean como <b>Cliente</b>. Los roles internos
              (empleado, gerente, desarrollador) los asigna un administrador.
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" block disabled={busy}>
            {busy ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </Button>

          <p className="auth__switch">
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>

          <div className="auth__demo">
            <b>Cuentas demo (clic para autocompletar):</b>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {DEMOS.map((d) => (
                <button type="button" key={d.email} className="chip" onClick={() => fillDemo(d)}>{d.role}</button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center' }}><Link to="/" style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>← Volver al inicio</Link></p>
        </form>
      </div>
    </div>
  );
}
