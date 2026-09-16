import type { BookingStatus } from '../types';

const STATUS_META: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: 'Confirmada', className: 'status-confirmed' },
  cancelled: { label: 'Cancelada', className: 'status-cancelled' },
  pending: { label: 'Pendiente', className: 'status-pending' },
};

/** Pequeña píldora de color con el estado de una reserva. */
export default function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as BookingStatus] || { label: status, className: '' };
  return <span className={`status-badge ${meta.className}`}>{meta.label}</span>;
}