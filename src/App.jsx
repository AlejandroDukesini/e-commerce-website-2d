import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { ScrollManager } from './components/util/ScrollManager';
import { Spinner } from './components/ui/Spinner';
import { Home } from './pages/Home';

// Route-level code splitting: Home ships eagerly (LCP), the rest on demand.
const Catalog = lazy(() => import('./pages/Catalog').then((m) => ({ default: m.Catalog })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Panel = lazy(() => import('./pages/Panel').then((m) => ({ default: m.Panel })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));

const Loading = () => (
  <div className="section flex-center" style={{ minHeight: '60vh' }}><Spinner /></div>
);

export default function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/panel"
              element={
                <ProtectedRoute>
                  <Panel />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
