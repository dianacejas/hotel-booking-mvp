import { useRef, useState } from 'react';

const images = [
  {
    src: 'https://picsum.photos/seed/carajito-lobby/1200/675',
    label: 'Nuestro lobby',
  },
  {
    src: 'https://picsum.photos/seed/carajito-patio/1200/675',
    label: 'Patio y jardín',
  },
  {
    src: 'https://picsum.photos/seed/carajito-desayuno/1200/675',
    label: 'Rincón de desayuno',
  },
  {
    src: 'https://picsum.photos/seed/carajito-fachada/1200/675',
    label: 'Fachada del alojamiento',
  },
  {
    src: 'https://picsum.photos/seed/carajito-piscina/1200/675',
    label: 'Piscina de temporada',
  },
  {
    src: 'https://picsum.photos/seed/carajito-terraza/1200/675',
    label: 'Terraza panorámica',
  },
];

function ChevronIcon({ direction }) {
  const isLeft = direction === 'left';
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {isLeft ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}

/**
 * Carrusel de fotos nativo (sin librerías): transición con CSS transform,
 * botones Anterior/Siguiente, indicadores de posición y gestos táctiles.
 * Cualquier imagen mantiene una proporción 16:9 fija con object-fit: cover.
 */
export default function Gallery() {
  const [active, setActive] = useState(0);
  const touchX = useRef(null);

  const go = (delta) =>
    setActive((current) => (current + delta + images.length) % images.length);

  const goTo = (index) => setActive(index);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  return (
    <section className="landing-section gallery-section" id="galeria">
      <div className="section-head">
        <p className="section-title">Espacios y ambiente</p>
        <h2>Un vistazo al alojamiento</h2>
        <p>
          Rincones comunes pensados para desconectar: jardines, luz natural y calidez boutique.
        </p>
      </div>

      <div
        className="gallery-carousel"
        role="region"
        aria-roledescription="carrusel"
        aria-label="Galería de imágenes del alojamiento"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div
          className="gallery-viewport"
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div
            className="gallery-track"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {images.map((img, i) => (
              <figure
                key={img.src}
                className="gallery-slide"
                aria-hidden={active !== i}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
                <figcaption className="gallery-slide-caption">
                  <span className="gallery-slide-index">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {img.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="gallery-controls">
          <button
            type="button"
            className="btn btn-ghost gallery-btn"
            onClick={() => go(-1)}
            aria-label={`Ver imagen anterior (${active} / ${images.length})`}
          >
            <ChevronIcon direction="left" />
            Anterior
          </button>

          <div className="gallery-dots" role="tablist" aria-label="Seleccionar imagen">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                role="tab"
                aria-selected={active === i}
                aria-label={`Mostrar imagen ${i + 1} de ${images.length}: ${img.label}`}
                className={`gallery-dot${active === i ? ' gallery-dot-active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <button
            type="button"
            className="btn btn-ghost gallery-btn"
            onClick={() => go(1)}
            aria-label={`Ver imagen siguiente (${active + 2} / ${images.length})`}
          >
            Siguiente
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>
    </section>
  );
}