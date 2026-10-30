import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { CartProvider } from "@/hooks/useCart";
import PageTransition from "@/components/PageTransition";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SkipToContent from "@/components/SkipToContent";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopOnNav from "@/components/ScrollToTopOnNav";
import CartDrawer from "@/components/CartDrawer";
import AdminGuard from "@/components/AdminGuard";

import ScrollProgress from "@/components/ScrollProgress";

import Index from "./pages/Index";

const Catalogo = lazy(() => import("./pages/Catalogo"));
const Sobre = lazy(() => import("./pages/Sobre"));
const Galeria = lazy(() => import("./pages/Galeria"));
const Contato = lazy(() => import("./pages/Contato"));
const Produto = lazy(() => import("./pages/Produto"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Admin = lazy(() => import("./pages/Admin"));
const FAQ = lazy(() => import("./pages/FAQ"));

const LandingDynamic = lazy(() => import("./pages/LandingDynamic"));
const OrdemServico = lazy(() => import("./pages/OrdemServico"));
const PedidoDetalhe = lazy(() => import("./pages/PedidoDetalhe"));
const PedidoConfirmado = lazy(() => import("./pages/PedidoConfirmado"));
const PedidoCancelado = lazy(() => import("./pages/PedidoCancelado"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  </div>
);

const AppLayout = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isOS = location.pathname.startsWith("/os/");
  const isStandalone = isAdmin || isOS;

  // Garante que o site público nunca tenha SW/manifest do PWA ativo.
  // O PWA é re-habilitado no /admin assim que o usuário autentica.
  useEffect(() => {
    if (!isAdmin) {
      import("@/lib/adminPwa").then(({ ensurePublicHasNoPWA }) => {
        ensurePublicHasNoPWA();
      });
    }
  }, [isAdmin]);

  return (
    <>
      <ScrollToTopOnNav />
      <ScrollProgress />
      {!isStandalone && <SkipToContent />}
      {!isStandalone && <Header />}
      <div id="main-content">
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Index /></PageTransition>} />
              <Route path="/catalogo" element={<PageTransition><Catalogo /></PageTransition>} />
              <Route path="/sobre" element={<PageTransition><Sobre /></PageTransition>} />
              <Route path="/galeria" element={<PageTransition><Galeria /></PageTransition>} />
              <Route path="/contato" element={<PageTransition><Contato /></PageTransition>} />
              <Route path="/produto/:id" element={<PageTransition><Produto /></PageTransition>} />
              <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
              <Route path="/os/:id" element={<OrdemServico />} />
              <Route path="/pedido-confirmado" element={<PageTransition><PedidoConfirmado /></PageTransition>} />
              <Route path="/pedido-cancelado" element={<PageTransition><PedidoCancelado /></PageTransition>} />
              <Route path="/pedido/:id" element={<PageTransition><PedidoDetalhe /></PageTransition>} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />

            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      {!isStandalone && <Footer />}
      {!isStandalone && <WhatsAppButton />}
      {!isStandalone && <CartDrawer />}
      {!isStandalone && <ScrollToTop />}
      
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <CartProvider>
                <AppLayout />
              </CartProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
