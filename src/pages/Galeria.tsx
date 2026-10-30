import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, Play, MessageCircle, ArrowRight, ChevronDown, Search, ArrowUpDown, Check, Layers, Image as ImageIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MediaLightbox, { MediaItem } from "@/components/MediaLightbox";
import SectionTitle from "@/components/SectionTitle";
import SEO from "@/components/SEO";
import { breadcrumbJsonLd } from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { AMARYLLIS_COMPANY } from "@/lib/amaryllisFallbackData";

import catEssentialAsset from "@/assets/sabores/margherita.jpg.asset.json";
import catGlutenFreeAsset from "@/assets/sabores/pepperoni.jpg.asset.json";
import catCastanhasAsset from "@/assets/sabores/quatro-queijos.jpg.asset.json";
import catFitoterapicosAsset from "@/assets/sabores/calabresa.jpg.asset.json";
import catSemLactoseAsset from "@/assets/sabores/frango-catupiry.jpg.asset.json";
import catOrganicosAsset from "@/assets/sabores/portuguesa.jpg.asset.json";
import catChocolatesAsset from "@/assets/sabores/doce-nutella-morango.jpg.asset.json";
import catMelPropolisAsset from "@/assets/sabores/doce-romeu-julieta.jpg.asset.json";
import produtoSuplementos from "@/assets/produtos/massa-crua-pack.jpg.asset.json";
import produtoGranel from "@/assets/produtos/massa-preassada.jpg.asset.json";
import produtoGlutenFree from "@/assets/produtos/kit-diy.jpg.asset.json";
import produtoFitoterapicos from "@/assets/produtos/insumos-suporte.jpg.asset.json";

const staticImages = [
  { src: catEssentialAsset.url, label: "Linha Essential Nutrition — Parceira Oficial em Campinas", category: "Suplementos" },
  { src: catGlutenFreeAsset.url, label: "Pães e massas Sem Glúten (Gluten Free Friendly)", category: "Sem Glúten & Sem Lactose" },
  { src: catCastanhasAsset.url, label: "Mix de castanhas nobres e oleaginosas a granel", category: "Granel & Orgânicos" },
  { src: catFitoterapicosAsset.url, label: "Chás medicinais e ervas fitoterápicas selecionadas", category: "Fitoterápicos" },
  { src: catSemLactoseAsset.url, label: "Bebidas vegetais e opções zero lactose", category: "Sem Glúten & Sem Lactose" },
  { src: catOrganicosAsset.url, label: "Alimentos orgânicos, integrais e naturais", category: "Granel & Orgânicos" },
  { src: catChocolatesAsset.url, label: "Chocolates funcionais 70% cacau e zero açúcar", category: "Suplementos" },
  { src: catMelPropolisAsset.url, label: "Mel orgânico silvestre e extrato de própolis verde", category: "Fitoterápicos" },
  { src: produtoSuplementos.url, label: "Proteínas isoladas, hidrolisadas e veganas", category: "Suplementos" },
  { src: produtoGranel.url, label: "Grãos, sementes e superfoods frescos", category: "Granel & Orgânicos" },
  { src: produtoGlutenFree.url, label: "Padaria e confeitaria funcional sem glúten", category: "Sem Glúten & Sem Lactose" },
  { src: produtoFitoterapicos.url, label: "Infusões calmantes, digestivas e termogênicas", category: "Fitoterápicos" },
];

const DEFAULT_FILTERS = [
  "Suplementos",
  "Sem Glúten & Sem Lactose",
  "Granel & Orgânicos",
  "Fitoterápicos",
];

const heightClasses = [
  "h-64", "h-80", "h-72", "h-96", "h-64", "h-80", "h-72", "h-64", "h-96", "h-80",
];

const ITEMS_PER_PAGE = 12;

const WHATSAPP = AMARYLLIS_COMPANY.whatsapp;

