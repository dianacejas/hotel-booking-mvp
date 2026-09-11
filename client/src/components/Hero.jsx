import { useState } from 'react';
import site from '../services/site';
import { toDateInputValue, todayLocal } from '../services/dates';

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

export default function Hero({ onSearch }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [error, setError] = useState('');

  const minCheckIn = toDateInputValue(todayLocal());

  const handleSubmit = (e) => {
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
      <div className="landing-hero-inner">
        <p className="landing-eyebrow">{site.name}</p>
        <h1>{site.tagline}</h1>
        <p className="landing-hero-sub">
          Reserva directo en nuestra web: mejores tarifas, confirmación inmediata y sin
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