import { useState } from 'react';
import AdminBookings from '../components/AdminBookings';
import RoomsManager from '../components/RoomsManager';

/**
 * Panel de administración (protegido por ProtectedRoute en el cliente y por
 * el middleware JWT en el servidor).
 *
 * Dos vistas con pestañas:
 *  - "Habitaciones": inventario, edición de tarifas y datos, alta de nuevas
 *    habitaciones e integraciones de calendario (iCal) por habitación.
 *  - "Reservas": tabla de reservas realizadas con búsqueda, filtro y
 *    acciones rápidas (confirmar / reactivar / cancelar).
 */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'bookings'>('rooms');

  return (
    <div className="page">
      <h1>Panel de administración</h1>
      <p className="muted">
        Gestiona el inventario de habitaciones, sus calendarios y las reservas recibidas.
      </p>

      <div className="admin-tabs" role="tablist" aria-label="Secciones del panel">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rooms'}
          className={`admin-tab${activeTab === 'rooms' ? ' admin-tab-active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Habitaciones
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'bookings'}
          className={`admin-tab${activeTab === 'bookings' ? ' admin-tab-active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Reservas realizadas
        </button>
      </div>

      {activeTab === 'rooms' ? <RoomsManager /> : <AdminBookings />}
    </div>
  );
}