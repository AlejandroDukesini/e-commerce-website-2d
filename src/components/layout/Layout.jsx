import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/** App shell: fixed chrome (navbar/footer) wrapping the routed page. */
export function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
