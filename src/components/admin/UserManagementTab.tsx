import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Loader2, Eye, EyeOff, Shield, UserCheck, Pencil, X, Check, Mail, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ConfirmDialog";

interface UserRecord {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrador", icon: Shield, description: "Acesso total ao sistema" },
  { value: "user", label: "Usuário", icon: UserCheck, description: "Acesso limitado" },
];

function getRoleLabel(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

function getRoleColor(role: string) {
  return role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground";
}

const UserManagementTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session, loading: authLoading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const { data: users = [], isLoading, error, refetch } = useQuery<UserRecord[]>({
    queryKey: ["managed-users", session?.user?.id],
    enabled: !!session?.access_token,
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.users || [];
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleCreate = async () => {
    if (!email.trim() || !password.trim()) {
      toast({ title: "Preencha e-mail e senha", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "create", email: email.trim(), password, role: selectedRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Usuário criado com sucesso!" });
      setEmail(""); setPassword(""); setSelectedRole("user"); setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
    } catch (err: any) {
      toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "update", user_id: editingId, role: editRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Perfil atualizado!" });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (userId: string) => {
    setDeletingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Usuário excluído!" });
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally { setDeletingId(null); }
  };

  const handleResetPassword = async (userId: string) => {
    setResetting(true); setResetId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "reset_password",
          user_id: userId,
          redirect_to: `${window.location.origin}/reset-password`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "E-mail enviado!",
        description: `Link de redefinição enviado para ${data?.email ?? "o usuário"}.`,
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setResetting(false); setResetId(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-base font-semibold text-foreground">Gerenciamento de Usuários</h2>
            <p className="text-xs text-muted-foreground">Crie e gerencie acessos ao sistema</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} size="sm">
          {showForm ? "Cancelar" : <><Plus className="w-4 h-4 mr-1" /> Novo Usuário</>}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Novo Usuário</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Senha</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-2 block">Perfil de Acesso</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((role) => {
                const active = selectedRole === role.value;
                return (
                  <button key={role.value} onClick={() => setSelectedRole(role.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
                    <role.icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{role.label}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Criar Usuário
            </Button>
          </div>
        </div>
      )}

      {/* User List */}
      {isLoading || authLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="text-center py-12 bg-card border border-destructive/40 rounded-lg">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium mb-1">Não foi possível carregar os usuários</p>
          <p className="text-xs text-muted-foreground mb-4">{(error as Error).message}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{user.email?.charAt(0) || "?"}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                    <p className="text-[10px] text-muted-foreground">Criado em {new Date(user.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${getRoleColor(editingId === user.id ? editRole : user.role)}`}>
                    {getRoleLabel(editingId === user.id ? editRole : user.role)}
                  </span>
                  {editingId === user.id ? (
                    <>
                      <button onClick={handleSaveEdit} disabled={saving} className="p-1.5 rounded-lg text-primary hover:bg-primary/10" title="Salvar">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground" title="Cancelar">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleResetPassword(user.id)} disabled={resetting && resetId === user.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" title="Redefinir senha">
                        {resetting && resetId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditingId(user.id); setEditRole(user.role); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDeleteUser(user.id)} disabled={deletingId === user.id}
                        className="p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10" title="Excluir">
                        {deletingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingId === user.id && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <Label className="text-xs mb-2 block">Perfil de Acesso</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_OPTIONS.map((role) => {
                      const active = editRole === role.value;
                      return (
                        <button key={role.value} onClick={() => setEditRole(role.value)}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"}`}>
                          <role.icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{role.label}</p>
                            <p className="text-xs text-muted-foreground">{role.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteUser}
        onOpenChange={(open) => !open && setConfirmDeleteUser(null)}
        title="Excluir usuário?"
        description="O usuário será removido permanentemente. Esta ação não pode ser desfeita."
        onConfirm={() => { if (confirmDeleteUser) handleDelete(confirmDeleteUser); setConfirmDeleteUser(null); }}
      />
    </div>
  );
};

export default UserManagementTab;
