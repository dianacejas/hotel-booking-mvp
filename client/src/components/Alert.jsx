/**
 * Inline alert used across pages.
 * type: 'success' | 'error' | 'info'
 */
export default function Alert({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}