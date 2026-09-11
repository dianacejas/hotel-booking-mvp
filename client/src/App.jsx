import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import RoomDetail from './pages/RoomDetail';
import Checkout from './pages/Checkout';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingLookup from './pages/BookingLookup';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Footer from './components/Footer';

/**
 * Client routing.
 * Public pages carry the guest flow; everything under /admin is guarded by
 * ProtectedRoute (real enforcement happens on the server via JWT).
 */
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<BookingConfirmation />} />
          <Route path="/lookup" element={<BookingLookup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <FloatingWhatsApp />
      <Footer />
    </BrowserRouter>
  );
}