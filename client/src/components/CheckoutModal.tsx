import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CreateBookingPayload, ExtraOption, PaymentMethodId, Room } from '../types';
import api, { ApiError } from '../services/api';
import { bookingFormSchema } from '../schemas/bookingSchemas';
import { useCreateBookingMutation } from '../hooks/useBookings';
import Alert from './Alert';
import { formatPrice, formatDate, toDateInputValue } from '../services/dates';

export type PayMethod = {
  id: PaymentMethodId;
  label: string;
  hint: string;
};

/** Formas de pago ofrecidas en el checkout. 'mercadopago' abre Checkout Pro. */
export const PAYMENT_METHODS: PayMethod[] = [
  { id: 'tarjeta', label: 'Tarjeta de Crédito / Débito', hint: 'Pago seguro procesado al confirmar' },
  { id: 'transferencia', label: 'Transferencia Bancaria Directa', hint: 'Envías el comprobante y lista' },
  { id: 'checkin', label: 'Pagar al llegar (Check-in)', hint: 'Sin pago por adelantado' },
  { id: 'mercadopago', label: 'Pago online con Mercado Pago', hint: 'Tarjetas, efectivo y más en su pasarela segura' },
];

/** Mapa id -> etiqueta con el nombre legible de cada método de pago. */
export const METHOD_LABEL: Record<string, string> = PAYMENT_METHODS.reduce(
  (acc, method) => {
    acc[method.id] = method.label;
    return acc;
  },
  {} as Record<string, string>
);

export function payMethodLabel(id?: string): string {
  if (id && METHOD_LABEL[id]) return METHOD_LABEL[id];
  return 'Pagar al llegar (Check-in)';
}

/** Servicios adicionales vendidos en el checkout (importe ya definido). */
export const EXTRAS_CATALOG: ExtraOption[] = [
  { id: 'desayuno', name: 'Desayuno buffet artesanal', price: 12, type: 'perNight', desc: 'Café, jugos, panadería y frutas de estación' },
  { id: 'traslado', name: 'Traslado terminal / aeropuerto', price: 25, type: 'oneTime', desc: 'Ida o vuelta, a convenir al confirmar' },
  { id: 'lateCheckout', name: 'Late Check-out hasta las 16:00 hs', price: 20, type: 'oneTime', desc: 'Extendé tu estancia el día de salida' },
];

/** Datos bancarios de ejemplo para el método "transferencia". */
const BANK_DEMO = {
  bank: 'Banco de la Nación Argentina',
  account: 'Cuenta corriente N° 3347-8891-02',
  cbu: '2850 9900 3347 8891 0202',
  alias: 'ALTOSDEL.LAGO.RESERVAS',
  titular: 'Altos del Lago Lodge & Boutique S.A.',
  concept: 'Número de reserva',
};

type CardState = { number: string; expiry: string; cvc: string; holder: string };
type GuestForm = { fullName: string; email: string; phone: string };
type GuestFormErrors = Partial<Record<'nombreCompleto' | 'email' | 'telefono', string>>;

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function MpLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M6.5 14.5c.6-2.4 2.3-4.2 4.7-5.3 1.2-.5 2.5-.7 3.8-.6-.4 1.4-1.1 2.6-2.1 3.6-1 1-2.2 1.6-3.7 2-.5.1-1.7.4-2.7.3Z"
        fill="currentColor"
      />
      <path
        d="M17.8 9.2c.2 1 .2 2-.1 3-.3 1.5-1.1 2.6-2.4 3.4-.3-1-.9-1.8-1.7-2.4.8-.7 1.5-1.8 1.9-2.6.3-.5.6-1 .8-1.6l1.5.6Z"
        fill="currentColor"
        opacity="0.65"
      />
    </svg>
  );
}

type CheckoutModalProps = {
  room: Room;
  checkIn: Date;
  checkOut: Date;
  nights: number;
};

/**
 * Checkout interactivo (modo modal/página): upsells con precio dinámico,
 * resumen de precios, pestañas de método de pago y confirmación real.
 * Incluye la integración de Mercado Pago (Checkout Pro en sandbox): se crea
 * la reserva en "pending", se guardan referencia + email en sessionStorage y
 * se redirige a la pasarela; al volver, /confirmation lee ?mp= y la referencia.
 */
