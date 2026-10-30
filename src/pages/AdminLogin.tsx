import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react";
import logoAsset from "@/assets/imperio-cones-logo.png.asset.json";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro ao entrar",
        description: "Email ou senha incorretos.",
        variant: "destructive",
      });
    } else {
      navigate("/admin");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);

    if (error) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
      });
      setResetOpen(false);
      setResetEmail("");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-card rounded-2xl shadow-soft p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center group">
              <img
                src={logoAsset.url}
                alt="Amaryllis Produtos Naturais"
                className="h-20 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                autoComplete="new-password"
                required
                className="bg-muted"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  autoComplete="new-password"
                  required
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
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-rose-dark gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="w-full text-xs text-primary hover:underline mt-1"
            >
              Esqueci minha senha
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao site
            </Link>
          </div>
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Recuperar senha
            </DialogTitle>
            <DialogDescription>
              Digite seu email cadastrado e enviaremos um link para você redefinir sua senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetOpen(false)}
                disabled={resetLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={resetLoading}
                className="bg-primary text-primary-foreground hover:bg-rose-dark"
              >
                {resetLoading ? "Enviando..." : "Enviar link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default AdminLogin;
