import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Guardia de autenticación JWT para las rutas exclusivas de administración.
 * Espera un token Bearer en la cabecera Authorization:
 *   Authorization: Bearer <token>
 */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado, falta el token' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que la cuenta que posee el token sigue existiendo.
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'No autorizado, token inválido o caducado' });
    }
    return res.status(500).json({ message: 'Error de autenticación' });
  }
}