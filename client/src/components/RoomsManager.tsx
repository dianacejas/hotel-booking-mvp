import { useCallback, useEffect, useState } from 'react';
import type { Room } from '../types';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import AdminRoomSync from '../components/AdminRoomSync';
import { formatPrice } from '../services/dates';

/**
 * Gestión de habitaciones del panel de administración.
 * Extraído de AdminDashboard: inventario, edición completa en línea de cada
 * habitación (nombre, número, capacidad, tarifa, servicios, imagen, activo),
 * alta de habitaciones nuevas e integraciones de calendario (iCal) por fila.
 * Las ediciones se guardan campo por campo con el PATCH /api/admin/habitaciones/:id.
 */

type Draft = {
  number: string;
  name: string;
  description: string;
  capacity: string;
  pricePerNight: string;
  amenitiesText: string;
  imageUrl: string;
  active: boolean;
};

function toDraft(room: Room): Draft {
  return {
    number: room.number || '',
    name: room.name,
    description: room.description || '',
    capacity: String(room.capacity ?? 1),
    pricePerNight: String(room.pricePerNight ?? 0),
    amenitiesText: (room.amenities || []).join(', '),
    imageUrl: room.imageUrl || '',
    active: Boolean(room.active),
  };
}

function cleanNumber(n: string): number {
  const value = Number(n);
  return Number.isFinite(value) ? value : 0;
}

function cleanAmenities(text: string): string[] {
  return text
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
}

function hasChanges(draft: Draft, room: Room): boolean {
  return (
    draft.number.trim() !== (room.number || '') ||
    draft.name.trim() !== (room.name || '') ||
    draft.description.trim() !== (room.description || '') ||
    cleanNumber(draft.capacity) !== (room.capacity || 1) ||
    cleanNumber(draft.pricePerNight) !== (room.pricePerNight || 0) ||
    draft.amenitiesText.trim() !== (room.amenities || []).join(', ') ||
    draft.imageUrl.trim() !== (room.imageUrl || '') ||
    draft.active !== Boolean(room.active)
  );
}

