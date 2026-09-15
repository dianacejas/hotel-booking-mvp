import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import { formatPrice, formatDate, toDateInputValue } from '../services/dates';

export const PAYMENT_METHODS = [
  { id: 'tarjeta', label: 'Tarjeta de Crédito / Débito', hint: 'Pago seguro procesado al confirmar' },
  { id: 'transferencia', label: 'Transferencia Bancaria Directa', hint: 'Envías el comprobante y lista' },
  { id: 'checkin', label: 'Pagar al llegar (Check-in)', hint: 'Sin pago por adelantado' },
];

/** Servicios adicionales vendidos en el checkout. */
export const EXTRAS_CATALOG = [
  { id: 'desayuno', name: 'Desayuno buffet artesanal', price: 12, type: 'perNight', desc: 'Café, jugos, panadería y frutas de estación' },
  { id: 'traslado', name: 'Traslado terminal / aeropuerto', price: 25, type: 'oneTime', desc: 'Ida o vuelta, a convenir al confirmar' },
  { id: 'lateCheckout', name: 'Late Check-out hasta las 16:00 hs', price: 20, type: 'oneTime', desc: 'Extendé tu estancia el día de salida' },
];

/** Datos bancarios de ejemplo para el método "transferencia". */
const BANK_DEMO = {
  bank: 'Banco de la Nación Argentina',
  account: 'Cuenta corriente N° 3347-8891-02',
  cbu: '2850 9900 3347 8891 0202',
  alias: 'CARAJITO.RESERVAS.WEB',
  titular: 'Boutique Carajito S.A.',
  concept: 'Número de reserva',
};

function formatCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/**
 * Checkout interactivo: upsells con precio dinámico, resumen de precios,
 * pestañas de pago simuladas y confirmación con spinner realista.
 */
