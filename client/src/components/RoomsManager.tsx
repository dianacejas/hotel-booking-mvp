import { useEffect, useState } from 'react';
import type { Room } from '../types';
import { ApiError } from '../services/api';
import Alert from '../components/Alert';
import AdminRoomSync from '../components/AdminRoomSync';
import { formatPrice } from '../services/dates';
import { roomEditSchema, type RoomEditData, type RoomEditInput } from '../schemas/bookingSchemas';
import {
  useAdminRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
} from '../hooks/useRooms';

/**
 * Gestión de habitaciones del panel de administración.
 * Extraído de AdminDashboard: inventario, edición completa en línea de cada
 * habitación (nombre, número, capacidad, tarifa, servicios, imagen, activo),
 * alta de habitaciones nuevas e integraciones de calendario (iCal) por fila.
 * Las ediciones se guardan campo por campo con el PATCH /api/admin/habitaciones/:id.
 *
 * El estado de servidor vive en TanStack Query (useAdminRoomsQuery); las
 * mutaciones actualizan la caché (setQueryData) y la invalidan para que el
 * catálogo público se refresque al instante sin recargar la página.
 * La validación de la edición corre con roomEditSchema (Zod) en el blur y al
 * guardar, con mensajes inline en español debajo de cada campo inválido.
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

type DraftFieldErrors = Partial<Record<keyof Draft, string>>;

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

/** Traduce el draft de texto al input que espera roomEditSchema (Zod). */
function buildRoomInput(draft: Draft): RoomEditInput {
  return {
    name: draft.name,
    number: draft.number || undefined,
    description: draft.description || undefined,
    capacity: draft.capacity,
    pricePerNight: draft.pricePerNight,
    amenities: cleanAmenities(draft.amenitiesText),
    imageUrl: draft.imageUrl || undefined,
    active: draft.active,
  };
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
  const roomsQuery = useAdminRoomsQuery();
  const updateRoom = useUpdateRoomMutation();
  const rooms = roomsQuery.data ?? [];

  const [errorMsg, setErrorMsg] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [syncOpen, setSyncOpen] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, DraftFieldErrors>>({});

  // Inicializa los borradores a partir de la caché sin pisar ediciones en curso.
  useEffect(() => {
    setDrafts((current) => {
      let changed = false;
      const next = { ...current };
      rooms.forEach((room) => {
        if (!next[room._id]) {
          next[room._id] = toDraft(room);
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [rooms]);

  const setDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
    // Al editar un campo se limpia su error inline.
    const touched = Object.keys(patch)[0] as keyof Draft | undefined;
    if (touched) {
      setFieldErrors((current) => {
        if (!current[id]?.[touched]) return current;
        return { ...current, [id]: { ...current[id], [touched]: undefined } };
      });
    }
  };

  const validateField = (id: string, field: keyof Draft) => {
    const draft = drafts[id];
    if (!draft) return;
    const parsed = roomEditSchema.partial().safeParse(buildRoomInput(draft));
    const message = parsed.success
      ? undefined
      : parsed.error.flatten().fieldErrors[field as keyof RoomEditData]?.[0];
    setFieldErrors((prev) => ({ ...prev, [id]: { ...prev[id], [field]: message } }));
  };

  const save = (id: string) => {
    const draft = drafts[id];
    if (!draft) return;

    const parsed = roomEditSchema.safeParse(buildRoomInput(draft));
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const errors: DraftFieldErrors = {};
      // Las claves de flat.fieldErrors son los campos del esquema (RoomEditData),
      // que son un subconjunto de las claves del Draft.
      Object.entries(flat.fieldErrors).forEach(([key, list]) => {
        errors[key as keyof Draft] = list?.[0];
      });
      setFieldErrors((prev) => ({ ...prev, [id]: errors }));
      setErrorMsg('Revisá los campos marcados antes de guardar.');
      return;
    }

    setFieldErrors((prev) => ({ ...prev, [id]: {} }));
    const data = parsed.data;
    const payload: Partial<Room> = {
      name: data.name,
      capacity: data.capacity,
      pricePerNight: data.pricePerNight,
      amenities: data.amenities ?? [],
      active: data.active ?? draft.active,
    };
    if (data.number) payload.number = data.number;
    if (data.description !== undefined) payload.description = data.description;
    if (data.imageUrl) payload.imageUrl = data.imageUrl;

    setBusyId(id);
    setSavedId(null);
    setErrorMsg('');
    updateRoom.mutate(
      { id, payload },
      {
        onSuccess: ({ room }) => {
          setDrafts((current) => ({ ...current, [id]: toDraft(room) }));
          setSavedId(id);
          setTimeout(() => setSavedId(null), 3000);
        },
        onError: (err) => {
          setErrorMsg(err instanceof ApiError ? err.message : 'No se pudo actualizar la habitación');
        },
        onSettled: () => setBusyId(null),
      }
    );
  };

  const toggleActive = (room: Room) => {
    setBusyId(room._id);
    setSavedId(null);
    setErrorMsg('');
    updateRoom.mutate(
      { id: room._id, payload: { active: !room.active } },
      {
        onSuccess: ({ room: updated }) => {
          setDrafts((current) => ({
            ...current,
            [room._id]: { ...current[room._id], active: Boolean(updated.active) },
          }));
        },
        onError: (err) => {
          setErrorMsg(err instanceof ApiError ? err.message : 'No se pudo actualizar la habitación');
        },
        onSettled: () => setBusyId(null),
      }
    );
  };

  const toggleSync = (id: string) =>
    setSyncOpen((current) => ({ ...current, [id]: !current[id] }));

  const handleCreated = () => {
    setShowForm(false);
    setErrorMsg('');
  };

  const queryError = roomsQuery.isError
    ? roomsQuery.error instanceof ApiError
      ? roomsQuery.error.message
      : 'No se pudieron cargar las habitaciones'
    : '';

  return (
    <div>
      <div className="filter-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowForm((v) => !v);
            setErrorMsg('');
          }}
        >
          {showForm ? 'Cerrar formulario' : '+ Nueva habitación'}
        </button>
      </div>

      {(queryError || errorMsg) && <Alert type="error">{queryError || errorMsg}</Alert>}

      {showForm && <NewRoomForm onCreated={handleCreated} onError={setErrorMsg} />}

      {roomsQuery.isPending ? (
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
                errors={fieldErrors[room._id]}
                onSave={() => save(room._id)}
                onDraft={(patch) => setDraft(room._id, patch)}
                onValidateField={(field) => validateField(room._id, field)}
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
  errors,
  onSave,
  onDraft,
  onValidateField,
  onToggleActive,
  syncOpen,
  onToggleSync,
}: {
  room: Room;
  draft: Draft;
  busy: boolean;
  dirty: boolean;
  saved: boolean;
  errors?: DraftFieldErrors;
  onSave: () => void;
  onDraft: (patch: Partial<Draft>) => void;
  onValidateField: (field: keyof Draft) => void;
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
            onBlur={() => onValidateField('number')}
            placeholder="101"
          />
          {errors?.number && <p className="field-error">{errors.number}</p>}
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
            onBlur={() => onValidateField('name')}
          />
          {errors?.name && <p className="field-error">{errors.name}</p>}
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
            onBlur={() => onValidateField('capacity')}
          />
          {errors?.capacity && <p className="field-error">{errors.capacity}</p>}
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
            onBlur={() => onValidateField('pricePerNight')}
          />
          {errors?.pricePerNight && <p className="field-error">{errors.pricePerNight}</p>}
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
            onBlur={() => onValidateField('imageUrl')}
            placeholder="https://…"
          />
          {errors?.imageUrl && <p className="field-error">{errors.imageUrl}</p>}
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
            onBlur={() => onValidateField('description')}
          />
          {errors?.description && <p className="field-error">{errors.description}</p>}
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
  const createRoom = useCreateRoomMutation();
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
      const parsed = roomEditSchema.safeParse({
        name: form.name,
        number: form.number || undefined,
        description: form.description || undefined,
        capacity: form.capacity,
        pricePerNight: form.pricePerNight,
        amenities: cleanAmenities(form.amenities),
        imageUrl: form.imageUrl || undefined,
      });
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        const firstMsg =
          Object.values(flat.fieldErrors).flat()[0] || flat.formErrors[0];
        onError(firstMsg || 'Revisá los campos del formulario');
        return;
      }
      await createRoom.mutateAsync({ ...parsed.data, active: true });
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
      <button type="submit" className="btn btn-primary" disabled={saving || createRoom.isPending}>
        {saving || createRoom.isPending ? 'Creando…' : 'Crear habitación'}
      </button>
    </form>
  );
}