export default function RoomsManager() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [syncOpen, setSyncOpen] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const applyRooms = useCallback((list: Room[]) => {
    setRooms(list);
    setDrafts(
      list.reduce<Record<string, Draft>>((acc, room) => {
        acc[room._id] = toDraft(room);
        return acc;
      }, {})
    );
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listRoomsForAdmin()
      .then((data) => applyRooms(data.rooms))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las habitaciones'))
      .finally(() => setLoading(false));
  }, [applyRooms]);

  useEffect(() => {
    load();
  }, [load]);

  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));

  const save = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setBusyId(id);
    setSavedId(null);
    setError('');
    try {
      const payload: Partial<Room> = {
        name: draft.name.trim(),
        capacity: cleanNumber(draft.capacity),
        pricePerNight: cleanNumber(draft.pricePerNight),
        amenities: cleanAmenities(draft.amenitiesText),
        active: draft.active,
      };
      if (draft.number.trim()) payload.number = draft.number.trim();
      if (draft.description.trim()) payload.description = draft.description.trim();
      if (draft.imageUrl.trim()) payload.imageUrl = draft.imageUrl.trim();

      const { room } = await api.updateRoomAdmin(id, payload);
      applyRooms(rooms.map((r) => (r._id === id ? room : r)));
      setSavedId(id);
      setTimeout(() => setSavedId(null), 3000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar la habitación');
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (room: Room) => {
    setBusyId(room._id);
    setSavedId(null);
    setError('');
    try {
      const { room: updated } = await api.updateRoomAdmin(room._id, { active: !room.active });
      applyRooms(rooms.map((r) => (r._id === room._id ? updated : r)));
      setDraft(room._id, { active: Boolean(updated.active) });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar la habitación');
    } finally {
      setBusyId(null);
    }
  };

  const toggleSync = (id: string) =>
    setSyncOpen((current) => ({ ...current, [id]: !current[id] }));

  const handleCreated = () => {
    setShowForm(false);
    load();
  };

  return (
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

      {error && <Alert type="error">{error}</Alert>}

      {showForm && (
        <NewRoomForm onCreated={handleCreated} onError={setError} />
      )}

      {loading ? (
        <p className="muted">Cargando habitaciones…</p>
      ) : rooms.length === 0 ? (
        <Alert type="info">Aún no hay habitaciones. Crea la primera arriba.</Alert>
      ) : (
        <div className="room-list">
          {rooms.map((room) => {
            const draft = drafts[room._id];
            if (!draft) return null;
            const busy = busyId === room._id;
            return (
              <RoomBlock
                key={room._id}
                room={room}
                draft={draft}
                busy={busy}
                dirty={hasChanges(draft, room)}
                saved={savedId === room._id}
                onSave={() => save(room._id)}
                onDraft={(patch) => setDraft(room._id, patch)}
                onToggleActive={() => toggleActive(room)}
                syncOpen={Boolean(syncOpen[room._id])}
                onToggleSync={() => toggleSync(room._id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function RoomBlock({
  room,
  draft,
  busy,
  dirty,
  saved,
  onSave,
  onDraft,
  onToggleActive,
  syncOpen,
  onToggleSync,
}: {
  room: Room;
  draft: Draft;
  busy: boolean;
  dirty: boolean;
  saved: boolean;
  onSave: () => void;
  onDraft: (patch: Partial<Draft>) => void;
  onToggleActive: () => void;
  syncOpen: boolean;
  onToggleSync: () => void;
}) {
  const field = (name: keyof Draft) => draft[name] as string | boolean;

  return (
    <div className={`card room-edit${room.active ? '' : ' row-muted'}`}>
      <div className="room-row room-row-head">
        <div className="room-row-info">
          <strong>
            {draft.number.trim() ? `N° ${draft.number} — ` : ''}
            {draft.name.trim() || 'Sin nombre'}
          </strong>
          <span className="muted small">
            Para {draft.capacity || 1} {Number(draft.capacity) === 1 ? 'persona' : 'personas'} ·{' '}
            {formatPrice(cleanNumber(draft.pricePerNight))} / noche
          </span>
        </div>

        <div className="room-row-actions">
          {saved && (
            <span className="alert alert-success room-saved" role="status">
              Guardado
            </span>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={room.active}
            disabled={busy}
            className={`toggle ${room.active ? 'toggle-on' : ''}`}
            onClick={onToggleActive}
            title={room.active ? 'Desactivar habitación' : 'Activar habitación'}
          >
            <span className="toggle-knob" />
          </button>
          <span className="small">{room.active ? 'Disponible' : 'No disponible'}</span>
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label className="field-label" htmlFor={`re-number-${room._id}`}>
            Número
          </label>
          <input
            id={`re-number-${room._id}`}
            value={String(field('number'))}
            disabled={busy}
            onChange={(e) => onDraft({ number: e.target.value })}
            placeholder="101"
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`re-name-${room._id}`}>
            Nombre
          </label>
          <input
            id={`re-name-${room._id}`}
            required
            value={String(field('name'))}
            disabled={busy}
            onChange={(e) => onDraft({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`re-cap-${room._id}`}>
            Capacidad
          </label>
          <input
            id={`re-cap-${room._id}`}
            type="number"
            min="1"
            max="20"
            value={String(field('capacity'))}
            disabled={busy}
            onChange={(e) => onDraft({ capacity: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`re-price-${room._id}`}>
            Tarifa / noche (US$)
          </label>
          <input
            id={`re-price-${room._id}`}
            type="number"
            min="0"
            step="1"
            value={String(field('pricePerNight'))}
            disabled={busy}
            onChange={(e) => onDraft({ pricePerNight: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`re-img-${room._id}`}>
            URL de la imagen
          </label>
          <input
            id={`re-img-${room._id}`}
            type="url"
            value={String(field('imageUrl'))}
            disabled={busy}
            onChange={(e) => onDraft({ imageUrl: e.target.value })}
            placeholder="https://…"
          />
        </div>
        <div className="form-span">
          <label className="field-label" htmlFor={`re-amenities-${room._id}`}>
            Servicios (separados por comas)
          </label>
          <input
            id={`re-amenities-${room._id}`}
            value={String(field('amenitiesText'))}
            disabled={busy}
            onChange={(e) => onDraft({ amenitiesText: e.target.value })}
            placeholder="Wi-Fi, Smart TV, Balcón"
          />
        </div>
        <div className="form-span">
          <label className="field-label" htmlFor={`re-desc-${room._id}`}>
            Descripción
          </label>
          <textarea
            id={`re-desc-${room._id}`}
            rows={2}
            value={String(field('description'))}
            disabled={busy}
            onChange={(e) => onDraft({ description: e.target.value })}
          />
        </div>
      </div>

      <div className="room-row room-row-foot">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy || !dirty}
          onClick={onSave}
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onToggleSync}>
          {syncOpen ? 'Ocultar integraciones' : 'Integraciones y Calendario'}
        </button>
      </div>

      {syncOpen && <AdminRoomSync room={room} />}
    </div>
  );
}

/** Formulario mínimo de alta de habitación (reutiliza la vista previa). */
type NewRoomDraft = {
  name: string;
  number: string;
  description: string;
  capacity: string;
  pricePerNight: string;
  amenities: string;
  imageUrl: string;
};

function NewRoomForm({
  onCreated,
  onError,
}: {
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState<NewRoomDraft>({
    name: '',
    number: '',
    description: '',
    capacity: '2',
    pricePerNight: '100',
    amenities: '',
    imageUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createRoom({
        ...form,
        amenities: cleanAmenities(form.amenities),
        capacity: cleanNumber(form.capacity),
        pricePerNight: cleanNumber(form.pricePerNight),
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
          <textarea id="nr-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Creando…' : 'Crear habitación'}
      </button>
    </form>
  );
}