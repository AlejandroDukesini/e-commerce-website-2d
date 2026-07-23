import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useConsent } from '../../context/ConsentContext';
import { defaultConsent, allGranted } from '../../services/consentStore';

/**
 * Panel de configuración granular: un toggle por categoría.
 * Mantiene un borrador local hasta que el usuario pulsa "Guardar".
 */
export function CookiePreferences() {
  const { prefsOpen, closePreferences, categories, savePreferences, CATEGORIES } =
    useConsent();

  const [draft, setDraft] = useState(categories);

  // Sincroniza el borrador con lo guardado cada vez que se abre el panel.
  useEffect(() => {
    if (prefsOpen) setDraft(categories);
  }, [prefsOpen, categories]);

  const toggle = (id) => setDraft((d) => ({ ...d, [id]: !d[id] }));

  return (
    <Modal open={prefsOpen} onClose={closePreferences} title="Preferencias de cookies">
      <p className="cookie-prefs__intro">
        Activa o desactiva cada categoría. Las cookies necesarias no pueden
        desactivarse porque el sitio no funcionaría sin ellas.
      </p>

      <ul className="cookie-prefs__list">
        {CATEGORIES.map((cat) => (
          <li key={cat.id} className="cookie-cat">
            <div className="cookie-cat__head">
              <span className="cookie-cat__label">{cat.label}</span>

              <label className="switch" title={cat.locked ? 'Siempre activas' : undefined}>
                <input
                  type="checkbox"
                  className="switch__input"
                  checked={cat.locked ? true : Boolean(draft[cat.id])}
                  disabled={cat.locked}
                  onChange={() => toggle(cat.id)}
                  aria-label={`Activar cookies ${cat.label.toLowerCase()}`}
                />
                <span className="switch__track" aria-hidden="true">
                  <span className="switch__thumb" />
                </span>
              </label>
            </div>
            <p className="cookie-cat__desc">{cat.description}</p>
          </li>
        ))}
      </ul>

      <div className="cookie-prefs__actions">
        <Button variant="ghost" size="sm" onClick={() => setDraft(defaultConsent())}>
          Solo necesarias
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDraft(allGranted())}>
          Seleccionar todas
        </Button>
        <Button variant="brand" size="sm" onClick={() => savePreferences(draft)}>
          Guardar preferencias
        </Button>
      </div>
    </Modal>
  );
}
