import { useCallback, useEffect, useState } from 'react';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import { formatPrice } from '../services/dates';

/**
 * Panel de administración (protegido por ProtectedRoute en el cliente y por
 * el middleware JWT en el servidor).
 *
 * Alcance reducido: NO es un PMS interno. Es una utilidad mínima para que el
 * propietario gestione el inventario de habitaciones:
 *   - crear habitaciones
 *   - editar la tarifa por noche
 *   - activar/desactivar la disponibilidad (un único interruptor por fila)
 */
export default function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="page">
      <h1>Gestión de habitaciones</h1>
      <p className="muted">
        Crea habitaciones, ajusta las tarifas y activa o desactiva su disponibilidad.
      </p>

      {error && <Alert type="error">{error}</Alert>}

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
            <RoomRow key={r._id} room={r} busy={busyId === r._id} onSave={save} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Fila de habitación con tarifa editable y UN único interruptor de estado. */
function RoomRow({ room, busy, onSave }) {
  const [rate, setRate] = useState(String(room.pricePerNight));

  const rateChanged = Number(rate) !== Number(room.pricePerNight);

  return (
    <div className={`room-row card ${room.active ? '' : 'row-muted'}`}>
      <div className="room-row-info">
        <strong>{room.name || 'Sin nombre'}</strong>
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
  );
}

/** Formulario mínimo de alta de habitación. */
function NewRoomForm({ onCreated, onError }) {
  const [form, setForm] = useState({
    name: '',
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