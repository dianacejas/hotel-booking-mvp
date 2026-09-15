import { useCallback, useEffect, useState } from 'react';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import { formatPrice } from '../services/dates';
import AdminBookings from '../components/AdminBookings';
import AdminRoomSync from '../components/AdminRoomSync';

/**
 * Panel de administración (protegido por ProtectedRoute en el cliente y por
 * el middleware JWT en el servidor).
 *
 * Dos vistas con pestañas:
 *  - "Habitaciones": inventario + tarifas + disponibilidad + integraciones
 *    de calendario (iCal) por habitación.
 *  - "Reservas": tabla de reservas realizadas con búsqueda, filtro y
 *    acciones rápidas (confirmar / cancelar).
 */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [syncOpen, setSyncOpen] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    api
      .listRoomsForAdmin()
      .then((data) => setRooms(data.rooms))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las habitaciones'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (id, updates) => {
    setBusyId(id);
    setError('');
    try {
      await api.updateRoom(id, updates);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar la habitación');
    } finally {
      setBusyId(null);
    }
  };

  const toggleSync = (id) => setSyncOpen((current) => ({ ...current, [id]: !current[id] }));

  return (
    <div className="page">
      <h1>Panel de administración</h1>
      <p className="muted">
        Gestiona el inventario de habitaciones, sus calendarios y las reservas recibidas.
      </p>

      <div className="admin-tabs" role="tablist" aria-label="Secciones del panel">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rooms'}
          className={`admin-tab${activeTab === 'rooms' ? ' admin-tab-active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Habitaciones
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'bookings'}
          className={`admin-tab${activeTab === 'bookings' ? ' admin-tab-active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Reservas realizadas
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {activeTab === 'rooms' ? (
        <div>
          <div className="filter-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowForm((v) => !v);
                setError('');
              }}
            >
              {showForm ? 'Cerrar formulario' : '+ Nueva habitación'}
            </button>
          </div>

          {showForm && <NewRoomForm onCreated={() => { load(); setShowForm(false); }} onError={setError} />}

          {loading ? (
            <p className="muted">Cargando habitaciones…</p>
          ) : rooms.length === 0 ? (
            <Alert type="info">Aún no hay habitaciones. Crea la primera arriba.</Alert>
          ) : (
            <div className="room-list">
              {rooms.map((r) => (
                <RoomBlock
                  key={r._id}
                  room={r}
                  busy={busyId === r._id}
                  onSave={save}
                  syncOpen={Boolean(syncOpen[r._id])}
                  onToggleSync={() => toggleSync(r._id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <AdminBookings />
      )}
    </div>
  );
}

/** Fila de habitación + panel plegable de integraciones de calendario. */
function RoomBlock({ room, busy, onSave, syncOpen, onToggleSync }) {
  const [rate, setRate] = useState(String(room.pricePerNight));

  const rateChanged = Number(rate) !== Number(room.pricePerNight);

  return (
    <div className={`card${room.active ? '' : ' row-muted'}`}>
      <div className="room-row">
        <div className="room-row-info">
          <strong>
            {room.number ? `N° ${room.number} — ` : ''}
            {room.name || 'Sin nombre'}
          </strong>
          <span className="muted small">
            Para {room.capacity} {room.capacity === 1 ? 'persona' : 'personas'} · {formatPrice(room.pricePerNight)} / noche
          </span>
        </div>

        <div className="room-row-rate">
          <label className="field-label" htmlFor={`rate-${room._id}`}>
            Tarifa / noche
          </label>
          <div className="rate-control">
            <input
              id={`rate-${room._id}`}
              type="number"
              min="0"
              step="1"
              value={rate}
              disabled={busy}
              onChange={(e) => setRate(e.target.value)}
            />
            {rateChanged && (
              <button
                type="button"
                className="btn btn-sm btn-success"
                disabled={busy}
                onClick={() => onSave(room._id, { pricePerNight: Number(rate) })}
              >
                Guardar
              </button>
            )}
          </div>
        </div>

        <div className="room-row-toggle">
          <button
            type="button"
            role="switch"
            aria-checked={room.active}
            disabled={busy}
            className={`toggle ${room.active ? 'toggle-on' : ''}`}
            onClick={() => onSave(room._id, { active: !room.active })}
            title={room.active ? 'Desactivar habitación' : 'Activar habitación'}
          >
            <span className="toggle-knob" />
          </button>
          <span className="small">{room.active ? 'Disponible' : 'No disponible'}</span>
        </div>
      </div>

      <div className="room-row-sync-toggle">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onToggleSync}>
          {syncOpen ? 'Ocultar integraciones' : 'Integraciones y Calendario'}
        </button>
      </div>

      {syncOpen && <AdminRoomSync room={room} />}
    </div>
  );
}

/** Formulario mínimo de alta de habitación. */
function NewRoomForm({ onCreated, onError }) {
  const [form, setForm] = useState({
    name: '',
    number: '',
    description: '',
    capacity: 2,
    pricePerNight: 100,
    amenities: '',
    imageUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createRoom({
        ...form,
        amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        capacity: Number(form.capacity),
        pricePerNight: Number(form.pricePerNight),
      });
      onCreated();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'No se pudo crear la habitación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card card-pad new-room-form">
      <h3>Nueva habitación</h3>
      <div className="form-grid">
        <div>
          <label className="field-label" htmlFor="nr-number">Número</label>
          <input id="nr-number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="101" />
        </div>
        <div>
          <label className="field-label" htmlFor="nr-name">Nombre</label>
          <input id="nr-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="field-label" htmlFor="nr-cap">Capacidad</label>
          <input id="nr-cap" type="number" min="1" max="20" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
        <div>
          <label className="field-label" htmlFor="nr-price">Tarifa / noche (US$)</label>
          <input id="nr-price" type="number" min="0" step="1" required value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} />
        </div>
        <div>
          <label className="field-label" htmlFor="nr-image">URL de la imagen</label>
          <input id="nr-image" type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
        </div>
        <div className="form-span">
          <label className="field-label" htmlFor="nr-amenities">Servicios (separados por comas)</label>
          <input id="nr-amenities" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder="Wi-Fi, Smart TV, Balcón" />
        </div>
        <div className="form-span">
          <label className="field-label" htmlFor="nr-desc">Descripción</label>
          <textarea id="nr-desc" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Creando…' : 'Crear habitación'}
      </button>
    </form>
  );
}