export default function CheckoutModal({ room, checkIn, checkOut, nights }: CheckoutModalProps) {
  const navigate = useNavigate();
  const createBooking = useCreateBookingMutation();
  const [form, setForm] = useState<GuestForm>({ fullName: '', email: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState<GuestFormErrors>({});
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [metodoPago, setMetodoPago] = useState<PaymentMethodId>('tarjeta');
  const [card, setCard] = useState<CardState>({ number: '', expiry: '', cvc: '', holder: '' });
  const [transferOk, setTransferOk] = useState(false);
  const [error, setError] = useState('');

  const roomSubtotal = Math.round(nights * room.pricePerNight * 100) / 100;

  const extras = useMemo(
    () =>
      EXTRAS_CATALOG.map((extra) => ({
        ...extra,
        total:
          Math.round((extra.type === 'perNight' ? extra.price * nights : extra.price) * 100) / 100,
      })),
    [nights]
  );

  const selectedDetails = extras.filter((extra) => selectedExtras.includes(extra.id));
  const extrasTotal = selectedDetails.reduce((acc, extra) => acc + extra.total, 0);
  const total = Math.round((roomSubtotal + extrasTotal) * 100) / 100;

  const toggleExtra = (id: string) =>
    setSelectedExtras((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  // Datos en la forma que espera bookingFormSchema (nombres en español).
  const guestFormInput = { nombreCompleto: form.fullName, email: form.email, telefono: form.phone };
  const fullForm = {
    ...guestFormInput,
    checkIn: toDateInputValue(checkIn),
    checkOut: toDateInputValue(checkOut),
    extrasSeleccionados: selectedDetails.map((extra) => ({ name: extra.name, price: extra.total })),
    metodoPago,
  };
  const schemaResult = bookingFormSchema.safeParse(fullForm);
  const isFormValid = schemaResult.success;

  // Valida al perder el foco y deja el mensaje inline en español.
  // (Validamos toda la reserva: bookingFormSchema contiene un superRefine y
  // Zod v4 prohíbe usar .pick() sobre esquemas con refinements.)
  const validateField = (field: keyof GuestFormErrors) => {
    const result = bookingFormSchema.safeParse(fullForm);
    const message = result.success ? undefined : result.error.flatten().fieldErrors[field]?.[0];
    setFieldErrors((prev) => (prev[field] === message ? prev : { ...prev, [field]: message }));
  };

  const clearFieldError = (field: keyof GuestFormErrors) =>
    setFieldErrors((prev) => ({
      ...prev,
      [field]: prev[field] ? undefined : prev[field],
    }));

  const cardDigits = card.number.replace(/\D/g, '');
  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(card.expiry);
  const cardValid = expiryMatch
    ? new Date(Number(`20${expiryMatch[2]}`), Number(expiryMatch[1]) - 1) >= new Date()
    : false;

  const paymentValid =
    metodoPago === 'tarjeta'
      ? cardDigits.length >= 15 && cardValid && card.cvc.length >= 3
      : metodoPago === 'transferencia'
        ? transferOk
        : true;

  const canSubmit = isFormValid && paymentValid && !createBooking.isPending;

  const buildPayload = (): CreateBookingPayload => ({
    room: room._id,
    guest: { fullName: form.fullName, email: form.email, phone: form.phone },
    checkIn: toDateInputValue(checkIn),
    checkOut: toDateInputValue(checkOut),
    extrasSeleccionados: selectedDetails.map((extra) => ({ name: extra.name, price: extra.total })),
    metodoPago,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');

    // Validación Zod completa: campos del huésped + rango de fechas + extras.
    const result = bookingFormSchema.safeParse(fullForm);
    if (!result.success) {
      const flat = result.error.flatten();
      setFieldErrors({
        nombreCompleto: flat.fieldErrors.nombreCompleto?.[0],
        email: flat.fieldErrors.email?.[0],
        telefono: flat.fieldErrors.telefono?.[0],
      });
      const message =
        flat.fieldErrors.checkOut?.[0] || flat.fieldErrors.checkIn?.[0] || flat.formErrors[0];
      if (message) setError(message);
      return;
    }

    const payload = buildPayload();

    try {
      if (metodoPago === 'mercadopago') {
        // 1) Reserva en pending con método "mercadopago".
        const { booking } = await createBooking.mutateAsync({
          ...payload,
          origin: window.location.origin,
        });
        // 2) Guardamos clave de búsqueda para recuperar el comprobante al volver.
        try {
          sessionStorage.setItem(
            'hb_mp_reference',
            JSON.stringify({ ref: booking.referenceCode, email: form.email })
          );
        } catch {
          /* sessionStorage no disponible: se puede recuperar por /lookup */
        }
        // 3) Preferencia de Checkout Pro y redirección a la pasarela (sandbox).
        //    Si la pasarela no está disponible (p. ej. MP_ACCESS_TOKEN vacío),
        //    la reserva ya quedó registrada como pendiente y mostramos el
        //    comprobante igualmente para no bloquear al huésped.
        try {
          const pref = await api.createMpPreference({ ...payload, origin: window.location.origin });
          if (pref.initPoint) {
            window.location.href = pref.initPoint;
            return;
          }
        } catch {
          /* Pasarela no disponible: continuamos con la reserva pendiente. */
        }
        navigate('/confirmation', { state: { booking, mpFallback: true } });
        return;
      }

      // Pasarela simulada: crea la reserva real y muestra el comprobante.
      const createResult = await createBooking.mutateAsync(payload);
      navigate('/confirmation', { state: { booking: createResult.booking } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Algo salió mal. Inténtalo de nuevo.');
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
          onChange={(e) => {
            setForm({ ...form, fullName: e.target.value });
            clearFieldError('nombreCompleto');
          }}
          onBlur={() => validateField('nombreCompleto')}
          placeholder="María García"
          required
        />
        {fieldErrors.nombreCompleto && (
          <p className="field-error">{fieldErrors.nombreCompleto}</p>
        )}
        <label className="field-label" htmlFor="cc-email">
          Correo electrónico
        </label>
        <input
          id="cc-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value });
            clearFieldError('email');
          }}
          onBlur={() => validateField('email')}
          placeholder="maria@ejemplo.com"
          required
        />
        {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
        <label className="field-label" htmlFor="cc-phone">
          Teléfono
        </label>
        <input
          id="cc-phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => {
            setForm({ ...form, phone: e.target.value });
            clearFieldError('telefono');
          }}
          onBlur={() => validateField('telefono')}
          placeholder="+34 600 000 000"
          required
        />
        {fieldErrors.telefono && <p className="field-error">{fieldErrors.telefono}</p>}
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
              {method.id === 'mercadopago' && <MpLogo />}
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

        {metodoPago === 'mercadopago' && (
          <div className="pay-panel">
            <p className="mp-intro">
              <MpLogo />
              <strong>Pago online con Mercado Pago</strong>
            </p>
            <p>
              Al confirmar, te llevamos a la pasarela segura de Mercado Pago para pagar con
              débito, crédito, cuenta de Mercado Pago u otros medios disponibles.
            </p>
            <p className="muted small">
              Modo prueba (sandbox): el importe se muestra en pesos; la preferencia se crea con un
              token TEST y no se realizan cobros reales.
            </p>
          </div>
        )}
      </section>

      <button type="submit" className="btn btn-primary btn-block" disabled={!canSubmit}>
        {createBooking.isPending
          ? 'Confirmando…'
          : metodoPago === 'mercadopago'
            ? `Pagar con Mercado Pago · ${formatPrice(total)}`
            : `Confirmar reserva · ${formatPrice(total)}`}
      </button>
      <p className="checkout-back">
        <Link to="/">← Volver a las habitaciones</Link>
      </p>

      {createBooking.isPending && (
        <div className="processing-overlay" role="status" aria-live="polite">
          <div className="processing-box">
            <span className="spinner" aria-hidden="true" />
            <strong>Procesando confirmación…</strong>
            <span className="muted small">
              {metodoPago === 'mercadopago'
                ? 'Preparando el pago seguro de Mercado Pago'
                : 'Conectando con la pasarela de pago de ejemplo'}
            </span>
          </div>
        </div>
      )}
    </form>
  );
}