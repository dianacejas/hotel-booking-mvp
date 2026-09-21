import { useRef, useState } from 'react';
import type { SearchDates, SearchSubmit } from '../types';
import { ApiError } from '../services/api';
import { useRoomsQuery } from '../hooks/useRooms';
import RoomCard from '../components/RoomCard';
import Alert from '../components/Alert';
import Hero from '../components/Hero';
import Amenities from '../components/Amenities';
import Gallery from '../components/Gallery';
import Location from '../components/Location';
import FAQ from '../components/FAQ';
import ReviewsSection from '../components/ReviewsSection';

/**
 * Página principal pública.
 * El catálogo usa useRoomsQuery (TanStack Query): la búsqueda del hero cambia
 * la clave de caché (guests + fechas) y dispara la refetch sin estado manual.
 */
export default function Home() {
  const [guests, setGuests] = useState<string>(
    () => new URLSearchParams(window.location.search).get('guests') || ''
  );
  const [heroDates, setHeroDates] = useState<SearchDates>({ checkIn: '', checkOut: '' });
  const roomsRef = useRef<HTMLElement | null>(null);

  const roomsQuery = useRoomsQuery({
    maxGuests: guests || null,
    checkIn: heroDates.checkIn || null,
    checkOut: heroDates.checkOut || null,
  });
  const rooms = roomsQuery.data ?? [];

  const error = roomsQuery.isError
    ? roomsQuery.error instanceof ApiError
      ? roomsQuery.error.message
      : 'No se pudieron cargar las habitaciones'
    : '';

  const handleSearch = ({ checkIn, checkOut, guests: guestsCount }: SearchSubmit) => {
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
        {roomsQuery.isPending ? (
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
      <ReviewsSection />
      <Location />
      <FAQ />
    </div>
  );
}