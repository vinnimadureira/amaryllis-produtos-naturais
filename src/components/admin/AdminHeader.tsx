import { Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { navGroups } from "./AdminSidebar";

interface AdminHeaderProps {
  activeTab: string;
  onMobileMenuToggle?: () => void;
}

const tabMeta: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral do negócio" },
  clientes: { title: "Clientes", subtitle: "Gerenciamento de clientes" },
  negocio: { title: "Negócio", subtitle: "Dados e configurações do site" },
  equipe: { title: "Equipe", subtitle: "Gerenciamento de usuários e permissões" },
  produtos: { title: "Produtos", subtitle: "Catálogo de produtos" },
  categorias: { title: "Categorias", subtitle: "Organização do catálogo" },
  depoimentos: { title: "Depoimentos", subtitle: "Avaliações dos clientes" },
  campanhas: { title: "Campanhas", subtitle: "Banners e promoções" },
  
  paginas: { title: "Páginas & Conteúdo", subtitle: "Edite textos, títulos e botões do site" },
  logs: { title: "Logs", subtitle: "Registro de atividades" },
  marketing: { title: "Marketing", subtitle: "Mensagens e campanhas via WhatsApp" },
  agenda: { title: "Agenda", subtitle: "Entregas, lembretes e produção" },
  relatorios: { title: "Relatórios", subtitle: "Análise de desempenho e métricas do negócio" },
  compras: { title: "Lista de Compras", subtitle: "Itens para comprar e gerenciar" },
  pedidos: { title: "Pedidos", subtitle: "Pedidos recebidos e pagamentos" },
};

const AdminHeader = ({ activeTab, onMobileMenuToggle }: AdminHeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const meta = tabMeta[activeTab] || { title: "Painel", subtitle: "" };

  return (
    <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-serif text-lg font-bold text-foreground leading-tight">{meta.title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{meta.subtitle}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>
    </header>
  );
};

export default AdminHeader;
