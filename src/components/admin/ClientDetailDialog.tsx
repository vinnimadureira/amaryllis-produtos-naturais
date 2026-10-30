import { Edit2, User, Calendar, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ClientReadFields from "@/components/admin/ClientReadFields";
import ClientHistoryPanel from "@/components/admin/ClientHistoryPanel";

export interface ClientDetailData {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  birthday?: string | null;
  notes?: string | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  complement?: string | null;
  city?: string | null;
  state?: string | null;
  cep?: string | null;
  created_at?: string | null;
}

interface Props {
  client: ClientDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isVip?: boolean;
  onEdit?: (client: ClientDetailData) => void;
}

/**
 * Painel único de detalhe do cliente (Dados cadastrais · Histórico).
 * Compartilhado entre Clientes, Relatórios e qualquer outro local que
 * precise mostrar os mesmos dados — garante visual idêntico em todo lugar.
 */
const ClientDetailDialog = ({ client, open, onOpenChange, isVip, onEdit }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {client && (
          <>
            <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pt-6 pb-5 border-b border-border">
              <DialogHeader className="space-y-3">
                <DialogTitle className="sr-only">Detalhes do Cliente</DialogTitle>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-xl text-foreground truncate">{client.name}</h3>
                      {isVip && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm flex items-center gap-1"
                          title="Cliente VIP — 3+ compras ou ticket total acima de R$ 300"
                        >
                          <Star className="w-2.5 h-2.5 fill-white" /> VIP
                        </span>
                      )}
                    </div>
                    {client.created_at && (
                      <p className="text-xs text-muted-foreground">
                        Cliente desde {new Date(client.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  {onEdit && (
                    <Button
                      size="sm"
                      onClick={() => onEdit(client)}
                      className="gap-1.5 shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </Button>
                  )}
                </div>
              </DialogHeader>
            </div>

            <Tabs defaultValue="dados" className="px-6 pb-6">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="dados" className="gap-1.5">
                  <User className="w-3.5 h-3.5" /> Dados cadastrais
                </TabsTrigger>
                <TabsTrigger value="historico" className="gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="mt-4">
                <ClientReadFields
                  showNotes
                  data={{
                    name: client.name,
                    phone: client.phone,
                    email: client.email,
                    birthday: client.birthday,
                    notes: client.notes,
                    address: {
                      street: client.street,
                      number: client.number,
                      neighborhood: client.neighborhood,
                      complement: client.complement,
                      city: client.city,
                      state: client.state,
                      cep: client.cep,
                    },
                  }}
                />
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <ClientHistoryPanel clientId={client.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailDialog;
