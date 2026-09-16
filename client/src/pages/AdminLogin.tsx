import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';

/**
 * Página de inicio de sesión del administrador. Guarda el JWT en
 * localStorage para que el panel pueda enviarlo como token Bearer en cada
 * petición protegida.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state?.from as string | undefined) || '/admin';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email.trim(), password);
      localStorage.setItem('hb_token', data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="auth-card card card-pad">
        <h1>Inicia sesión</h1>
        <p className="muted">Zona restringida: solo personal del alojamiento.</p>

        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="adminEmail">
            Correo electrónico
          </label>
          <input
            id="adminEmail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@hotel.local"
            required
          />
          <label className="field-label" htmlFor="adminPassword">
            Contraseña
          </label>
          <input
            id="adminPassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}