const CATEGORY_DETAILS: Record<string, { route?: string; routeLabel?: string; ctaContext: string }> = {
  "Suplementos": { route: "/catalogo", routeLabel: "Ver catálogo", ctaContext: "informações sobre suplementos e Essential Nutrition" },
  "Sem Glúten & Sem Lactose": { route: "/catalogo", routeLabel: "Ver catálogo", ctaContext: "opções sem glúten e sem lactose" },
  "Granel & Orgânicos": { route: "/catalogo", routeLabel: "Ver catálogo", ctaContext: "produtos a granel e orgânicos" },
  "Fitoterápicos": { route: "/catalogo", routeLabel: "Ver catálogo", ctaContext: "chás e fitoterápicos" },
};

const buildWaUrl = (label: string, category: string | null) => {
  const ctx = (category && CATEGORY_DETAILS[category]?.ctaContext) || "produtos da Amaryllis Produtos Naturais";
  const msg = `Olá, Amaryllis Produtos Naturais! 🌿\n\nVi nos destaques do site *"${label}"*${category ? ` (${category})` : ""} e gostaria de consultar ${ctx}.\n\nPodem me ajudar?`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
};

const isVideo = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

const isLegacyLabel = (label?: string) => {
  if (!label) return false;
  const lower = label.toLowerCase();
  return lower.includes("cone") || lower.includes("margherita") || lower.includes("pepperoni") || lower.includes("calabresa");
};

