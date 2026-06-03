import { useState, useCallback } from 'react';
import Header from '@/sections/Header';
import Hero from '@/sections/Hero';
import DemoWidget from '@/sections/DemoWidget';
import Features from '@/sections/Features';
import Pricing from '@/sections/Pricing';
import IntegrationCTA from '@/sections/IntegrationCTA';
import Footer from '@/sections/Footer';
import AdminPanel from '@/sections/AdminPanel';
<<<<<<< HEAD
=======
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import WidgetPreview from '@/pages/WidgetPreview';
import EmbedWidget from '@/pages/EmbedWidget';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305

export default function App() {
  const [page, setPage] = useState<'landing' | 'admin'>('landing');

  const scrollToDemo = useCallback(() => {
    const el = document.getElementById('demo');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (page === 'admin') {
    return <AdminPanel onBack={() => setPage('landing')} />;
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-sand-light">
      <Header onNavigate={(target) => target === 'admin' ? setPage('admin') : undefined} />
      <Hero onScrollToDemo={scrollToDemo} />
      <DemoWidget />
      <Features />
      <Pricing />
      <IntegrationCTA />
      <Footer />
    </div>
=======
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preview"
        element={
          <ProtectedRoute>
            <WidgetPreview />
          </ProtectedRoute>
        }
      />
      <Route path="/widget/embed" element={<EmbedWidget />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
  );
}
