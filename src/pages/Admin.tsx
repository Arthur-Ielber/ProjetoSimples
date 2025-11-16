import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { localAuth } from "@/lib/localAuth";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    let isMounted = true;
    
    // Verificar se já está autenticado
    if (localAuth.isAuthenticated()) {
      const user = localAuth.getCurrentUser();
      // Permitir acesso ao dashboard tanto para admin quanto para atualizador
      if (user && (user.role === "admin" || user.role === "atualizador") && isMounted) {
        navigate("/dashboard");
      }
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remover navigate das dependências para evitar loop

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = authSchema.parse(formData);

      // Fazer login
      const result = localAuth.login(validated.email, validated.password);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao processar pedido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader>
          <CardTitle className="text-3xl font-serif text-center text-primary">
            Login Admin
          </CardTitle>
          <div className="mt-4 p-4 bg-muted rounded-lg border border-dashed">
            <p className="text-sm font-semibold text-center mb-2">Credenciais de Acesso:</p>
            <div className="text-xs space-y-1 text-center">
              <p><span className="font-medium">Email:</span> admin@admin.com</p>
              <p><span className="font-medium">Senha:</span> Admin@123!</p>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2 italic">
              (Esta informação será removida em breve)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A processar..." : "Entrar"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Voltar ao Site
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
