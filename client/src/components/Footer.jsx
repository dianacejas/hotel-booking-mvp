import { Link } from 'react-router-dom';
import site from '../services/site';

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" />
    </svg>
  );
}

function BanknoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4L3 8l4 4M3 8h18M17 20l4-4-4-4M21 16H3" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-contact">
          <h3>{site.name}</h3>
          <p>
            <PinIcon />
            <span>{site.address}</span>
          </p>
          <p>
            <PhoneIcon />
            <a href={site.phoneHref}>{site.phone}</a>
          </p>
          <p>
            <MailIcon />
            <a href={site.emailHref}>{site.email}</a>
          </p>
        </div>

        <div>
          <h3>Navegación</h3>
          <ul className="footer-links">
            <li>
              <Link to="/">Habitaciones y tarifas</Link>
            </li>
            <li>
              <Link to="/lookup">Consultar mi reserva</Link>
            </li>
            <li>
              <a
                href={`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(
                  site.whatsappMessage
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar por WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3>Social</h3>
          <ul className="footer-links">
            <li>
              <a href={site.instagram} target="_blank" rel="noopener noreferrer">
                <InstagramIcon />
                Instagram
              </a>
            </li>
            <li>
              <a href={site.facebook} target="_blank" rel="noopener noreferrer">
                <FacebookIcon />
                Facebook
              </a>
            </li>
          </ul>
          <h3>Métodos de pago</h3>
          <div className="pay-badges">
            <span className="pay-badge">
              <BanknoteIcon />
              Efectivo
            </span>
            <span className="pay-badge">
              <TransferIcon />
              Transferencia
            </span>
            <span className="pay-badge">
              <CardIcon />
              Tarjeta
            </span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {year} {site.name}. Todos los derechos reservados.
        </span>
        <span>
          Pagos en el alojamiento · No se efectúan cobros por adelantado
        </span>
      </div>
    </footer>
  );
}