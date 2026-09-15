import mongoose from 'mongoose';

/**
 * Modelo Booking: una reserva de una habitación para un rango de fechas.
 *
 * RESERVA DIRECTA
 * --------------
 * En este proyecto las reservas se crean directamente CONFIRMADAS (el
 * huésped reserva y obtiene su confirmación al instante). No hay flujo de
 * aprobación manual. El estado "cancelled" existe para poder liberar noches.
 *
 * PREVENCIÓN DE SOLAPAMIENTO A NIVEL DE BASE DE DATOS
 * ---------------------------------------------------
 * Regla de solapamiento entre dos reservas de la misma habitación:
 *   newCheckIn  < existingCheckOut
 *   AND newCheckOut > existingCheckIn
 *
 * Para que se cumpla DENTRO de MongoDB (no solo en la lógica de la app),
 * cada estancia se expande en un array `nights` con una entrada por noche
 * (siempre a medianoche local). Se crea un ÍNDICE ÚNICO COMPUESTO MULTIKEY
 * sobre { room, nights }:
 *
 *   bookingSchema.index({ room: 1, nights: 1 }, { unique: true, ... })
 *
 * Como el índice es único por el PAR (room, night), insertar una reserva
 * cuyo array `nights` comparta al menos una noche con una reserva no
 * cancelada de la misma habitación falla al instante con un error de clave
 * duplicada (E11000). Dos peticiones concurrentes que superen la
 * precomprobación de disponibilidad pueden igualmente rechazarse: el segundo
 * INSERT tropieza con el índice único. No es posible insertar estancias
 * solapadas.
 *
 * Reservas canceladas: al cancelar se fija status='cancelled' Y se vacía su
 * array `nights`. Al vaciarlo se eliminan todos los pares indexados
 * (room, night), por lo que la reserva cancelada deja de ocupar noches.
 *
 * El campo `nights` queda oculto en los payloads de la API mediante
 * `select: false`, pero el índice permanece activo en la base de datos.
 */
const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Es obligatorio indicar la habitación'],
    },
    guest: {
      fullName: {
        type: String,
        required: [true, 'El nombre completo del huésped es obligatorio'],
        trim: true,
        maxlength: [100, 'El nombre del huésped no puede superar los 100 caracteres'],
      },
      email: {
        type: String,
        required: [true, 'El correo del huésped es obligatorio'],
        trim: true,
        lowercase: true,
        maxlength: [150, 'El correo no puede superar los 150 caracteres'],
      },
      phone: {
        type: String,
        required: [true, 'El teléfono del huésped es obligatorio'],
        trim: true,
        maxlength: [30, 'El teléfono no puede superar los 30 caracteres'],
      },
    },
    checkIn: {
      type: Date,
      required: [true, 'La fecha de entrada es obligatoria'],
    },
    checkOut: {
      type: Date,
      required: [true, 'La fecha de salida es obligatoria'],
    },
    // Una fecha (medianoche local) por cada noche de la estancia. Impulsa el
    // índice único de ocupación; oculto en las consultas normales.
    nights: {
      type: [Date],
      select: false,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    totalPrice: {
      type: Number,
      min: [0, 'El total no puede ser negativo'],
      required: true,
    },
    // Servicios adicionales contratados (upselling). Cada ítem guarda el
    // nombre legible y el importe TOTAL del extra (los extras por noche ya
    // vienen multiplicados por la cantidad de noches por el cliente).
    extrasSeleccionados: {
      type: [
        {
          name: {
            type: String,
            required: [true, 'El nombre del servicio extra es obligatorio'],
            trim: true,
            maxlength: [120, 'El nombre del extra no puede superar los 120 caracteres'],
          },
          price: {
            type: Number,
            required: [true, 'El importe del servicio extra es obligatorio'],
            min: [0, 'El importe del extra no puede ser negativo'],
          },
        },
      ],
      default: [],
      _id: false,
    },
    // Método de pago elegido en el checkout. Se guarda como clave corta y
    // la etiqueta en español se resuelve en el cliente.
    metodoPago: {
      type: String,
      enum: ['tarjeta', 'transferencia', 'checkin'],
      default: 'checkin',
    },
    // Referencia única legible mostrada a los huéspedes, p. ej. RES-9K4XQ
    referenceCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Índice único compuesto multikey sobre (room, night). Garantiza como máximo
 * UNA reserva activa (no vaciada) por habitación y noche.
 */
bookingSchema.index({ room: 1, nights: 1 }, { unique: true, name: 'occupancy_per_night' });

export default mongoose.model('Booking', bookingSchema);