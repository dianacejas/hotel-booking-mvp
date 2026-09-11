import { useEffect, useRef, useState } from 'react';

const images = [
  {
    src: 'https://picsum.photos/seed/carajito-lobby/1200/800',
    label: 'Nuestro lobby',
    featured: true,
  },
  {
    src: 'https://picsum.photos/seed/carajito-patio/900/700',
    label: 'Patio y jardín',
  },
  {
    src: 'https://picsum.photos/seed/carajito-desayuno/900/700',
    label: 'Rincón de desayuno',
  },
  {
    src: 'https://picsum.photos/seed/carajito-fachada/900/700',
    label: 'Fachada del alojamiento',
  },
  {
    src: 'https://picsum.photos/seed/carajito-piscina/900/700',
    label: 'Piscina de temporada',
  },
  {
    src: 'https://picsum.photos/seed/carajito-terraza/900/700',
    label: 'Terraza panorámica',
  },
];

function ZoomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  );
}

export default function Gallery() {
  const [active, setActive] = useState(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setActive(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active]);

  return (
    <section className="landing-section">
      <div className="section-head">
        <p className="section-title">Espacios y ambiente</p>
        <h2>Un vistazo al alojamiento</h2>
        <p>
          Rincones comunes pensados para desconectar: jardines, luz natural y calidez boutique.
        </p>
      </div>
      <div className="gallery-grid">
        {images.map((img) => (
          <div
            key={img.src}
            role="button"
            tabIndex={0}
            className={`gallery-item${img.featured ? ' featured' : ''}`}
            onClick={() => setActive(img)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActive(img);
              }
            }}
            aria-haspopup="dialog"
            aria-label={`Ampliar imagen: ${img.label}`}
          >
            <img src={img.src} alt={img.label} loading="lazy" />
            <span className="gallery-zoom" aria-hidden="true">
              <ZoomIcon />
            </span>
            <span className="gallery-caption">{img.label}</span>
          </div>
        ))}
      </div>

      {active && (
        <div
          className="gallery-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={active.label}
          onClick={() => setActive(null)}
        >
          <figure onClick={(e) => e.stopPropagation()}>
            <button
              ref={closeRef}
              type="button"
              className="gallery-close"
              aria-label="Cerrar imagen"
              onClick={() => setActive(null)}
            >
              ×
            </button>
            <img src={active.src} alt={active.label} />
            <figcaption>{active.label}</figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}