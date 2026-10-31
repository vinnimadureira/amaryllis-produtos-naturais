import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Users, Building2, Package, FolderOpen, MessageSquareQuote,
  Megaphone, Camera, Clock, Send, Globe, LogOut, ChevronLeft,
  ChevronDown, ChevronRight, CalendarDays, LayoutDashboard,
  BarChart3, ShoppingCart, Layout, ShoppingBag, Film,
  Home, Pizza, Info, Mail, Images,
} from "lucide-react";
import logoLight from "@/assets/logo-light.png";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavSubGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  subgroups?: NavSubGroup[];
}

const navGroups: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
    items: [{ id: "clientes", label: "Cadastro", icon: Users }],
  },
  {
    id: "agenda",
    label: "Agenda",
    icon: CalendarDays,
    items: [{ id: "agenda", label: "Agenda", icon: CalendarDays }],
  },
  {
    id: "pedidos",
    label: "Pedidos",
    icon: ShoppingBag,
    items: [{ id: "pedidos", label: "Pedidos", icon: ShoppingBag }],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Send,
    items: [{ id: "marketing", label: "WhatsApp", icon: Send }],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    items: [{ id: "relatorios", label: "Relatórios", icon: BarChart3 }],
  },
  {
    id: "compras",
    label: "Lista de Compras",
    icon: ShoppingCart,
    items: [{ id: "compras", label: "Lista de Compras", icon: ShoppingCart }],
  },
];

const settingsGroup: NavGroup = {
  id: "configuracoes",
  label: "Configurações",
  icon: Building2,
  items: [
    { id: "negocio", label: "Dados da Empresa", icon: Building2 },
    { id: "equipe", label: "Usuários", icon: Users },
    { id: "logs", label: "Logs", icon: Clock },
  ],
  subgroups: [
    {
      id: "website-group",
      label: "Website",
      icon: Globe,
      items: [
        { id: "hero-video", label: "Fundo & Vídeo Hero", icon: Film },
        { id: "produtos", label: "Produtos", icon: Package },
        { id: "categorias", label: "Categorias", icon: FolderOpen },
        { id: "depoimentos", label: "Depoimentos", icon: MessageSquareQuote },
        { id: "campanhas", label: "Campanhas", icon: Megaphone },
        
      ],
    },
    {
      id: "midias-group",
      label: "Mídias do Site",
      icon: Images,
      items: [
        { id: "midias-home", label: "Home", icon: Home },
        { id: "midias-sabores", label: "Sabores", icon: Pizza },
        { id: "midias-sobre", label: "Sobre", icon: Info },
        { id: "midias-contato", label: "Contato", icon: Mail },
      ],
    },
  ],
};

const allNavGroups: NavGroup[] = [...navGroups, settingsGroup];

// Tabs allowed for non-admin (role = "user") accounts.
const USER_ALLOWED_TABS = new Set(["clientes", "agenda", "marketing", "compras"]);

const filterGroupsByRole = (groups: NavGroup[], isAdmin: boolean): NavGroup[] => {
  if (isAdmin) return groups;
  const result: NavGroup[] = [];
  for (const g of groups) {
    const items = g.items.filter((i) => USER_ALLOWED_TABS.has(i.id));
    const subgroups = g.subgroups
      ?.map((sg) => ({ ...sg, items: sg.items.filter((i) => USER_ALLOWED_TABS.has(i.id)) }))
      .filter((sg) => sg.items.length > 0);
    if (items.length === 0 && (!subgroups || subgroups.length === 0)) continue;
    result.push({ ...g, items, subgroups });
  }
  return result;
};

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

