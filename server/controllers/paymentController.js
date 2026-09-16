import { MercadoPagoConfig, Preference } from 'mercadopago';
import Room from '../models/Room.js';
import { sanitizeExtras } from './bookingController.js';
import {
  asyncHandler,
  sanitizeString,
  isValidEmail,
  isValidPhone,
  parseDateOnly,
  nightsBetween,
  generateReferenceCode,
} from '../middlewares/validation.js';

const STATEMENT_DESCRIPTOR = 'Altos del Lago Lodge';

/**
 * POST /api/pagos/crear-preferencia  (público)
 * Body: { room, guest: { fullName, email, phone }, checkIn, checkOut,
 *        extrasSeleccionados: [{ name, price }], origin: 'http://localhost:5173' }
 *
 * Crea una preferencia de Checkout Pro en modo sandbox/test usando los mismos
 * criterios de validación que /api/bookings. El total SIEMPRE se recalcula en
 * el servidor (noches × tarifa + extras) para no confiar en importes del
 * cliente. Devuelve el id de la preferencia y su punto de inicio (sandbox).
 */
export const crearPreferencia = asyncHandler(async (req, res) => {
  const accessToken = String(process.env.MP_ACCESS_TOKEN || '').trim();
  if (!accessToken) {
    return res.status(503).json({
      message:
        'Mercado Pago no está configurado: define MP_ACCESS_TOKEN (modo test) en server/.env',
    });
  }

  // ---- 1. Sanear y validar entradas (mismas reglas que createBooking) ------
  const fullName = sanitizeString(req.body?.guest?.fullName, 100);
  const email = sanitizeString(req.body?.guest?.email, 150).toLowerCase();
  const phone = sanitizeString(req.body?.guest?.phone, 30);
  const roomId = sanitizeString(req.body?.room, 40);

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Es necesario un correo electrónico válido del huésped' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: 'Es necesario un número de teléfono válido del huésped' });
  }

  const checkIn = parseDateOnly(req.body?.checkIn);
  const checkOut = parseDateOnly(req.body?.checkOut);
  if (!roomId) {
    return res.status(400).json({ message: 'room es obligatorio' });
  }
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return res.status(400).json({ message: 'checkIn y checkOut (YYYY-MM-DD) deben ser válidos' });
  }

  const room = await Room.findById(roomId);
  if (!room || !room.active) {
    return res.status(404).json({ message: 'Habitación no encontrada o no disponible' });
  }

  // ---- 2. Calcular el importe total en el servidor --------------------------
  const extras = sanitizeExtras(req.body?.extrasSeleccionados);
  const nights = nightsBetween(checkIn, checkOut);
  const roomSubtotal = Math.round(nights * room.pricePerNight * 100) / 100;
  const extrasTotal = extras.reduce((acc, e) => acc + e.price, 0);
  const totalPrice = Math.round((roomSubtotal + extrasTotal) * 100) / 100;

  if (totalPrice <= 0) {
    return res.status(400).json({ message: 'El importe de la reserva debe ser mayor que cero' });
  }

  // ---- 3. Orígenes para los back_urls (dev: puerto 5173; prod: mismo host) --
  const origin = sanitizeString(
    req.body?.origin,
    200
  ) || `${req.protocol}://${req.get('host')}`;

  const [firstName, ...rest] = fullName.split(/\s+/);
  const itemTitle =
    extras.length > 0
      ? `Altos del Lago — ${room.name} + ${extras.map((e) => e.name).join(', ')}`
      : `Altos del Lago — ${room.name}`;

  // ---- 4. Crear la preferencia de Checkout Pro ------------------------------
  try {
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        external_reference: generateReferenceCode(),
        items: [
          {
            id: String(room._id),
            title: itemTitle,
            description: `Estancia de ${nights} noche${nights === 1 ? '' : 's'} del ${checkIn.toLocaleDateString(
              'es-ES'
            )} al ${checkOut.toLocaleDateString('es-ES')}`,
            quantity: 1,
            unit_price: totalPrice,
          },
        ],
        payer: {
          name: firstName || fullName,
          surname: rest.join(' ') || '',
          email,
          phone: { number: phone },
        },
        back_urls: {
          success: `${origin}/confirmation?mp=success`,
          pending: `${origin}/confirmation?mp=pending`,
          failure: `${origin}/confirmation?mp=failure`,
        },
        auto_return: 'approved',
        statement_descriptor: STATEMENT_DESCRIPTOR,
      },
    });

    return res.json({
      preferenceId: result.id,
      // En modo sandbox el punto de inicio de prueba vive en sandbox_init_point.
      initPoint: result.sandbox_init_point || result.init_point,
      total: totalPrice,
    });
  } catch (err) {
    console.error('[MP] Error al crear la preferencia:', err.message || err);
    return res.status(502).json({
      message:
        'No se pudo conectar con Mercado Pago. Comprueba que MP_ACCESS_TOKEN sea un token TEST válido.',
    });
  }
});