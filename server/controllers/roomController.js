import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import { sanitizeString, asyncHandler } from '../middlewares/validation.js';

/**
 * GET /api/rooms
 * Público: lista todas las habitaciones ACTIVAS con tarifa, capacidad
 * y servicios. Admite ?maxGuests=N para filtrar por capacidad.
 */
export const listRooms = asyncHandler(async (req, res) => {
  const filter = { active: true };

  const maxGuests = Number.parseInt(req.query.maxGuests, 10);
  if (!Number.isNaN(maxGuests) && maxGuests > 0) {
    filter.capacity = { $gte: maxGuests };
  }

  const rooms = await Room.find(filter).sort({ pricePerNight: 1 });
  return res.json({ rooms });
});

/**
 * GET /api/rooms/:id
 * Público: devuelve una única habitación activa.
 */
export const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ _id: req.params.id, active: true });
  if (!room) {
    return res.status(404).json({ message: 'Habitación no encontrada' });
  }
  return res.json({ room });
});

/**
 * GET /api/rooms/manage
 * Admin (protegido): todas las habitaciones, incluidas las inactivas,
 * empezando por las más recientes. Lo usa la vista de gestión del panel.
 */
export const listRoomsForAdmin = asyncHandler(async (req, res) => {
  const rooms = await Room.find().sort({ createdAt: -1 });
  return res.json({ rooms });
});

/**
 * POST /api/rooms
 * Admin (protegido): crear una habitación.
 */
export const createRoom = asyncHandler(async (req, res) => {
  const name = sanitizeString(req.body.name, 100);
  const description = sanitizeString(req.body.description, 1000);
  const capacity = Number.parseInt(req.body.capacity, 10);
  const pricePerNight = Number(req.body.pricePerNight);
  const active = req.body.active !== false;

  if (!name) {
    return res.status(400).json({ message: 'El nombre de la habitación es obligatorio' });
  }
  if (!Number.isInteger(capacity) || capacity < 1) {
    return res.status(400).json({ message: 'La capacidad debe ser un número entero positivo' });
  }
  if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
    return res.status(400).json({ message: 'El precio por noche no puede ser negativo' });
  }

  const rawAmenities = Array.isArray(req.body.amenities)
    ? req.body.amenities.map((a) => sanitizeString(a, 50)).filter(Boolean)
    : [];

  const room = await Room.create({
    name,
    description,
    capacity,
    pricePerNight,
    amenities: rawAmenities,
    imageUrl: sanitizeString(req.body.imageUrl, 300),
    number: sanitizeString(req.body.number, 20),
    active,
  });

  return res.status(201).json({ room });
});

/**
 * PUT /api/rooms/:id
 * Admin (protegido): actualizar una habitación (nombre, precio, capacidad,
 * activo, ...). Actualización parcial: solo cambia los campos recibidos.
 */
export const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ message: 'Habitación no encontrada' });
  }

  const updates = {};

  if (req.body.name !== undefined) {
    const name = sanitizeString(req.body.name, 100);
    if (!name) return res.status(400).json({ message: 'El nombre de la habitación es obligatorio' });
    updates.name = name;
  }

  if (req.body.description !== undefined) {
    updates.description = sanitizeString(req.body.description, 1000);
  }

  if (req.body.capacity !== undefined) {
    const capacity = Number.parseInt(req.body.capacity, 10);
    if (!Number.isInteger(capacity) || capacity < 1) {
      return res.status(400).json({ message: 'La capacidad debe ser un número entero positivo' });
    }
    updates.capacity = capacity;
  }

  if (req.body.pricePerNight !== undefined) {
    const pricePerNight = Number(req.body.pricePerNight);
    if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
      return res.status(400).json({ message: 'El precio por noche no puede ser negativo' });
    }
    updates.pricePerNight = pricePerNight;
  }

  if (req.body.amenities !== undefined) {
    updates.amenities = Array.isArray(req.body.amenities)
      ? req.body.amenities.map((a) => sanitizeString(a, 50)).filter(Boolean)
      : [];
  }

  if (req.body.imageUrl !== undefined) {
    updates.imageUrl = sanitizeString(req.body.imageUrl, 300);
  }

  if (typeof req.body.active === 'boolean') {
    updates.active = req.body.active;
  }

  if (req.body.number !== undefined) {
    updates.number = sanitizeString(req.body.number, 20);
  }

  const updated = await Room.findByIdAndUpdate(room._id, updates, {
    new: true,
    runValidators: true,
  });

  return res.json({ room: updated });
});

/**
 * GET /api/rooms/:id/calendar.ics
 * Público: alimenta la sección "Integraciones y Calendario" del panel admin.
 * Devuelve el calendario de ocupación de la habitación en formato iCalendar
 * (RFC 5545) con un bloque VEVENT por cada reserva activa (no cancelada),
 * listo para pegar en Booking, Airbnb o cualquier canal compatible.
 */
export const getRoomCalendarIcs = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Habitación no encontrada' });
  }

  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ message: 'Habitación no encontrada' });
  }

  const bookings = await Booking.find({
    room: room._id,
    status: { $ne: 'cancelled' },
  }).select('referenceCode guest.fullName checkIn checkOut');

  const now = formatIcalDateTime(new Date());
  const roomLabel = escapeIcalText([`Habitación ${room.number}`.trim(), room.name].filter(Boolean).join(' · '));

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Boutique Carajito//Hotel//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${roomLabel}`,
    ...bookings.flatMap((booking) => [
      'BEGIN:VEVENT',
      `UID:${room._id}-${booking._id}@boutiquecarajito.local`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${formatIcalDate(booking.checkIn)}`,
      `DTEND;VALUE=DATE:${formatIcalDate(booking.checkOut)}`,
      `SUMMARY:Ocupada - ${escapeIcalText(booking.referenceCode)} (${escapeIcalText(booking.guest?.fullName || 'Huésped')})`,
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];

  res.set({
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': `attachment; filename="habitacion-${room.number || room._id}.ics"`,
  });
  return res.send(lines.join('\r\n'));
});

/** "20260915" para DTSTART/DTEND de todo el día (fecha de calendario local). */
function formatIcalDate(d) {
  const date = new Date(d);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

/** "20260915T120000Z" en formato UTCDateTime para DTSTAMP. */
function formatIcalDateTime(d) {
  const date = new Date(d);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(
    date.getUTCDate()
  ).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}${String(
    date.getUTCMinutes()
  ).padStart(2, '0')}${String(date.getUTCSeconds()).padStart(2, '0')}Z`;
}

/** Escape de texto plano según RFC 5545 (\, ; , y saltos de línea). */
function escapeIcalText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * DELETE /api/rooms/:id
 * Admin (protegido): eliminar una habitación. Solo se permite si la
 * habitación no tiene reservas activas, preservando la integridad de datos.
 */
export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ message: 'Habitación no encontrada' });
  }

  const activeBookings = await Booking.countDocuments({
    room: room._id,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (activeBookings > 0) {
    return res.status(409).json({
      message: 'No se puede eliminar una habitación con reservas activas. Cancélalas primero.',
    });
  }

  await room.deleteOne();
  return res.json({ message: 'Habitación eliminada', roomId: room._id });
});