import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './styles.css';
import { applyTheme, getStoredTheme } from './services/theme';

applyTheme(getStoredTheme());

// Cliente de caché de servidor de TanStack Query.
// El estado del servidor (habitaciones, reservas) vive aquí, no en useState.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos: evita refetches redundantes
      refetchOnWindowFocus: false, // no recargar al volver a la pestaña
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);