const Galeria = () => {
  const { data: dbPhotos = [] } = useQuery({
    queryKey: ["gallery-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .eq("active", true)
        .order("display_order");
      if (error) return [];
      return data || [];
    },
  });

  const validDbPhotos = dbPhotos.filter((p: any) => !isLegacyLabel(p.label));

  const allImages = validDbPhotos.length > 0
    ? validDbPhotos.map((p: any) => ({ src: p.image_url, label: p.label, category: (p.category as string | null) }))
    : staticImages.map((p) => ({ ...p, category: p.category as string | null }));

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [page, setPage] = useState(1);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "az" | "za">("recent");
  const [mediaType, setMediaType] = useState<"all" | "image" | "video">("all");

  const resetPage = () => setPage(1);

  const allCategories = ["Todos", ...DEFAULT_FILTERS];

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allImages.forEach((img) => {
      if (img.category) counts[img.category] = (counts[img.category] || 0) + 1;
    });
    return counts;
  }, [allImages]);

  const suggestedCategories = useMemo(() => {
    const withContent = allCategories
      .filter((c) => c !== "Todos" && (categoryCounts[c] || 0) > 0)
      .sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0))
      .slice(0, 5);

    const result = ["Todos", ...withContent];
    if (activeCategory !== "Todos" && !result.includes(activeCategory)) {
      result.push(activeCategory);
    }
    return result;
  }, [allCategories, categoryCounts, activeCategory]);

  const hiddenCategories = useMemo(
    () => allCategories.filter((c) => !suggestedCategories.includes(c)),
    [allCategories, suggestedCategories],
  );

  const normalizedSearch = search.toLowerCase().trim();

  const filteredImages = useMemo(() => {
    let arr = allImages.filter((img) => {
      const matchesCategory = activeCategory === "Todos" || img.category === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        img.label.toLowerCase().includes(normalizedSearch) ||
        (img.category || "").toLowerCase().includes(normalizedSearch);
      const itemIsVideo = isVideo(img.src);
      const matchesMedia =
        mediaType === "all" ||
        (mediaType === "video" && itemIsVideo) ||
        (mediaType === "image" && !itemIsVideo);
      return matchesCategory && matchesSearch && matchesMedia;
    });
    if (sortOrder === "az") arr = [...arr].sort((a, b) => a.label.localeCompare(b.label));
    else if (sortOrder === "za") arr = [...arr].sort((a, b) => b.label.localeCompare(a.label));
    return arr;
  }, [allImages, activeCategory, normalizedSearch, mediaType, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredImages.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const images = filteredImages.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const openLightbox = (pageIndex: number) => {
    setLightboxIndex((currentPage - 1) * ITEMS_PER_PAGE + pageIndex);
  };

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  }, []);

  const lightboxItems: MediaItem[] = useMemo(
    () =>
      filteredImages.map((img) => ({
        src: img.src,
        alt: img.label,
        label: img.label,
        category: img.category,
      })),
    [filteredImages],
  );

  return (
    <main className="pt-24 pb-10">
      <SEO
        title="Destaques & Linhas — Amaryllis Produtos Naturais em Campinas"
        description="Conheça as linhas da Amaryllis Produtos Naturais no Jardim Guanabara, Campinas: Essential Nutrition, produtos sem glúten, sem lactose, granel, orgânicos e fitoterápicos."
        keywords="destaques amaryllis naturais, fotos produtos naturais campinas, essential nutrition campinas, sem gluten campinas"
        jsonLd={breadcrumbJsonLd([{ name: "Início", url: "/" }, { name: "Destaques" }])}
      />
      <div className="container">
        <Breadcrumbs items={[{ label: "Destaques" }]} />
        <SectionTitle
          title="Destaques & Curadoria Amaryllis"
          subtitle="Conheça de perto nossas linhas de suplementação, sem glúten, sem lactose, fitoterápicos e granel fresco"
        />

        {(() => {
          const hasActiveCategory = activeCategory !== "Todos";
          const hasActiveSearch = !!normalizedSearch;
          const hasActiveMedia = mediaType !== "all";
          const hasActiveSort = sortOrder !== "recent";
          const anyActive = hasActiveCategory || hasActiveSearch || hasActiveMedia || hasActiveSort;

          const sortLabel =
            sortOrder === "az" ? "A → Z" : sortOrder === "za" ? "Z → A" : "Mais recentes";
          const mediaLabel =
            mediaType === "image" ? "Fotos" : mediaType === "video" ? "Vídeos" : "Tudo";

          const clearAll = () => {
            setActiveCategory("Todos");
            setSearch("");
            setSortOrder("recent");
            setMediaType("all");
            setShowAllFilters(false);
            resetPage();
          };

          return (
            <div className="max-w-5xl mx-auto mb-8">
              <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-3 sm:p-4 shadow-soft">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por linha ou produto..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                    {search && (
                      <button
                        onClick={() => { setSearch(""); resetPage(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Limpar busca"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                            hasActiveMedia
                              ? "bg-primary/10 border-primary/40 text-primary"
                              : "bg-background border-border text-foreground hover:border-primary/40"
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{mediaLabel}</span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-48 p-1.5">
                        {([
                          { value: "all" as const, label: "Tudo", icon: Layers },
                          { value: "image" as const, label: "Fotos", icon: ImageIcon },
                          { value: "video" as const, label: "Vídeos", icon: Play },
                        ]).map((opt) => {
                          const isActive = mediaType === opt.value;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => { setMediaType(opt.value); resetPage(); }}
                              className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                                isActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-foreground hover:bg-muted/60"
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5" />
                                {opt.label}
                              </span>
                              {isActive && <Check className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>

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
                          { value: "recent" as const, label: "Mais recentes" },
                          { value: "az" as const, label: "A → Z" },
                          { value: "za" as const, label: "Z → A" },
                        ]).map((opt) => {
                          const isActive = sortOrder === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => { setSortOrder(opt.value); resetPage(); }}
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
                  </div>
                </div>

                {/* Linha de categorias */}
                {allCategories.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mr-1.5">
                        Linha
                      </span>
                      {suggestedCategories.map((cat) => {
                        const count = cat === "Todos" ? allImages.length : (categoryCounts[cat] || 0);
                        const isActive = activeCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => { setActiveCategory(cat); resetPage(); }}
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
                          onClick={() => setShowAllFilters((v) => !v)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                          aria-expanded={showAllFilters}
                        >
                          <span>{showAllFilters ? "Menos" : `+${hiddenCategories.length} mais`}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${showAllFilters ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de filtros ativos */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
                <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                  {anyActive ? (
                    <>
                      {hasActiveCategory && (
                        <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                          {activeCategory}
                          <button
                            onClick={() => { setActiveCategory("Todos"); resetPage(); }}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                            aria-label="Remover filtro de categoria"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={clearAll}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Limpar tudo
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Nenhum filtro ativo</span>
                  )}
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {filteredImages.length} {filteredImages.length === 1 ? "item" : "itens"}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Masonry Grid */}
        {filteredImages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Nenhum item encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {images.map((img, i) => {
              const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + i;
              const itemIsVideo = isVideo(img.src);
              return (
                <motion.div
                  key={`${currentPage}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (i % 4) * 0.08 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer border border-border/60 shadow-soft"
                  onClick={() => openLightbox(i)}
                >
                  {itemIsVideo ? (
                    <div className="relative">
                      <video
                        src={img.src}
                        className={`w-full object-cover ${heightClasses[i % heightClasses.length]}`}
                        muted
                        loop
                        playsInline
                        onLoadedData={() => handleImageLoad(globalIdx)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-5 h-5 text-foreground fill-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!loadedImages.has(globalIdx) && (
                        <div className={`w-full ${heightClasses[i % heightClasses.length]} shimmer-block rounded-2xl`} />
                      )}
                      <img
                        src={img.src}
                        alt={img.label}
                        className={`w-full object-cover transition-transform duration-500 ${
                          loadedImages.has(globalIdx) ? "opacity-100 group-hover:scale-110" : "opacity-0 absolute inset-0"
                        }`}
                        loading="lazy"
                        onLoad={() => handleImageLoad(globalIdx)}
                      />
                    </>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 pt-14 pb-3 px-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent">
                    <div className="flex items-end gap-2">
                      <span className="inline-block w-1 h-5 rounded-full bg-primary shrink-0" />
                      <span className="font-serif text-white text-base md:text-lg leading-tight tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] line-clamp-2">
                        {img.label}
                      </span>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute top-3 right-3 w-9 h-9 rounded-full bg-background/70 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4 text-foreground" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <MediaLightbox
        items={lightboxItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(i) => setLightboxIndex(i)}
        renderFooter={(item, i, total) => {
          const details = item.category ? CATEGORY_DETAILS[item.category] : undefined;
          const waUrl = buildWaUrl(item.label || "", item.category ?? null);
          return (
            <>
              <div className="max-w-md mx-auto mb-4">
                <div
                  className="relative h-1 rounded-full bg-white/15 overflow-hidden cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    const target = Math.min(total - 1, Math.max(0, Math.floor(pct * total)));
                    setLightboxIndex(target);
                  }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
                    animate={{ width: `${((i + 1) / total) * 100}%` }}
                    transition={{ type: "spring", damping: 30, stiffness: 200 }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-[11px] font-mono text-white/60 tabular-nums">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span className="tracking-widest">{total} DESTAQUES</span>
                  <span>{String(total).padStart(2, "0")}</span>
                </div>
              </div>

              <div className="text-center mb-4">
                {item.category && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1 rounded-full bg-primary text-white shadow-lg mb-2">
                    <span className="w-1 h-1 rounded-full bg-white" />
                    {item.category}
                  </span>
                )}
                <h3 className="font-serif text-white text-xl md:text-2xl leading-tight tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {item.label}
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white text-sm font-semibold shadow-lg transition-all hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar no WhatsApp
                </a>
                {details?.route && (
                  <Link
                    to={details.route}
                    onClick={() => setLightboxIndex(null)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30 transition-all"
                  >
                    {details.routeLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </>
          );
        }}
      />
    </main>
  );
};

export default Galeria;
