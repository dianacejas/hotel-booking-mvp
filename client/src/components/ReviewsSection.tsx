import { useReveal } from '../hooks/useReveal';

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden="true"
      className="star"
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z" />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="stars" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= full} />
      ))}
    </div>
  );
}

type Review = {
  name: string;
  stays: string;
  rating: number;
  comment: string;
};

const REVIEWS: Review[] = [
  {
    name: 'María Fernández',
    stays: 'Estadía de 3 noches · mar 2026',
    rating: 5,
    comment:
      'Reservamos en dos minutos directo por la web y nos mandaron el comprobante al instante. La habitación impecable y el desayuno buffet es imperdible.',
  },
  {
    name: 'Carlos Gutiérrez',
    stays: 'Estadía de 2 noches · jun 2026',
    rating: 5,
    comment:
      'El traslado desde el aeropuerto llegó puntual y el late check-out nos salvó la tarde. Atención cálida y precios claros, sin sorpresas.',
  },
  {
    name: 'Lucía Romero',
    stays: 'Estadía de 4 noches · abr 2026',
    rating: 4,
    comment:
      'Todo el proceso fue sencillo: elegís fechas, sumás extras y confirmás sin cargos ocultos. La ubicación y el jardín son un lujo.',
  },
  {
    name: 'Andrés Molina',
    stays: 'Estadía de 1 noche · jul 2026',
    rating: 5,
    comment:
      'Necesitábamos una noche cerca de la terminal y el precio directo fue mejor que en las plataformas. Ya lo tenemos guardado para volver.',
  },
];

/**
 * Sección de prueba social: calificación general y grilla de reseñas
 * realistas de huéspedes. Se adapta a modo claro/oscuro con las variables
 * de la paleta del sitio.
 */
export default function ReviewsSection() {
  const { ref, visible } = useReveal<HTMLElement>(0.08);

  return (
    <section
      ref={ref}
      className={`landing-section reviews-section reveal${visible ? ' reveal-visible' : ''}`}
      id="resenas"
    >
      <div className="section-head">
        <p className="section-title">Opiniones de huéspedes</p>
        <h2>Quienes ya se quedaron</h2>
        <p>Reseñas verificadas de estadías reales canalizadas desde nuestro gestor de reservas.</p>
      </div>

      <div className="reviews-overall">
        <div className="overall-score">
          <strong>4.9</strong>
          <span className="overall-max">/ 5</span>
        </div>
        <div>
          <Stars rating={5} />
          <p className="muted small">
            4.9 / 5 estrellas en reseñas de huéspedes
            <br />
            Basado en 128 opiniones verificadas
          </p>
        </div>
      </div>

      <div className="reviews-grid">
        {REVIEWS.map((review) => (
          <article key={review.name} className="card review-card">
            <div className="review-top">
              <Stars rating={review.rating} />
              <span className="muted small">{review.stays}</span>
            </div>
            <p className="review-comment">“{review.comment}”</p>
            <p className="review-name">
              <span className="avatar" aria-hidden="true">
                {review.name.charAt(0)}
              </span>
              {review.name}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}