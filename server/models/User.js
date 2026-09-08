import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Modelo User: una única identidad de administrador para los flujos privados.
 * La contraseña se guarda con hash bcrypt; el texto plano nunca se persiste.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Hotel Manager',
    },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [150, 'El correo no puede superar los 150 caracteres'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // nunca expone el hash en las consultas normales
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

/** Calcula el hash de la contraseña antes de guardar si fue modificada. */
userSchema.pre('save', async function preSaveHash(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/** Verifica una contraseña en texto plano contra el hash almacenado. */
userSchema.methods.matchPassword = function matchPassword(plainText) {
  return bcrypt.compare(plainText, this.password);
};

export default mongoose.model('User', userSchema);