import { useEffect, useRef, useState } from 'react';
import api, { ApiError } from '../services/api';
import RoomCard from '../components/RoomCard';
import Alert from '../components/Alert';
import Hero from '../components/Hero';
import Amenities from '../components/Amenities';
import Gallery from '../components/Gallery';
import Location from '../components/Location';
import FAQ from '../components/FAQ';

/**
 * Página principal pública.
 * El buscador del hero filtra habitaciones por número de huéspedes
 * (?guests=N), deja pre-cargadas las fechas elegidas en cada tarjeta y
 * desliza con suavidad hasta la sección de disponibilidad.
 */
export default function Home() {
  const initialGuests = () =>
    new URLSearchParams(window.location.search).get('guests') || '';

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guests, setGuests] = useState(initialGuests);
  const [heroDates, setHeroDates] = useState({ checkIn: '', checkOut: '' });
  const roomsRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    api
      .listRooms(guests)
      .then((data) => setRooms(data.rooms))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las habitaciones')
      )
      .finally(() => setLoading(false));
  }, [guests]);

  const handleSearch = ({ checkIn, checkOut, guests: guestsCount }) => {
    setGuests(guestsCount);
    setHeroDates({ checkIn, checkOut });

    const url = new URL(window.location.href);
    url.searchParams.set('guests', guestsCount);
    window.history.replaceState({}, '', url.toString());

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    roomsRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const clearGuests = () => {
    setGuests('');
    const url = new URL(window.location.href);
    url.searchParams.delete('guests');
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div className="page">
      <Hero onSearch={handleSearch} />

      <section id="rooms" ref={roomsRef} className="rooms-section">
        <div className="rooms-head">
          <h2>Habitaciones y tarifas</h2>
          {guests && (
            <p className="rooms-hint">
              <span>
                Mostrando habitaciones para {guests}{' '}
                {guests === '1' ? 'huésped' : 'huéspedes'}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearGuests}>
                Ver todas
              </button>
            </p>
          )}
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {loading ? (
          <p className="muted">Cargando habitaciones…</p>
        ) : rooms.length === 0 ? (
          <Alert type="info">
            No hay habitaciones disponibles para {guests} huéspedes. Prueba con menos personas o
            vuelve pronto.
          </Alert>
        ) : (
          <div className="room-grid">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                initialCheckIn={heroDates.checkIn}
                initialCheckOut={heroDates.checkOut}
              />
            ))}
          </div>
        )}
      </section>

      <Amenities />
      <Gallery />
      <Location />
      <FAQ />
    </div>
  );
}