import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowUpDown, Heart, Leaf, ChevronDown, SlidersHorizontal, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

import { useQuery } from "@tanstack/react-query";
import SectionTitle from "@/components/SectionTitle";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

import SEO from "@/components/SEO";
import { localBusinessJsonLd, breadcrumbJsonLd } from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";
import { AMARYLLIS_CATEGORIES, AMARYLLIS_PRODUCTS } from "@/lib/amaryllisFallbackData";

const ITEMS_PER_PAGE = 12;

const DEFAULT_INGREDIENTS = [
  "Essential",
  "Sem Glúten",
  "Sem Lactose",
  "Zero Açúcar",
  "Orgânico",
  "Granel",
  "Fitoterápico",
];

const isLegacyProduct = (name?: string) => {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.includes("cone") || lower.includes("pizza");
};

const isLegacyCategory = (name?: string) => {
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.includes("cone") || lower.includes("massa") || lower.includes("combo");
};

const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialIngredient = searchParams.get("ingrediente") || searchParams.get("material") || "Todos";
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeIngredient, setActiveIngredient] = useState<string>(initialIngredient);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [page, setPage] = useState(1);
  const { toggle, isFavorite, count: wishlistCount } = useWishlist();

  useEffect(() => {
    const fromUrl = searchParams.get("ingrediente") || searchParams.get("material") || "Todos";
    if (fromUrl !== activeIngredient) setActiveIngredient(fromUrl);
    const qParam = searchParams.get("q");
    if (qParam !== null && qParam !== search) setSearch(qParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateIngredient = (ing: string) => {
    setActiveIngredient(ing);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    next.delete("material");
    if (ing === "Todos") next.delete("ingrediente");
    else next.set("ingrediente", ing);
    setSearchParams(next, { replace: true });
  };

  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) return AMARYLLIS_PRODUCTS;
      return data || [];
    },
  });

  const products = useMemo(() => {
    if (rawProducts.length === 0 || rawProducts.some((p: any) => isLegacyProduct(p.name))) {
      return AMARYLLIS_PRODUCTS;
    }
    return rawProducts;
  }, [rawProducts]);

  const { data: rawCategories = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("name")
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (error) return AMARYLLIS_CATEGORIES.map((c) => c.name);
      return (data || []).map((c: any) => c.name);
    },
  });

  const dbCategories = useMemo(() => {
    if (rawCategories.length === 0 || rawCategories.some((c: string) => isLegacyCategory(c))) {
      return AMARYLLIS_CATEGORIES.map((c) => c.name);
    }
    return rawCategories;
  }, [rawCategories]);

  const productIds = products.map((p: any) => p.id);
  const { data: allProductImages = [] } = useQuery({
    queryKey: ["all-product-images", productIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .in("product_id", productIds)
        .order("display_order", { ascending: true });
      if (error) return [];
      return data || [];
    },
    enabled: productIds.length > 0,
  });

  const imagesByProduct = allProductImages.reduce<Record<string, string[]>>((acc: Record<string, string[]>, img: any) => {
    if (!acc[img.product_id]) acc[img.product_id] = [];
    acc[img.product_id].push(img.image_url);
    return acc;
  }, {});

  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 200 };
    const prices = products.map((p: any) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const [priceFilter, setPriceFilter] = useState<[number, number] | null>(null);
  const activePriceFilter = priceFilter ?? [priceRange.min, priceRange.max];

  useMemo(() => {
    if (priceFilter && products.length > 0) return;
    setPriceFilter(null);
  }, [priceRange.min, priceRange.max]);

  const categories = ["Todos", ...dbCategories];

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p: any) => {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const suggestedCategories = useMemo(() => {
    const withContent = categories
      .filter((c) => c !== "Todos" && (categoryCounts[c] || 0) > 0)
      .sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0))
      .slice(0, 6);
    const result = ["Todos", ...withContent];
    if (activeCategory !== "Todos" && !result.includes(activeCategory)) {
      result.push(activeCategory);
    }
    return result;
  }, [categories, categoryCounts, activeCategory]);

  const hiddenCategories = useMemo(
    () => categories.filter((c) => !suggestedCategories.includes(c)),
    [categories, suggestedCategories]
  );

  const ingredientOptions = useMemo(() => ["Todos", ...DEFAULT_INGREDIENTS], []);

  const normalizedSearch = search.toLowerCase().trim();

  const filtered = products
    .filter((p: any) => {
      const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
      const hay = `${p.name || ""} ${p.description || ""} ${p.material || ""} ${p.category || ""}`.toLowerCase();
      const matchesIngredient =
        activeIngredient === "Todos" || hay.includes(activeIngredient.toLowerCase());
      const matchesSearch =
        !normalizedSearch ||
        p.name.toLowerCase().includes(normalizedSearch) ||
        (p.description || "").toLowerCase().includes(normalizedSearch) ||
        (p.category || "").toLowerCase().includes(normalizedSearch);
      const matchesPrice = p.price >= activePriceFilter[0] && p.price <= activePriceFilter[1];
      const matchesFavorite = !showFavoritesOnly || isFavorite(p.id);
      return matchesCategory && matchesIngredient && matchesSearch && matchesPrice && matchesFavorite;
    })
    .sort((a: any, b: any) => {
      if (sortOrder === "asc") return a.price - b.price;
      if (sortOrder === "desc") return b.price - a.price;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetPage = () => setPage(1);

  return (
    <main className="pt-24 pb-10">
      <SEO
        title="Catálogo de Produtos Naturais, Suplementos e Sem Glúten"
        description="Explore o catálogo da Amaryllis Produtos Naturais em Campinas: Essential Nutrition, suplementos, produtos sem glúten, sem lactose, granel, chás fitoterápicos, orgânicos e dietéticos."
        keywords="catalogo amaryllis naturais, essential nutrition campinas, sem gluten campinas, sem lactose campinas, fitoterapicos campinas, castanhas granel campinas"
        jsonLd={[
          localBusinessJsonLd,
          breadcrumbJsonLd([{ name: "Início", url: "/" }, { name: "Catálogo" }]),
        ]}
      />
      <div className="container">
        <Breadcrumbs items={[{ label: "Catálogo" }]} />
        <SectionTitle
          title="Nosso Catálogo Saudável"
          subtitle="Suplementos Essential Nutrition, itens sem glúten, sem lactose, orgânicos, fitoterápicos e a granel"
        />

        {(() => {
          const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
          const hasActiveCategory = activeCategory !== "Todos";
          const hasActiveIngredient = activeIngredient !== "Todos";
          const hasActivePrice =
            priceFilter !== null &&
            (activePriceFilter[0] !== priceRange.min || activePriceFilter[1] !== priceRange.max);
          const hasActiveSearch = !!normalizedSearch;
          const hasActiveSort = sortOrder !== "none";
          const activeFilterCount =
            (hasActiveCategory ? 1 : 0) +
            (hasActiveIngredient ? 1 : 0) +
            (hasActivePrice ? 1 : 0) +
            (showFavoritesOnly ? 1 : 0);
          const anyActive = activeFilterCount > 0 || hasActiveSearch || hasActiveSort;

          const clearAll = () => {
            setActiveCategory("Todos");
            updateIngredient("Todos");
            setPriceFilter(null);
            setShowFavoritesOnly(false);
            setSearch("");
            setSortOrder("none");
            setShowAllCategories(false);
            resetPage();
          };

          const sortLabel =
            sortOrder === "asc" ? "Menor preço" : sortOrder === "desc" ? "Maior preço" : "Relevância";

          return (
            <div className="max-w-5xl mx-auto mb-8">
              <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-3 sm:p-4 shadow-soft">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por suplemento, sem glúten, castanha, chá..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        resetPage();
                      }}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                    {search && (
                      <button
                        onClick={() => {
                          setSearch("");
                          resetPage();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Limpar busca"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Ações: Selo/Dieta + Preço + Sort + Favoritos */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                            hasActiveIngredient
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-background border-border text-foreground hover:border-primary/40"
                          }`}
                        >
                          <Leaf className="w-3.5 h-3.5" />
                          <span>Selo / Dieta</span>
                          {hasActiveIngredient && (
                            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-primary/20">
                              {activeIngredient}
                            </span>
                          )}
                          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72 p-3">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2 px-1">
                          Filtrar por característica nutricional
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {ingredientOptions.map((mat) => {
                            const isActive = activeIngredient === mat;
                            return (
                              <button
                                key={mat}
                                onClick={() => updateIngredient(mat)}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                  isActive
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background border-border hover:border-primary/40 hover:bg-muted/40"
                                }`}
                              >
                                <span className="truncate">{mat}</span>
                                {isActive && <Check className="w-3 h-3 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Preço popover */}
                    {!isLoading && products.length > 0 && priceRange.min !== priceRange.max && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                              hasActivePrice
                                ? "bg-primary/10 border-primary/40 text-primary"
                                : "bg-background border-border text-foreground hover:border-primary/40"
                            }`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Preço</span>
                            {hasActivePrice && (
                              <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-md bg-primary/20">
                                {formatBRL(activePriceFilter[0])}–{formatBRL(activePriceFilter[1])}
                              </span>
                            )}
                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                              Faixa de preço
                            </span>
                            {hasActivePrice && (
                              <button
                                onClick={() => {
                                  setPriceFilter(null);
                                  resetPage();
                                }}
                                className="text-[11px] text-primary hover:underline"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm font-medium mb-3 tabular-nums">
                            <span>{formatBRL(activePriceFilter[0])}</span>
                            <span className="text-muted-foreground">—</span>
                            <span>{formatBRL(activePriceFilter[1])}</span>
                          </div>
                          <Slider
                            min={priceRange.min}
                            max={priceRange.max}
                            step={1}
                            value={activePriceFilter}
                            onValueChange={(v) => {
                              setPriceFilter(v as [number, number]);
                              resetPage();
                            }}
                            className="w-full"
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 tabular-nums">
                            <span>{formatBRL(priceRange.min)}</span>
                            <span>{formatBRL(priceRange.max)}</span>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* Sort popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                            hasActiveSort
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-background border-border text-foreground hover:border-primary/40"
                          }`}
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{sortLabel}</span>
                          <span className="sm:hidden">Ordenar</span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-48 p-1.5">
                        {([
                          { value: "none" as const, label: "Relevância" },
                          { value: "asc" as const, label: "Menor preço" },
                          { value: "desc" as const, label: "Maior preço" },
                        ]).map((opt) => {
                          const isActive = sortOrder === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => {
                                setSortOrder(opt.value);
                                resetPage();
                              }}
                              className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                                isActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-foreground hover:bg-muted/60"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isActive && <Check className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>

                    {/* Favoritos toggle */}
                    <button
                      onClick={() => {
                        setShowFavoritesOnly(!showFavoritesOnly);
                        resetPage();
                      }}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                        showFavoritesOnly
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-background border-border text-foreground hover:border-primary/40"
                      }`}
                      aria-pressed={showFavoritesOnly}
                    >
                      <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? "fill-current" : ""}`} />
                      <span className="hidden sm:inline">Favoritos</span>
                      {wishlistCount > 0 && (
                        <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded-md bg-primary/20">
                          {wishlistCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Linha de categorias */}
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mr-1.5">
                      Categoria
                    </span>
                    {suggestedCategories.map((cat) => {
                      const count = cat === "Todos" ? products.length : categoryCounts[cat] || 0;
                      const isActive = activeCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setActiveCategory(cat);
                            resetPage();
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[10px] tabular-nums ${isActive ? "opacity-80" : "opacity-60"}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                    {hiddenCategories.length > 0 && (
                      <button
                        onClick={() => setShowAllCategories((v) => !v)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                        aria-expanded={showAllCategories}
                      >
                        <span>{showAllCategories ? "Menos" : `+${hiddenCategories.length} mais`}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showAllCategories ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {showAllCategories && hiddenCategories.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-1.5 pt-2 mt-2 pl-[72px]">
                          {hiddenCategories.map((cat) => {
                            const count = categoryCounts[cat] || 0;
                            const isEmpty = count === 0;
                            return (
                              <button
                                key={cat}
                                onClick={() => {
                                  setActiveCategory(cat);
                                  resetPage();
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                                  isEmpty
                                    ? "text-muted-foreground/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                }`}
                                disabled={isEmpty}
                              >
                                <span>{cat}</span>
                                <span className="text-[10px] tabular-nums opacity-60">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Barra de filtros ativos + contador de resultados */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
                <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                  {anyActive ? (
                    <>
                      {hasActiveCategory && (
                        <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                          {activeCategory}
                          <button
                            onClick={() => {
                              setActiveCategory("Todos");
                              resetPage();
                            }}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                            aria-label="Remover filtro de categoria"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {hasActiveIngredient && (
                        <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                          {activeIngredient}
                          <button
                            onClick={() => updateIngredient("Todos")}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                            aria-label="Remover filtro de dieta"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {hasActivePrice && (
                        <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20 tabular-nums">
                          {formatBRL(activePriceFilter[0])} – {formatBRL(activePriceFilter[1])}
                          <button
                            onClick={() => {
                              setPriceFilter(null);
                              resetPage();
                            }}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                            aria-label="Remover filtro de preço"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {showFavoritesOnly && (
                        <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                          <Heart className="w-3 h-3 fill-current" />
                          Favoritos
                          <button
                            onClick={() => {
                              setShowFavoritesOnly(false);
                              resetPage();
                            }}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                            aria-label="Remover filtro de favoritos"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={clearAll}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
                      >
                        Limpar tudo
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem filtros aplicados</span>
                  )}
                </div>
                {!isLoading && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    <strong className="text-foreground">{filtered.length}</strong>{" "}
                    {filtered.length === 1 ? "produto" : "produtos"}
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Products grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {showFavoritesOnly
              ? "Você ainda não tem favoritos. Clique no ❤️ nos produtos para salvar!"
              : "Nenhum produto encontrado. Chame nossa equipe no WhatsApp (19) 99351-2766 para consultar o estoque completo da loja!"}
          </p>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product: any) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  image={product.image_url || "/placeholder.svg"}
                  name={product.name}
                  description={product.description || ""}
                  price={product.price_display}
                  priceNum={product.price}
                  category={product.category}
                  images={[product.image_url || "/placeholder.svg", ...(imagesByProduct[product.id] || [])]}
                  isFavorite={isFavorite(product.id)}
                  onToggleFavorite={toggle}
                />
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                      p === currentPage
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Próximo
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Catalogo;
