import { useEffect, useState } from 'react';

const STORAGE_PREFIX = 'hb_ical_external_';

function buildSampleIcalUrl(room) {
  const origin = window.location.origin;
  return `${origin}/api/rooms/${room._id}/calendar.ics`;
}

/**
 * Sección "Integraciones y Calendario" dentro de la gestión de habitaciones.
 * Muestra el enlace iCal de la habitación con botón de copiar (con feedback
 * visual) y un campo para vincular un calendario externo (Booking/Airbnb).
 * Persistencia simulada en localStorage: cero dependencias, sin backend.
 */
export default function AdminRoomSync({ room }) {
  const [icalUrl, setIcalUrl] = useState(() => buildSampleIcalUrl(room));
  const [copiedAt, setCopiedAt] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setIcalUrl(buildSampleIcalUrl(room));
    setExternalUrl(localStorage.getItem(`${STORAGE_PREFIX}${room._id}`) || '');
    setSaved(false);
  }, [room]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(icalUrl);
    } catch {
      // Fallback para navegadores sin la Clipboard API (p. ej. HTTP no seguro)
      const helper = document.createElement('textarea');
      helper.value = icalUrl;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      document.body.removeChild(helper);
    }
    setCopiedAt(true);
    setTimeout(() => setCopiedAt(false), 2500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${room._id}`, externalUrl.trim());
    } catch {
      /* almacenamiento no disponible: la simulación solo vive en esta sesión */
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section className="card card-pad room-sync" aria-label={`Integraciones de ${room.name}`}>
      <h3 className="sync-title">Integraciones y Calendario</h3>

      <div className="sync-row">
        <label className="field-label" htmlFor={`ical-${room._id}`}>
          Enlace iCal de esta habitación
        </label>
        <div className="sync-copy">
          <input
            id={`ical-${room._id}`}
            readOnly
            value={icalUrl}
            onFocus={(e) => e.target.select()}
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy}>
            {copiedAt ? '¡Enlace copiado!' : 'Copiar enlace iCal'}
          </button>
        </div>
        <p className="muted small">
          Pegá este enlace en Airbnb, Booking o cualquier canal compatible para sincronizar el calendario.
        </p>
      </div>

      <form className="sync-row" onSubmit={handleSave}>
        <label className="field-label" htmlFor={`external-${room._id}`}>
          Vincular calendario externo (Booking / Airbnb iCal URL)
        </label>
        <div className="sync-copy">
          <input
            id={`external-${room._id}`}
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://calendario.booking.com/ical/…"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Guardar sincronización
          </button>
        </div>
        {saved && (
          <p className="alert alert-success sync-alert" role="status">
            Sincronización guardada correctamente
          </p>
        )}
        <p className="muted small">
          Recibiremos bloqueos automáticos de fechas desde el canal externo.
        </p>
      </form>
    </section>
  );
}