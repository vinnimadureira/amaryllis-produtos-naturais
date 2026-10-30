import { cn } from "@/lib/utils";
import { Users, Building2, Send, CalendarDays, LayoutDashboard, ShoppingCart } from "lucide-react";

const adminItems = [
  { id: "dashboard", label: "Início", icon: LayoutDashboard, tab: "dashboard" },
  { id: "clientes", label: "Clientes", icon: Users, tab: "clientes" },
  { id: "agenda", label: "Agenda", icon: CalendarDays, tab: "agenda" },
  { id: "marketing", label: "Marketing", icon: Send, tab: "marketing" },
  { id: "configuracoes", label: "Config", icon: Building2, tab: "produtos" },
];

const userItems = [
  { id: "clientes", label: "Clientes", icon: Users, tab: "clientes" },
  { id: "agenda", label: "Agenda", icon: CalendarDays, tab: "agenda" },
  { id: "marketing", label: "Marketing", icon: Send, tab: "marketing" },
  { id: "compras", label: "Compras", icon: ShoppingCart, tab: "compras" },
];

interface AdminMobileNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isAdmin?: boolean;
}

const AdminMobileNav = ({ activeTab, onTabChange, isAdmin = true }: AdminMobileNavProps) => {
  const items = isAdmin ? adminItems : userItems;
  const configTabs = ["negocio", "equipe", "produtos", "categorias", "depoimentos", "campanhas", "paginas", "logs"];

  const getActiveGroup = () => {
    if (activeTab === "dashboard") return "dashboard";
    if (activeTab === "clientes") return "clientes";
    if (activeTab === "agenda") return "agenda";
    if (activeTab === "marketing") return "marketing";
    if (activeTab === "compras") return "compras";
    if (configTabs.includes(activeTab)) return "configuracoes";
    return "";
  };

  const activeGroup = getActiveGroup();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const active = activeGroup === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.tab)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminMobileNav;
