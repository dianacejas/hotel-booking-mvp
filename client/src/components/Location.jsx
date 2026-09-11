import site from '../services/site';

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
      <path d="M3 11h18v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M5 15H3v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1ZM19 15h2v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="13" rx="2" />
      <path d="M4 9h16M8 19l-2 2M16 19l2 2" />
      <path d="M9 13h.01M15 13h.01" />
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2L16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-1 1.7L8 11l-3 3-2-.5a1 1 0 0 0-.8 1.7l2.5 2.5a1 1 0 0 0 1.7-.8L6.5 15l3-3 3.1 4.2a1 1 0 0 0 1.7-1l.5-2 3 3 1.7 3a.8.8 0 0 0 1.3-.4Z" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M6 2v2M10 2v2M14 2v2" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3l4 8 5-5 5 15H2L8 3Z" />
    </svg>
  );
}

function WalkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13" cy="4" r="2" />
      <path d="M13 6v5l3 4v5M13 11l-3 1-1 4M5 7l3 1 3 3" />
    </svg>
  );
}

const points = [
  {
    icon: CarIcon,
    text: 'En coche: 15 min del centro y 40 min del aeropuerto. Tienes aparcamiento gratuito en el alojamiento.',
  },
  {
    icon: TrainIcon,
    text: 'Transporte público: parada de bus a 200 m y estación de tren a 15 min a pie.',
  },
  {
    icon: PlaneIcon,
    text: 'En avión: aeropuerto a 40 min; podemos ayudarte a organizar un traslado.',
  },
];

const near = [
  {
    icon: CoffeeIcon,
    title: 'Café de la plaza',
    text: 'Granos de origen y un patio con sombra ideal para empezar el día.',
    distance: '5 min a pie',
  },
  {
    icon: MountainIcon,
    title: 'Mirador del parque',
    text: 'La mejor panorámica de la ciudad, sin falta al atardecer.',
    distance: '10 min en coche',
  },
  {
    icon: WalkIcon,
    title: 'Sendero del río',
    text: 'Paseo llano de 4 km bordeando el agua, perfecto a pie o en bici.',
    distance: '15 min en coche',
  },
];

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;
const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(site.address)}&output=embed`;

export default function Location() {
  return (
    <section className="landing-section">
      <div className="section-head">
        <p className="section-title">Ubicación</p>
        <h2>Cómo llegar</h2>
        <p>En una zona tranquila y bien comunicada, te dejamos las claves para llegar sin rodeos.</p>
      </div>

      <div className="loc-grid">
        <div className="card loc-map-card">
          <iframe
            src={mapsEmbed}
            title="Mapa de Boutique Carajito en Google Maps"
            className="loc-map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

        <div className="card card-pad">
          <div className="loc-contact">
            <p className="loc-address">
              <PinIcon />
              <span>{site.address}</span>
            </p>
          </div>

          <ul className="loc-points">
            {points.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.text}>
                  <Icon />
                  <span>{p.text}</span>
                </li>
              );
            })}
          </ul>

          <div className="loc-buttons">
            <a
              className="btn btn-primary"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PinIcon />
              Abrir en Google Maps
            </a>
          </div>
        </div>
      </div>

      <div className="near">
        <h3>Qué hacer cerca</h3>
        <div className="near-grid">
          {near.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card card-pad near-item">
                <span className="near-icon" aria-hidden="true">
                  <Icon />
                </span>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
                <span className="tag near-distance">{item.distance}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}