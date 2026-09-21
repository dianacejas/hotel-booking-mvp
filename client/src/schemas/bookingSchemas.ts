import { z } from 'zod';

/**
 * Esquemas de validación compartidos del cliente (Zod).
 * La misma forma de estos datos es la que espera la API de Express; los
 * nombres de campo en español del formulario se mapean al payload REST en
 * los componentes (p. ej. `nombreCompleto` -> `guest.fullName`).
 */

/** Formas de pago ofrecidas en el checkout. */
export const METODO_PAGO_VALUES = ['tarjeta', 'transferencia', 'checkin', 'mercadopago'] as const;

/** Servicio adicional seleccionado: nombre visible e importe total no negativo. */
export const extraSeleccionadoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del servicio es obligatorio')
    .max(120, 'El nombre del servicio no puede superar los 120 caracteres'),
  price: z
    .number({ error: 'El importe debe ser un número' })
    .nonnegative('El importe no puede ser negativo'),
});

/**
 * Esquema completo del formulario de reserva del checkout.
 * Las fechas se manejan como cadenas YYYY-MM-DD y se comparan de forma
 * calendárica: checkOut debe ser estrictamente posterior a checkIn.
 */
export const bookingFormSchema = z
  .object({
    nombreCompleto: z
      .string()
      .trim()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre no puede superar los 100 caracteres'),
    email: z
      .email('Ingresá un correo electrónico válido')
      .trim()
      .max(150, 'El correo no puede superar los 150 caracteres'),
    telefono: z
      .string()
      .trim()
      .min(6, 'El teléfono debe tener al menos 6 dígitos')
      .max(30, 'El teléfono no puede superar los 30 caracteres')
      .regex(/^[+\d][\d\s().-]{5,}$/, 'Ingresá un número de teléfono válido'),
    checkIn: z.iso.date({ error: 'Ingresá una fecha de entrada válida' }),
    checkOut: z.iso.date({ error: 'Ingresá una fecha de salida válida' }),
    extrasSeleccionados: z.array(extraSeleccionadoSchema),
    metodoPago: z.enum(METODO_PAGO_VALUES, { error: 'Elegí un método de pago válido' }),
  })
  .superRefine((data, ctx) => {
    if (data.checkOut <= data.checkIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['checkOut'],
        message: 'La fecha de salida debe ser posterior a la de entrada',
      });
    }
  });

export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type BookingExtraInput = z.infer<typeof extraSeleccionadoSchema>;
export type MetodoPagoValue = (typeof METODO_PAGO_VALUES)[number];

/**
 * Esquema del formulario de edición de habitación del panel admin.
 * `capacity` y `pricePerNight` llegan como texto desde los inputs y se
 * coercionan a número en Zod; por eso el payload REST se arma a partir
 * de `data` (ya tipado) y no del texto crudo del formulario.
 */
export const roomEditSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre de la habitación es obligatorio')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  number: z.string().trim().max(20, 'El número no puede superar los 20 caracteres').optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'La descripción no puede superar los 1000 caracteres')
    .optional(),
  pricePerNight: z.coerce
    .number({ error: 'La tarifa debe ser un número' })
    .positive('La tarifa por noche debe ser mayor a 0'),
  capacity: z.coerce
    .number({ error: 'La capacidad debe ser un número' })
    .int('La capacidad debe ser un número entero')
    .positive('La capacidad debe ser un número entero positivo'),
  amenities: z
    .array(z.string().trim().min(1).max(50, 'Cada servicio no puede superar los 50 caracteres'))
    .optional(),
  imageUrl: z.string().trim().max(300, 'La URL no puede superar los 300 caracteres').optional(),
  active: z.boolean().optional(),
});

/** Variante parcial para validar campo por campo en el blur de la edición. */
export const roomEditPartialSchema = roomEditSchema.partial();

export type RoomEditData = z.infer<typeof roomEditSchema>;
export type RoomEditPartialData = z.infer<typeof roomEditPartialSchema>;

/** Entrada cruda (texto del formulario) aceptada por roomEditSchema. */
export type RoomEditInput = z.input<typeof roomEditSchema>;