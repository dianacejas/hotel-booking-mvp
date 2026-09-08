const STATUS_META = {
  confirmed: { label: 'Confirmada', className: 'status-confirmed' },
  cancelled: { label: 'Cancelada', className: 'status-cancelled' },
  pending: { label: 'Pendiente', className: 'status-pending' },
};

/** Pequeña píldora de color con el estado de una reserva. */
export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, className: '' };
  return <span className={`status-badge ${meta.className}`}>{meta.label}</span>;
}