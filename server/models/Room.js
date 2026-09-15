import mongoose from 'mongoose';

/**
 * Modelo Room: representa una habitación/unidad reservable del alojamiento.
 * Campos mínimos para un MVP: identidad, capacidad, precio, servicios,
 * imagen y un flag "activo" que se alterna desde el panel de gestión.
 */
const roomSchema = new mongoose.Schema(
  {
    // Número/identificador físico de la habitación, p. ej. "101" u "8-B".
    // Opcional: las habitaciones antiguas pueden no tenerlo.
    number: {
      type: String,
      trim: true,
      maxlength: [20, 'El número de la habitación no puede superar los 20 caracteres'],
      default: '',
    },
    name: {
      type: String,
      required: [true, 'El nombre de la habitación es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre de la habitación no puede superar los 100 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La descripción no puede superar los 1000 caracteres'],
      default: '',
    },
    capacity: {
      type: Number,
      required: [true, 'La capacidad es obligatoria'],
      min: [1, 'La capacidad debe ser al menos 1'],
      max: [20, 'La capacidad no puede superar las 20 personas'],
    },
    pricePerNight: {
      type: Number,
      required: [true, 'La tarifa por noche es obligatoria'],
      min: [0, 'El precio no puede ser negativo'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // añade createdAt / updatedAt automáticamente
  }
);

export default mongoose.model('Room', roomSchema);