import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CarSilhouette } from './CarSilhouette';
import { formatCOP } from '../../services/catalogService';

export function VehicleCard({ vehicle, onDetails }) {
  const { brand, model, year, price, body_type, fuel, transmission, mileage_km, hue, tagline, featured } = vehicle;

  return (
    <article className="card card--hover vcard" style={{ '--vh': hue }}>
      <div className="vcard__media">
        <div className="vcard__badges">
          {featured && <Badge variant="accent">★ Destacado</Badge>}
          {mileage_km === 0 ? <Badge variant="success">0 km</Badge> : <Badge variant="outline">Seminuevo</Badge>}
        </div>
        <CarSilhouette hue={hue} title={`${brand} ${model}`} />
      </div>

      <div className="vcard__body">
        <span className="vcard__brand">{brand} · {year}</span>
        <h3 className="vcard__title">{model}</h3>
        {tagline && <p className="vcard__tagline">{tagline}</p>}

        <div className="vcard__specs">
          <span className="vcard__spec">🚙 {body_type}</span>
          <span className="vcard__spec">⛽ {fuel}</span>
          <span className="vcard__spec">⚙️ {transmission}</span>
        </div>

        <div className="vcard__footer">
          <span className="vcard__price">
            {formatCOP(price)}
            <small>Precio de contado</small>
          </span>
          <Button size="sm" variant="ghost" onClick={() => onDetails?.(vehicle)}>
            Ver más
          </Button>
        </div>
      </div>
    </article>
  );
}