const AdminSidebar = ({ activeTab, onTabChange, collapsed, onCollapsedChange, onLogout, isAdmin = true, className }: AdminSidebarProps & { className?: string }) => {
  const visibleNavGroups = filterGroupsByRole(navGroups, isAdmin);
  const visibleSettingsGroup = isAdmin ? settingsGroup : null;
  const visibleAllGroups = visibleSettingsGroup ? [...visibleNavGroups, visibleSettingsGroup] : visibleNavGroups;
  // Auto-open the group/subgroup containing the active tab on mount/tab change,
  // but allow the user to explicitly close it afterwards.
  const findActiveGroup = () =>
    visibleAllGroups.find((g) => g.items.some((i) => i.id === activeTab) || g.subgroups?.some((sg) => sg.items.some((i) => i.id === activeTab)))?.id;
  const findActiveSubgroup = () => {
    for (const g of visibleAllGroups) {
      const sg = g.subgroups?.find((s) => s.items.some((i) => i.id === activeTab));
      if (sg) return sg.id;
    }
    return undefined;
  };

  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const id = findActiveGroup();
    return id ? [id] : [];
  });
  const [expandedSubgroups, setExpandedSubgroups] = useState<string[]>(() => {
    const id = findActiveSubgroup();
    return id ? [id] : [];
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleSubgroup = (id: string) => {
    setExpandedSubgroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const isItemInGroup = (group: NavGroup) => {
    if (group.items.some((i) => i.id === activeTab)) return true;
    if (group.subgroups?.some((sg) => sg.items.some((i) => i.id === activeTab))) return true;
    return false;
  };

  const isSubgroupActive = (sg: NavSubGroup) => sg.items.some((i) => i.id === activeTab);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn("fixed left-0 top-0 bottom-0 z-50 bg-card border-r border-border flex flex-col", className)}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-border shrink-0">
        
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-serif font-bold text-foreground text-sm whitespace-nowrap overflow-hidden"
            >
              Amaryllis Naturais
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {visibleNavGroups.map((group) => renderGroup(group))}
        {visibleSettingsGroup && renderGroup(visibleSettingsGroup)}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-1 shrink-0">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          title={collapsed ? "Ver Site" : undefined}
        >
          <Globe className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Ver Site</span>}
        </a>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );

  function renderSubgroup(sg: NavSubGroup) {
    const active = isSubgroupActive(sg);
    const expanded = expandedSubgroups.includes(sg.id);

    return (
      <div key={sg.id}>
        <button
          onClick={() => toggleSubgroup(sg.id)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
            active
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <sg.icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">{sg.label}</span>
          <ChevronDown
            className={cn("w-3.5 h-3.5 transition-transform duration-200", expanded && "rotate-180")}
          />
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-4 pl-3 border-l border-border/50 space-y-0.5 py-1">
                {sg.items.map((item) => {
                  const itemActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                        itemActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  function renderGroup(group: NavGroup, opts: { dropUp?: boolean } = {}) {
    const groupActive = isItemInGroup(group);
    const isExpanded = expandedGroups.includes(group.id);
    const hasSubgroups = !!group.subgroups && group.subgroups.length > 0;
    const singleItem = !hasSubgroups && group.items.length === 1;

    if (singleItem) {
      const item = group.items[0];
      const active = activeTab === item.id;
      return (
        <button
          key={group.id}
          onClick={() => onTabChange(item.id)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            active
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          title={collapsed ? group.label : undefined}
        >
          <group.icon className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{group.label}</span>}
        </button>
      );
    }

    const submenu = (
      <AnimatePresence>
        {isExpanded && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 pl-3 border-l border-border/50 space-y-0.5 py-1">
              {group.subgroups?.map((sg) => renderSubgroup(sg))}
              {group.items.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    const trigger = (
      <button
        onClick={() => !collapsed ? toggleGroup(group.id) : onCollapsedChange(false)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
          groupActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
        title={collapsed ? group.label : undefined}
      >
        <group.icon className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{group.label}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                opts.dropUp
                  ? (isExpanded ? "rotate-180" : "rotate-0")
                  : (isExpanded && "rotate-180")
              )}
            />
          </>
        )}
      </button>
    );

    return (
      <div key={group.id}>
        {opts.dropUp ? (
          <>
            {submenu}
            {trigger}
          </>
        ) : (
          <>
            {trigger}
            {submenu}
          </>
        )}
      </div>
    );
  }
};

export { navGroups };
export type { NavGroup, NavItem };
export default AdminSidebar;
