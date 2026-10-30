import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setHasRecoverySession(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasRecoverySession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Verifique se digitou a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Senha atualizada!",
      description: "Você já pode entrar com sua nova senha.",
    });
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-card rounded-2xl shadow-soft p-8">
          <div className="text-center mb-8">
            <Heart className="w-8 h-8 text-primary fill-primary mx-auto mb-3" />
            <h1 className="font-serif text-2xl font-bold text-foreground">Nova senha</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Defina uma nova senha para sua conta
            </p>
          </div>

          {!hasRecoverySession ? (
            <div className="text-center text-sm text-muted-foreground space-y-4">
              <p>
                Link inválido ou expirado. Solicite um novo link de recuperação na página de
                login.
              </p>
              <Button
                onClick={() => navigate("/admin/login")}
                className="w-full bg-primary text-primary-foreground hover:bg-rose-dark"
              >
                Ir para o login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Nova senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="bg-muted pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="bg-muted pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-rose-dark gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {isLoading ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