export default function BookingCheckout({ room, checkIn, checkOut, nights }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [metodoPago, setMetodoPago] = useState('tarjeta');
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', holder: '' });
  const [transferOk, setTransferOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const roomSubtotal = Math.round(nights * room.pricePerNight * 100) / 100;

  const extras = useMemo(
    () =>
      EXTRAS_CATALOG.map((extra) => ({
        ...extra,
        total: Math.round(
          (extra.type === 'perNight' ? extra.price * nights : extra.price) * 100
        ) / 100,
      })),
    [nights]
  );

  const selectedDetails = extras.filter((extra) => selectedExtras.includes(extra.id));
  const extrasTotal = selectedDetails.reduce((acc, extra) => acc + extra.total, 0);
  const total = Math.round((roomSubtotal + extrasTotal) * 100) / 100;

  const toggleExtra = (id) =>
    setSelectedExtras((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  const isFormValid =
    form.fullName.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.phone.trim().length >= 6;

  const cardDigits = card.number.replace(/\D/g, '');
  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(card.expiry);
  const cardValid = expiryMatch
    ? new Date(`20${expiryMatch[2]}`, Number(expiryMatch[1])) >= new Date()
    : false;

  const paymentValid =
    metodoPago === 'tarjeta'
      ? cardDigits.length >= 15 && cardValid && card.cvc.length >= 3
      : metodoPago === 'transferencia'
        ? transferOk
        : true;

  const canSubmit = isFormValid && paymentValid && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);

    const payload = {
      room: room._id,
      guest: form,
      checkIn: toDateInputValue(checkIn),
      checkOut: toDateInputValue(checkOut),
      extrasSeleccionados: selectedDetails.map((extra) => ({ name: extra.name, price: extra.total })),
      metodoPago,
    };

    try {
      // Simula la pasarela de pago: espera una respuesta real de la API pero
      // muestra el spinner al menos 1.5 s para que la transición sea creíble.
      const [data] = await Promise.all([
        api.createBooking(payload),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
      navigate('/confirmation', { state: { booking: data.booking } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Algo salió mal. Inténtalo de nuevo.');
      setSubmitting(false);
    }
  };

  const cardBrand = cardDigits.startsWith('4')
    ? 'Visa'
    : cardDigits.startsWith('5')
      ? 'Mastercard'
      : String(cardDigits).slice(0, 2) >= '34' && String(cardDigits).slice(0, 2) <= '37'
        ? 'American Express'
        : cardDigits.length
          ? 'Tarjeta'
          : 'Tarjeta';

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      {error && <Alert type="error">{error}</Alert>}

      <section className="card card-pad">
        <h2 className="section-title">Tu estancia</h2>
        <p className="summary-room">
          {room.number ? `Habitación ${room.number} · ` : ''}
          {room.name}
        </p>
        <ul className="summary-list">
          <li>
            <span>Entrada</span>
            <strong>{formatDate(checkIn)}</strong>
          </li>
          <li>
            <span>Salida</span>
            <strong>{formatDate(checkOut)}</strong>
          </li>
          <li>
            <span>Noches</span>
            <strong>{nights}</strong>
          </li>
          <li>
            <span>Tarifa</span>
            <strong>{formatPrice(room.pricePerNight)} / noche</strong>
          </li>
        </ul>
        <div className="total-row">
          <span>Subtotal habitación</span>
          <strong>{formatPrice(roomSubtotal)}</strong>
        </div>
      </section>

      <section className="card card-pad">
        <h2 className="section-title">Sumá a tu estadía</h2>
        <div className="extra-list">
          {extras.map((extra) => {
            const checked = selectedExtras.includes(extra.id);
            return (
              <label key={extra.id} className={`extra-item${checked ? ' extra-checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleExtra(extra.id)}
                />
                <span className="extra-info">
                  <strong>{extra.name}</strong>
                  <span className="muted small">{extra.desc}</span>
                </span>
                <span className="extra-price">
                  {extra.type === 'perNight'
                    ? `${formatPrice(extra.price)} / noche`
                    : `${formatPrice(extra.price)} · única vez`}
                </span>
              </label>
            );
          })}
        </div>
        {selectedDetails.length > 0 && (
          <ul className="summary-list extras-summary">
            {selectedDetails.map((extra) => (
              <li key={extra.id}>
                <span>{extra.name}</span>
                <strong>{formatPrice(extra.total)}</strong>
              </li>
            ))}
          </ul>
        )}
        <div className="total-row">
          <span>Total final</span>
          <strong className="total-green">{formatPrice(total)}</strong>
        </div>
        <p className="muted small">Además del subtotal de la habitación ({formatPrice(roomSubtotal)}) + extras seleccionados.</p>
      </section>

      <section className="card card-pad">
        <h2 className="section-title">Datos del huésped</h2>
        <label className="field-label" htmlFor="cc-fullName">
          Nombre completo
        </label>
        <input
          id="cc-fullName"
          type="text"
          autoComplete="name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          placeholder="María García"
          required
        />
        <label className="field-label" htmlFor="cc-email">
          Correo electrónico
        </label>
        <input
          id="cc-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="maria@ejemplo.com"
          required
        />
        <label className="field-label" htmlFor="cc-phone">
          Teléfono
        </label>
        <input
          id="cc-phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+34 600 000 000"
          required
        />
      </section>

      <section className="card card-pad">
        <h2 className="section-title">Método de pago</h2>
        <div className="pay-tabs" role="tablist" aria-label="Método de pago">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              role="tab"
              aria-selected={metodoPago === method.id}
              className={`pay-tab${metodoPago === method.id ? ' pay-tab-active' : ''}`}
              onClick={() => setMetodoPago(method.id)}
            >
              {method.label}
            </button>
          ))}
        </div>

        {metodoPago === 'tarjeta' && (
          <div className="pay-panel">
            <div className="card-brand">
              <span>{cardBrand}</span>
            </div>
            <label className="field-label" htmlFor="cc-number">
              Número de tarjeta
            </label>
            <input
              id="cc-number"
              inputMode="numeric"
              autoComplete="cc-number"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
              placeholder="4242 4242 4242 4242"
            />
            <div className="card-field-row">
              <div>
                <label className="field-label" htmlFor="cc-expiry">
                  Vencimiento
                </label>
                <input
                  id="cc-expiry"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  placeholder="MM/AA"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cc-cvc">
                  CVC
                </label>
                <input
                  id="cc-cvc"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  type="password"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="123"
                />
              </div>
            </div>
            <label className="field-label" htmlFor="cc-holder">
              Titular de la tarjeta
            </label>
            <input
              id="cc-holder"
              autoComplete="cc-name"
              value={card.holder}
              onChange={(e) => setCard({ ...card, holder: e.target.value })}
              placeholder="María García"
            />
            <p className="muted small">Demo: no se realizan cargos reales con esta pasarela de ejemplo.</p>
          </div>
        )}

        {metodoPago === 'transferencia' && (
          <div className="pay-panel">
            <div className="bank-box">
              <p className="bank-name">{BANK_DEMO.bank}</p>
              <p>{BANK_DEMO.account}</p>
              <p className="mono bank-cbu">{BANK_DEMO.cbu}</p>
              <p className="muted small">Alias: <strong>{BANK_DEMO.alias}</strong></p>
              <p className="muted small">Titular: {BANK_DEMO.titular}</p>
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={transferOk}
                onChange={(e) => setTransferOk(e.target.checked)}
              />
              <span>Confirmo que realizaré la transferencia por el total antes del check-in.</span>
            </label>
            <p className="muted small">Demo: se muestran datos bancarios de muestra; ninguna transferencia real se ejecuta.</p>
          </div>
        )}

        {metodoPago === 'checkin' && (
          <div className="pay-panel">
            <p>Pagás directamente en el alojamiento el día de entrada. Sin pagos por adelantado ni
            retenciones.</p>
            <p className="muted small">Podés dejar una tarjeta en garantía en recepción si preferís.</p>
          </div>
        )}
      </section>

      <button type="submit" className="btn btn-primary btn-block" disabled={!canSubmit}>
        {submitting ? 'Confirmando…' : `Confirmar reserva · ${formatPrice(total)}`}
      </button>
      <p className="checkout-back">
        <Link to="/">← Volver a las habitaciones</Link>
      </p>

      {submitting && (
        <div className="processing-overlay" role="status" aria-live="polite">
          <div className="processing-box">
            <span className="spinner" aria-hidden="true" />
            <strong>Procesando confirmación…</strong>
            <span className="muted small">Conectando con la pasarela de pago de ejemplo</span>
          </div>
        </div>
      )}
    </form>
  );
}