import { Link, NavLink, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../services/theme';

/**
 * Barra de navegación superior. Muestra los enlaces públicos para el huésped
 * y una zona de administración que pasa a "Panel / Cerrar sesión" cuando
 * existe un token de administrador.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('hb_token');
  const [theme, toggleTheme] = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('hb_token');
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" aria-label="Boutique Carajito — Inicio">
          <img src="/carajitologo.png" alt="" className="brand-logo" />
          <span className="brand-name">Boutique Carajito</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>
            Habitaciones
          </NavLink>
          <NavLink to="/lookup">Mi reserva</NavLink>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          {token ? (
            <>
              <NavLink to="/admin">Panel</NavLink>
              <button type="button" className="btn btn-nav-ghost btn-sm" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <NavLink to="/admin/login" className="btn btn-nav-admin btn-sm">
              Iniciar sesión / Admin
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}