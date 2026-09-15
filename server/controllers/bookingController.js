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

/** Métodos de pago admitidos en el checkout. */
export const PAYMENT_METHODS = ['tarjeta', 'transferencia', 'checkin'];

/** Estados posibles de una reserva (se guardan como clave corta). */
export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'];

/**
 * POST /api/bookings  (público)
 * Body: { room, guest: { fullName, email, phone }, checkIn, checkOut,
 *         extrasSeleccionados: [{ name, price }], metodoPago }
 *
 * Es un motor de reserva directa: una vez que la habitación está disponible
 * para el rango de fechas, la reserva se crea CONFIRMADA al instante.
 * No existe flujo de aprobación manual por parte del personal.
 *
 * Pasos:
 *  1. Sanear y validar cada campo y el rango de fechas.
 *  2. Verificar que la habitación exista y esté activa.
 *  3. Precomprobación de solapamiento con la fórmula de intervalo:
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
  if (!checkIn || !checkOut) {
    return res.status(400).json({ message: 'checkIn y checkOut (YYYY-MM-DD) son obligatorios' });
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

  // ---- 3b. Sanear servicios adicionales y método de pago ------------------
  const extrasSeleccionados = sanitizeExtras(req.body?.extrasSeleccionados);
  const metodoPago = PAYMENT_METHODS.includes(req.body?.metodoPago)
    ? req.body.metodoPago
    : 'checkin';

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
  const roomSubtotal = Math.round(nightsCount * room.pricePerNight * 100) / 100;
  const extrasTotal = extrasSeleccionados.reduce((acc, e) => acc + e.price, 0);
  const totalPrice = Math.round((roomSubtotal + extrasTotal) * 100) / 100;

  const doc = {
    room: room._id,
    guest: { fullName, email, phone },
    checkIn,
    checkOut,
    nights,
    totalPrice,
    extrasSeleccionados,
    metodoPago,
    status: 'confirmed', // reserva directa: confirmación inmediata
  };

  const booking = await saveWithReferenceRetry(doc);
  const populated = await booking.populate('room', 'name number imageUrl pricePerNight');
  return res.status(201).json({
    message: 'Reserva creada correctamente',
    booking: toPublicBooking(populated),
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
 * Normaliza el array de extras enviado por el cliente. Cada ítem
 * { name, price } debe traer su importe TOTAL ya calculado (los extras
 * por noche llegan multiplicados por la cantidad de noches desde el
 * checkout). Devuelve siempre un array limpio y numerable.
 */
function sanitizeExtras(input) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 12)
    .map((raw) => {
      const name = sanitizeString(raw?.name, 120);
      const price = Number(raw?.price);
      if (!name || !Number.isFinite(price) || price < 0) return null;
      return { name, price: Math.round(price * 100) / 100 };
    })
    .filter(Boolean)
    .reduce((acc, e) => {
      const existing = acc.find((x) => x.name === e.name);
      if (existing) existing.price += e.price;
      else acc.push(e);
      return acc;
    }, []);
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

  const booking = await Booking.findOne({ referenceCode }).populate(
    'room',
    'name number imageUrl pricePerNight'
  );

  if (!booking || booking.guest.email !== email) {
    return res.status(404).json({ message: 'No se encontró ninguna reserva con ese código y correo' });
  }

  return res.json({ booking: toPublicBooking(booking) });
});

/**
 * GET /api/admin/bookings  (protegido)
 * Lista todas las reservas para la gestión, ordenadas de más reciente a más
 * antigua e incluyendo el detalle completo de la habitación.
 */
export const listAdminBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('room', 'name number imageUrl pricePerNight')
    .sort({ createdAt: -1 });
  return res.json({ bookings: bookings.map((b) => toPublicBooking(b)) });
});

/**
 * PATCH /api/admin/bookings/:id  (protegido)
 * Body: { status: 'pending' | 'confirmed' | 'cancelled' }
 *
 * Cambia el estado de una reserva respetando la integridad de las fechas:
 *  - De vuelta a 'cancelled': se vacía la ocupación (`nights`), liberando la
 *    habitación para nuevas reservas.
 *  - De 'cancelled' a 'confirmed'/'pending': se reconstruyen las noches y se
 *    vuelve a comprobar el solapamiento, para no pisar una reserva nueva.
 */
export const updateAdminBookingStatus = asyncHandler(async (req, res) => {
  const id = sanitizeString(req.params.id, 40);
  const status = String(req.body?.status || '').toLowerCase();

  if (!BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado de reserva inválido' });
  }

  const booking = await Booking.findById(id).select('+nights');
  if (!booking) {
    return res.status(404).json({ message: 'Reserva no encontrada' });
  }

  if (booking.status === 'cancelled' && status !== 'cancelled') {
    // Re-activar una reserva cancelada: reconstruir la ocupación y verificar
    // que las fechas siguen libres.
    const overlapping = await Booking.exists({
      _id: { $ne: booking._id },
      room: booking.room,
      status: { $ne: 'cancelled' },
      checkIn: { $lt: booking.checkOut },
      checkOut: { $gt: booking.checkIn },
    });
    if (overlapping) {
      return res.status(409).json({
        message: 'No se puede reactivar: esas fechas ya están ocupadas por otra reserva',
      });
    }
    booking.nights = buildNights(booking.checkIn, booking.checkOut);
  }

  if (status === 'cancelled') {
    booking.nights = []; // liberar las noches que ocupaba
  }

  booking.status = status;
  await booking.save();
  const populated = await booking.populate('room', 'name number imageUrl pricePerNight');
  return res.json({ booking: toPublicBooking(populated) });
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
