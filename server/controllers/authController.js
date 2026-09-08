import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sanitizeString, isValidEmail, asyncHandler } from '../middlewares/validation.js';

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Verifica las credenciales y responde con un JWT firmado.
 */
export const login = asyncHandler(async (req, res) => {
  const email = sanitizeString(req.body.email, 150).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ message: 'El correo y la contraseña son obligatorios' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/**
 * GET /api/auth/me    (protegido)
 * Devuelve el perfil del administrador autenticado.
 */
export const me = asyncHandler(async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});