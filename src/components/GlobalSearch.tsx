import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

interface SearchResult {
  id: string;
  name: string;
  category: string;
  price_display: string;
  image_url: string | null;
}

const GlobalSearch = ({ onClose }: { onClose?: () => void }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const { data: results = [] } = useQuery<SearchResult[]>({
    queryKey: ["global-search", normalizedQuery],
    queryFn: async () => {
      if (normalizedQuery.length < 2) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, price_display, image_url")
        .eq("active", true)
        .or(`name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%,category.ilike.%${normalizedQuery}%`)
        .order("featured", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: normalizedQuery.length >= 2,
  });

  const showResults = open && normalizedQuery.length >= 2;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = () => {
    setQuery("");
    setOpen(false);
    onClose?.();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Buscar produtos..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-8 py-2 rounded-full border border-border bg-muted/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          aria-label="Buscar produtos"
          role="combobox"
          aria-expanded={showResults}
          aria-autocomplete="list"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 min-w-[280px]"
            role="listbox"
          >
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado
              </div>
            ) : (
              <ul className="py-1">
                {results.map((product) => (
                  <li key={product.id} role="option">
                    <Link
                      to={`/produto/${product.id}`}
                      onClick={handleSelect}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden shrink-0">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category} · {product.price_display}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to={`/catalogo?q=${encodeURIComponent(query)}`}
              onClick={handleSelect}
              className="block text-center text-xs text-primary font-medium py-2.5 border-t border-border hover:bg-muted/50 transition-colors"
            >
              Ver todos os resultados →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
