import type { ReactNode } from 'react';

type AlertType = 'success' | 'error' | 'info';

type AlertProps = {
  type?: AlertType;
  children?: ReactNode;
};

export default function Alert({ type = 'info', children }: AlertProps) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}