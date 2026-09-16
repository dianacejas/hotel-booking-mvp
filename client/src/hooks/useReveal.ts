import { useEffect, useState } from 'react';

/**
 * Hook de aparición al hacer scroll basado en IntersectionObserver nativo.
 * Devuelve una ref para colgar en el elemento raíz de una sección y un
 * booleano que pasa a true cuando el elemento entra en el viewport.
 * Es ligero (sin librerías de animación) y respeta prefers-reduced-motion.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.12): {
  ref: React.RefObject<T | null>;
  visible: boolean;
} {
  const [ref, setRef] = useState<React.RefObject<T | null>>({ current: null });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return { ref, visible };
}