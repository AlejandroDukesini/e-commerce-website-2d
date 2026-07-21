import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CarSilhouette } from './CarSilhouette';
import { formatCOP } from '../../services/catalogService';

const SPECS = [
  ['Año', 'year'],
  ['Carrocería', 'body_type'],
  ['Combustible', 'fuel'],
  ['Transmisión', 'transmission'],
  ['Color', 'color'],
];

export function VehicleModal({ vehicle, onClose }) {
  if (!vehicle) return null;
  return (
    <Modal open={!!vehicle} onClose={onClose} title={`${vehicle.brand} ${vehicle.model}`}>
      <div className="vcard__media" style={{ '--vh': vehicle.hue, borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-5)' }}>
        <CarSilhouette hue={vehicle.hue} title={`${vehicle.brand} ${vehicle.model}`} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        {vehicle.featured && <Badge variant="accent">★ Destacado</Badge>}
        <Badge variant={vehicle.mileage_km === 0 ? 'success' : 'outline'}>
          {vehicle.mileage_km === 0 ? '0 km · Nuevo' : `${vehicle.mileage_km.toLocaleString('es-CO')} km`}
        </Badge>
      </div>

      <p style={{ color: 'var(--text-soft)', marginBottom: 'var(--sp-5)' }}>{vehicle.description}</p>

      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
        {SPECS.map(([label, key]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
            <dt style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>{label}</dt>
            <dd style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{vehicle[key]}</dd>
          </div>
        ))}
      </dl>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <div>
          <div className="vcard__price">{formatCOP(vehicle.price)}</div>
          <small style={{ color: 'var(--text-muted)' }}>o desde {formatCOP(vehicle.price / 60)} /mes*</small>
        </div>
        <Button variant="primary" href="#contacto" onClick={onClose}>Agendar prueba de manejo</Button>
      </div>
    </Modal>
  );
}
