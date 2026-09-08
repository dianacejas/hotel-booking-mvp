import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import {
  asyncHandler,
  sanitizeString,
  isValidEmail,
  isValidPhone,
  parseDateOnly,
  buildNights,
  nightsBetween,
  generateReferenceCode,
} from '../middlewares/validation.js';

/**
 * POST /api/bookings  (público)
 * Body: { room, guest: { fullName, email, phone }, checkIn, checkOut }
 *
 * Es un motor de reserva directa: una vez que la habitación está disponible
 * para el rango de fechas, la reserva se crea CONFIRMADA al instante.
 * No existe flujo de aprobación manual por parte del personal.
 *
 * Pasos:
 *  1. Sanear y validar cada campo y el rango de fechas.
 *  2. Verificar que la habitación exista y esté activa.
 *  3. Comprobación previa de solapamiento con la fórmula de intervalo:
 *        newCheckIn < existingCheckOut AND newCheckOut > existingCheckIn
 *     para reservas no canceladas de la misma habitación.
 *  4. Insertar. El índice único multikey { room, nights } es la garantía
 *     FINAL a nivel de base de datos: si llega una petición concurrente que
 *     se solapa, falla con error de clave duplicada aunque la precomprobación
 *     haya pasado.
 */
export const createBooking = asyncHandler(async (req, res) => {
  // ---- 1. Sanear entradas ------------------------------------------------
  const fullName = sanitizeString(req.body?.guest?.fullName, 100);
  const email = sanitizeString(req.body?.guest?.email, 150).toLowerCase();
  const phone = sanitizeString(req.body?.guest?.phone, 30);
  const roomId = String(req.body?.room || '');

  const checkIn = parseDateOnly(req.body?.checkIn);
  const checkOut = parseDateOnly(req.body?.checkOut);

  if (!fullName) {
    return res.status(400).json({ message: 'El nombre completo del huésped es obligatorio' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Es necesario un correo electrónico válido del huésped' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: 'Es necesario un número de teléfono válido del huésped' });
  }
  if (!roomId || !checkIn || !checkOut) {
    return res.status(400).json({ message: 'room, checkIn y checkOut (YYYY-MM-DD) son obligatorios' });
  }

  // ---- 2. Validar rango de fechas -----------------------------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    return res.status(400).json({ message: 'La fecha de entrada no puede ser en el pasado' });
  }
  if (checkOut <= checkIn) {
    return res.status(400).json({ message: 'La fecha de salida debe ser posterior a la de entrada' });
  }

  // ---- 3. La habitación debe existir y ser reservable ----------------------
  const room = await Room.findById(roomId);
  if (!room || !room.active) {
    return res.status(404).json({ message: 'Habitación no encontrada o no disponible' });
  }

  // ---- 4. Precomprobación de solapamiento a nivel de aplicación ------------
  const overlapping = await Booking.exists({
    room: room._id,
    status: { $ne: 'cancelled' },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
  if (overlapping) {
    return res.status(409).json({
      message: 'Las fechas seleccionadas ya no están disponibles para esta habitación',
    });
  }

  // ---- 5. Construir e insertar (el índice de BD es la garantía dura) -------
  const nights = buildNights(checkIn, checkOut);
  const nightsCount = nightsBetween(checkIn, checkOut);
  const totalPrice = Math.round(nightsCount * room.pricePerNight * 100) / 100;

  const doc = {
    room: room._id,
    guest: { fullName, email, phone },
    checkIn,
    checkOut,
    nights,
    totalPrice,
    status: 'confirmed', // reserva directa: confirmación inmediata
  };

  const booking = await saveWithReferenceRetry(doc);
  return res.status(201).json({
    message: 'Reserva creada correctamente',
    booking: toPublicBooking(booking),
  });
});

/**
 * Persistir una reserva gestionando dos tipos de colisión de índice único:
 *  - colisión de referenceCode     -> generar un código nuevo y reintentar
 *  - colisión de nights/ocupación  -> estancia solapada: devolver 409
 */
async function saveWithReferenceRetry(doc) {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const ref = generateReferenceCode();
      return await Booking.create({ ...doc, referenceCode: ref });
    } catch (err) {
      const isDuplicate = err && err.code === 11000;
      const keyPattern = err?.keyPattern || {};
      if (isDuplicate && keyPattern.referenceCode) {
        continue; // colisión poco frecuente en el código legible -> reintentar
      }
      if (isDuplicate && (keyPattern.nights || keyPattern['nights._id'])) {
        const overlap = new Error('Las fechas seleccionadas ya no están disponibles para esta habitación');
        overlap.status = 409;
        throw overlap;
      }
      throw err;
    }
  }
  const giveaway = new Error('No se pudo asignar un código de referencia único. Inténtalo de nuevo');
  giveaway.status = 500;
  throw giveaway;
}

/**
 * GET /api/bookings/lookup/:referenceCode?email=...
 * Público: permite al huésped consultar su reserva con código + correo.
 * Se necesitan AMBOS: el código de referencia y el correo usado al reservar.
 */
export const getBookingByReference = asyncHandler(async (req, res) => {
  const referenceCode = sanitizeString(req.params.referenceCode, 20).toUpperCase();
  const email = sanitizeString(req.query.email, 150).toLowerCase();

  if (!referenceCode || !isValidEmail(email)) {
    return res.status(400).json({ message: 'El código de referencia y el correo son obligatorios' });
  }

  const booking = await Booking.findOne({ referenceCode }).populate('room', 'name imageUrl pricePerNight');

  if (!booking || booking.guest.email !== email) {
    return res.status(404).json({ message: 'No se encontró ninguna reserva con ese código y correo' });
  }

  return res.json({ booking: toPublicBooking(booking) });
});

/** Forma pública de una reserva: oculta el campo interno de ocupación. */
export function toPublicBooking(booking) {
  if (!booking) return booking;
  return {
    ...booking.toObject({ virtuals: true }),
    nights: undefined, // el campo interno de ocupación nunca sale de la API
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}