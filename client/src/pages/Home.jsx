import { useEffect, useState } from 'react';
import api, { ApiError } from '../services/api';
import RoomCard from '../components/RoomCard';
import Alert from '../components/Alert';

/**
 * Página principal pública.
 * Carga las habitaciones activas y muestra una RoomCard por cada una.
 * Admite un filtro opcional ?guests=N que pide a la API habitaciones
 * con suficiente capacidad.
 */
export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const maxGuests = new URLSearchParams(window.location.search).get('guests');
    api
      .listRooms(maxGuests)
      .then((data) => setRooms(data.rooms))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las habitaciones'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <h1>Reserva directa, sin intermediarios.</h1>
        <p>
          Reserva nuestras habitaciones directamente en nuestra web. Sin
          plataformas ni comisiones de reserva: mejores tarifas, garantizado.
        </p>
      </section>

      {error && <Alert type="error">{error}</Alert>}
      {loading ? (
        <p className="muted">Cargando habitaciones…</p>
      ) : rooms.length === 0 ? (
        <Alert type="info">No hay habitaciones disponibles ahora mismo. Vuelve pronto.</Alert>
      ) : (
        <div className="room-grid">
          {rooms.map((room) => (
            <RoomCard key={room._id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}