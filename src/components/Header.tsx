import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, ShoppingBag, Sun, Moon, MapPin } from "lucide-react";
import logoAsset from "@/assets/imperio-cones-logo.png.asset.json";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "@/hooks/useTheme";
import GlobalSearch from "@/components/GlobalSearch";

const navItems = [
  { path: "/", label: "Início" },
  { path: "/catalogo", label: "Catálogo" },
  { path: "/galeria", label: "Destaques" },
  { path: "/sobre", label: "A Loja" },
  { path: "/contato", label: "Contato" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => scrollY.on("change", (v) => setScrolled(v > 20)), [scrollY]);
  const bgOpacity = useTransform(scrollY, [0, 100], [0.85, 0.98]);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-border/80 shadow-soft" : "border-border/40"
      }`}
      style={{
        backdropFilter: scrolled ? "blur(20px) saturate(1.5)" : "blur(12px)",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.5)" : "blur(12px)",
      }}
      role="banner"
    >
      <motion.div className="absolute inset-0 bg-background" style={{ opacity: bgOpacity }} />

      <div className="container relative flex items-center justify-between h-16 md:h-20">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 shrink-0 group"
        >
          <motion.img
            whileHover={{ scale: 1.03 }}
            src={logoAsset.url}
            alt="Amaryllis Produtos Naturais — Campinas"
            className="h-12 md:h-[60px] w-auto object-contain"
            width={280}
            height={90}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navegação principal">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className={`relative text-sm font-medium tracking-wide uppercase transition-colors hover:text-primary ${
                location.pathname === item.path ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {item.label}
              {location.pathname === item.path && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <div className="w-52"><GlobalSearch /></div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Carrinho"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
              >
                {totalItems}
              </motion.span>
            )}
          </button>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-muted-foreground" aria-label="Buscar">
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground"
            aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setCartOpen(true)} className="relative p-2 text-muted-foreground" aria-label="Carrinho">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-foreground" aria-label="Menu">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border overflow-visible">
            <div className="container py-3"><GlobalSearch onClose={() => setSearchOpen(false)} /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card/95 backdrop-blur-xl border-b border-border overflow-hidden" aria-label="Navegação móvel">
            <div className="container py-4 flex flex-col gap-1">
              {navItems.map((item, i) => (
                <motion.div key={item.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link
                    to={item.path}
                    onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`block text-base font-medium py-3 px-3 rounded-md transition-colors ${
                      location.pathname === item.path
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-2 pt-3 border-t border-border/60 px-3 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Rua Camargo Paes, 65 · Jardim Guanabara, Campinas - SP</span>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
