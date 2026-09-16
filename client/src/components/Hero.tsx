import { useState } from 'react';
import type { SearchSubmit } from '../types';
import site from '../services/site';
import { toDateInputValue, todayLocal } from '../services/dates';

/**
 * Hero de portada. Reproduce en bucle un video del lago (Coverr, dominio
 * público) como fondo con una capa de degradado encima para mantener el
 * contraste del texto; si el video no carga, queda el póster/imagen.
 *
 * El formulario central es el buscador de disponibilidad: al enviarlo,
 * onSearch recibe las fechas y propaga la búsqueda hacia la página de inicio.
 */
const HERO_VIDEO_SRC = 'https://cdn.coverr.co/videos/coverr-trees-by-the-lake-8161/1080p.mp4';
const HERO_POSTER = 'https://picsum.photos/seed/altosdellago-hero-lake/1920/1080';

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

type HeroProps = {
  onSearch: (search: SearchSubmit) => void;
};

export default function Hero({ onSearch }: HeroProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [error, setError] = useState('');

  const minCheckIn = toDateInputValue(todayLocal());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (checkIn && checkOut && checkOut <= checkIn) {
      setError('La fecha de salida debe ser posterior a la de entrada.');
      return;
    }
    setError('');
    onSearch({ checkIn, checkOut, guests });
  };

  return (
    <section className="landing-hero">
      <video
        className="hero-video"
        src={HERO_VIDEO_SRC}
        poster={HERO_POSTER}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="hero-overlay" />

      <div className="landing-hero-inner">
        <p className="landing-eyebrow">{site.name}</p>
        <h1>{site.tagline}</h1>
        <p className="landing-hero-sub">
          Reservá directo desde nuestra web: mejores tarifas, confirmación inmediata y sin
          comisiones de plataformas.
        </p>

        <form className="search-bar" onSubmit={handleSubmit} role="search" noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="hero-in">
              Entrada
            </label>
            <input
              id="hero-in"
              type="date"
              min={minCheckIn}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setError('');
              }}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="hero-out">
              Salida
            </label>
            <input
              id="hero-out"
              type="date"
              min={checkIn || minCheckIn}
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setError('');
              }}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="hero-guests">
              Huéspedes
            </label>
            <select
              id="hero-guests"
              value={guests}
              onChange={(e) => {
                setGuests(e.target.value);
                setError('');
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'huésped' : 'huéspedes'}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary search-bar-btn">
            <CalendarIcon />
            Ver disponibilidad
          </button>
        </form>

        {error && <p className="error-text search-bar-error">{error}</p>}

        <ul className="hero-trust">
          <li>
            <CheckIcon />
            Mejor tarifa directa
          </li>
          <li>
            <CheckIcon />
            Confirmación inmediata
          </li>
          <li>
            <CheckIcon />
            Sin pago por adelantado
          </li>
        </ul>
      </div>
    </section>
  );
}