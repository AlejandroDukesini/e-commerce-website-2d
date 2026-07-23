import { Link } from 'react-router-dom';
import { ManageCookiesLink } from '../consent/ManageCookiesLink';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__col">
            <div className="brand">
              <span className="brand__mark"><span>◈</span></span>
              Autos del Camino
            </div>
            <p className="footer__blurb">
              Más que un auto, la libertad de llegar a donde sueñas. Vehículos nuevos y
              seminuevos con financiación pensada para ti.
            </p>
          </div>

          <nav className="footer__col" aria-label="Explorar">
            <h4>Explorar</h4>
            <Link to="/catalogo">Colección</Link>
            <Link to="/#entrega">Estándar de entrega</Link>
            <Link to="/#juego">Reto vial</Link>
            <Link to="/login">Portal de clientes</Link>
          </nav>

          <nav className="footer__col" aria-label="Compañía">
            <h4>Compañía</h4>
            <a href="#nosotros">Nosotros</a>
            <a href="#financiacion">Financiación</a>
            <a href="#garantia">Garantía</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <div className="footer__col">
            <h4>Visítanos</h4>
            <p className="footer__blurb" style={{ marginTop: 0 }}>
              Av. de la Libertad 123<br />
              Bogotá, Colombia<br />
              Lun–Sáb · 8:00–18:00<br />
              <a href="tel:+5716000000">+57 1 600 0000</a>
            </p>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} Autos del Camino. Todos los derechos reservados.</span>
          <span>
            <ManageCookiesLink className="cookie-manage-link" /> · Hecho con pasión por la carretera · Template MIT
          </span>
        </div>
      </div>
    </footer>
  );
}
