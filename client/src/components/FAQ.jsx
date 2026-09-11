import { useState } from 'react';

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button
        type="button"
        className="faq-q"
        aria-expanded={open}
        aria-controls={item.answerId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{item.q}</span>
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
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div id={item.answerId} role="region" className="faq-a">
        <div className="faq-a-inner">
          <p>{item.a}</p>
        </div>
      </div>
    </div>
  );
}

const faqs = [
  {
    id: 'cancel',
    q: '¿Puedo cancelar o modificar mi reserva?',
    a: 'Puedes cancelar sin cargo hasta 48 h antes de la entrada; dentro de ese plazo se aplica una noche de penalización. Los cambios de fechas están sujetos a disponibilidad, escríbenos por WhatsApp o llámanos y lo gestionamos contigo.',
  },
  {
    id: 'payment',
    q: '¿Qué métodos de pago aceptáis?',
    a: 'Aceptamos efectivo, transferencia local y tarjetas de crédito o débito. Pagas directamente en el alojamiento: nunca cobramos nada por adelantado.',
  },
  {
    id: 'crib',
    q: '¿Tenéis cunas o camas para bebés?',
    a: 'Sí, disponemos de cuna para bebés de 0 a 2 años sin coste adicional, con sujeción a disponibilidad. Indícala al reservar y la dejaremos preparada.',
  },
  {
    id: 'quiet',
    q: '¿Cuáles son las horas de silencio?',
    a: 'Respetamos las horas de silencio de 22:00 a 08:00 para que todo el mundo descanse. Pedimos a los huéspedes que eviten ruidos en pasillos y jardín durante este tramo.',
  },
  {
    id: 'breakfast',
    q: '¿El desayuno está incluido?',
    a: 'Sí, el desayuno continental está incluido en todas las tarifas: café de especialidad, pan artesanal, fruta fresca y opciones sin gluten bajo petición.',
  },
];

export default function FAQ() {
  return (
    <section className="landing-section">
      <div className="section-head">
        <p className="section-title">Preguntas frecuentes</p>
        <h2>Resolvemos tus dudas</h2>
        <p>Lo más habitual antes de reservar, respondido con transparencia.</p>
      </div>
      <div className="faq-list">
        {faqs.map((item) => (
          <FaqItem key={item.id} item={{ ...item, answerId: `faq-${item.id}` }} />
        ))}
      </div>
    </section>
  );
}