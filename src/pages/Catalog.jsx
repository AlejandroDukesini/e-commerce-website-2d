import { useEffect, useMemo, useRef, useState } from 'react';
import { VehicleCard } from '../components/vehicles/VehicleCard';
import { VehicleModal } from '../components/vehicles/VehicleModal';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { catalogService, formatCOP } from '../services/catalogService';

const EMPTY_FILTERS = { q: '', brand: '', body_type: '', fuel: '', price_max: '', sort: 'relevance' };

/** Small debounce so typing/sliding doesn't spam the API. */
function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function Catalog() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [facets, setFacets] = useState(null); // captured once for stable filter UI
  const debounced = useDebounced(filters, 300);
  const firstLoad = useRef(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    catalogService
      .list(debounced, { signal: ctrl.signal })
      .then((res) => {
        setData(res);
        if (firstLoad.current) {
          setFacets(res);
          setFilters((f) => ({ ...f, price_max: f.price_max || Math.ceil(res.price_max) }));
          firstLoad.current = false;
        }
      })
      .catch((e) => { if (e.name !== 'AbortError') setData({ items: [], total: 0 }); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [debounced]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters({ ...EMPTY_FILTERS, price_max: facets ? Math.ceil(facets.price_max) : '' });

  const priceMax = useMemo(() => (facets ? Math.ceil(facets.price_max) : 200000000), [facets]);
  const priceMin = useMemo(() => (facets ? Math.floor(facets.price_min) : 0), [facets]);

  return (
    <>
      <section className="panel-head">
        <div className="container">
          <span className="eyebrow">Catálogo</span>
          <h1 className="section-title" style={{ maxWidth: '24ch' }}>Encuentra el auto que se mueve contigo</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 'var(--sp-3)' }}>
            Filtra por marca, tipo, combustible y presupuesto. Todo actualizado en tiempo real desde nuestro inventario.
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="catalog-layout">
          {/* -------- Filters -------- */}
          <aside className="filters" aria-label="Filtros de búsqueda">
            <div className="filters__group">
              <label className="filters__title" htmlFor="q">Buscar</label>
              <input id="q" className="input" placeholder="Marca o modelo…"
                value={filters.q} onChange={(e) => set({ q: e.target.value })} />
            </div>

            <div className="filters__group">
              <span className="filters__title">Carrocería</span>
              <div className="chip-row">
                {(facets?.body_types || []).map((b) => (
                  <button key={b} className={`chip ${filters.body_type === b ? 'is-active' : ''}`}
                    onClick={() => set({ body_type: filters.body_type === b ? '' : b })}>{b}</button>
                ))}
              </div>
            </div>

            <div className="filters__group">
              <label className="filters__title" htmlFor="brand">Marca</label>
              <select id="brand" className="select" value={filters.brand} onChange={(e) => set({ brand: e.target.value })}>
                <option value="">Todas</option>
                {(facets?.brands || []).map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="filters__group">
              <label className="filters__title" htmlFor="fuel">Combustible</label>
              <select id="fuel" className="select" value={filters.fuel} onChange={(e) => set({ fuel: e.target.value })}>
                <option value="">Todos</option>
                {(facets?.fuels || []).map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="filters__group">
              <label className="filters__title" htmlFor="price">
                Precio máx: {filters.price_max ? formatCOP(filters.price_max) : '—'}
              </label>
              <input id="price" type="range" className="range"
                min={priceMin} max={priceMax} step={1000000}
                value={filters.price_max || priceMax}
                onChange={(e) => set({ price_max: Number(e.target.value) })} />
            </div>

            <Button variant="ghost" size="sm" onClick={reset}>Limpiar filtros</Button>
          </aside>

          {/* -------- Results -------- */}
          <div>
            <div className="catalog-toolbar">
              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                {loading ? 'Buscando…' : `${data?.total ?? 0} vehículos encontrados`}
              </span>
              <div className="field" style={{ minWidth: 220 }}>
                <select className="select" value={filters.sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Ordenar">
                  <option value="relevance">Recomendados</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="year_desc">Más nuevos</option>
                </select>
              </div>
            </div>

            {loading && !data ? (
              <div className="section flex-center"><Spinner /></div>
            ) : data?.items?.length ? (
              <div className="vgrid">
                {data.items.map((v) => <VehicleCard key={v.id} vehicle={v} onDetails={setSelected} />)}
              </div>
            ) : (
              <div className="empty-state">
                <p style={{ fontSize: 'var(--fs-lg)', marginBottom: '0.5rem' }}>Sin resultados</p>
                <p>Prueba ajustando los filtros o <button onClick={reset} style={{ color: 'var(--brand)', fontWeight: 600 }}>límpialos</button>.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <VehicleModal vehicle={selected} onClose={() => setSelected(null)} />
    </>
  );
}
