function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M6 2v2M10 2v2M14 2v2" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13a10 10 0 0 1 14 0" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M2 8.82a15 15 0 0 1 20 0" />
      <path d="M12 20h.01" />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="7" r="2" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M12 11c2.5 0 4.5 2 4.5 4.5 0 3-2.5 5.5-4.5 5.5s-4.5-2.5-4.5-5.5C7.5 13 9.5 11 12 11Z" />
    </svg>
  );
}

const items = [
  {
    title: 'Entrada y salida',
    text: 'Entrada desde las 15:00 h y salida hasta las 11:00 h. ¿Necesitas flexibilidad? Consúltanos.',
    icon: ClockIcon,
  },
  {
    title: 'Desayuno continental',
    text: 'Café de especialidad, pan artesanal, fruta fresca y opciones sin gluten incluidos.',
    icon: CoffeeIcon,
  },
  {
    title: 'Wi-Fi de alta velocidad',
    text: 'Fibra en todo el alojamiento, pensado para teletrabajar y hacer videollamadas sin cortes.',
    icon: WifiIcon,
  },
  {
    title: 'Aparcamiento y mascotas',
    text: 'Plaza de aparcamiento gratuita y mascotas bienvenidas sin cargo adicional.',
    icon: PawIcon,
  },
];

export default function Amenities() {
  return (
    <section className="landing-section">
      <div className="section-head">
        <p className="section-title">Servicios del hotel</p>
        <h2>Todo lo que necesitas para descansar</h2>
        <p>Comodidades pensadas para que te sientas como en casa desde el primer minuto.</p>
      </div>
      <div className="amenities-grid">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="card amenities-card">
              <span className="amenity-icon" aria-hidden="true">
                <Icon />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}