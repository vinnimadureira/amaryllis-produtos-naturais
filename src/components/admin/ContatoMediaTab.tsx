import { Mail } from "lucide-react";

const ContatoMediaTab = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-base font-semibold text-foreground">Mídias da página Contato</h2>
          <p className="text-xs text-muted-foreground">A página de contato atualmente não usa imagens parametrizáveis</p>
        </div>
      </div>

      <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
        Nenhuma mídia configurável na página de contato no momento.
        <br />
        <span className="text-xs">Quando adicionarmos imagens decorativas, elas aparecerão aqui.</span>
      </div>
    </div>
  );
};

export default ContatoMediaTab;
