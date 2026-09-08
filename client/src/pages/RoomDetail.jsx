import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import { formatPrice } from '../services/dates';

/**
 * Página pública de detalle de habitación. Muestra la descripción completa
 * y la lista de servicios. El formulario de reserva vive en la tarjeta de
 * la home; aquí se enlaza directo al checkout.
 */
export default function RoomDetail() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getRoom(id)
      .then((data) => setRoom(data.room))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar la habitación'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="muted">Cargando…</p>;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!room) return <Alert type="info">Habitación no encontrada.</Alert>;

  return (
    <div className="page page-narrow">
      <Link to="/" className="back-link">
        ← Todas las habitaciones
      </Link>

      <img className="detail-img" src={room.imageUrl || '/placeholder.jpg'} alt={room.name} />

      <div className="detail-row">
        <div>
          <h1>{room.name}</h1>
          <p className="card-sub">
            Para {room.capacity} {room.capacity === 1 ? 'persona' : 'personas'} · {formatPrice(room.pricePerNight)} / noche
          </p>
        </div>
        <Link to={`/checkout?room=${room._id}`} className="btn btn-primary">
          Reservar esta habitación
        </Link>
      </div>

      {room.description && <p className="detail-desc">{room.description}</p>}

      <h2 className="section-title">Servicios</h2>
      <div className="amenities">
        {(room.amenities || []).map((a) => (
          <span key={a} className="tag">
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}