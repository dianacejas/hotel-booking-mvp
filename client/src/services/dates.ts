/**
 * Utilidades de fechas y precios basadas en la API nativa de Date.
 * Todo se basa en la hora local y compara fechas de calendario YYYY-MM-DD
 * sin matemáticas de zonas horarias, lo que mantiene la lógica predecible
 * para un MVP local.
 */

/** Formatea una Date como YYYY-MM-DD (local). */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Convierte YYYY-MM-DD en una Date a medianoche local; null si es inválida. */
export function parseDateInput(value: string | null): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.getFullYear() === Number(y) &&
    date.getMonth() === Number(m) - 1 &&
    date.getDate() === Number(d)
    ? date
    : null;
}

/** Medianoche local de "hoy" (se usa para deshabilitar entradas pasadas). */
export function todayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Número de noches entre dos fechas (días completos). */
export function nightsBetween(checkIn: Date | string, checkOut: Date | string): number {
  const ms = 1000 * 60 * 60 * 24;
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / ms);
}

/** Etiqueta tipo "mar, 05 sep 2026" usada en tarjetas y confirmaciones. */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Precio en dólares con formato de número español, p. ej. 89,00 US$. */
export function formatPrice(n: number | undefined | null): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n ?? 0);
}