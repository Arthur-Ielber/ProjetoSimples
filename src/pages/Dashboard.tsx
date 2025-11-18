import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { localAuth } from "@/lib/localAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { ReservasTab } from "@/components/dashboard/ReservasTab";
import { EmentaTab } from "@/components/dashboard/EmentaTab";
import { ConfigTab } from "@/components/dashboard/ConfigTab";
import { GestaoTab } from "@/components/dashboard/GestaoTab";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAtualizador, setIsAtualizador] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdminStatus = () => {
      if (!localAuth.isAuthenticated()) {
        if (isMounted) {
          toast.error("Acesso negado. Faça login primeiro.");
          navigate("/admin");
        }
        return;
      }

      const user = localAuth.getCurrentUser();
      if (user) {
        if (user.role === "admin") {
          if (isMounted) setIsAdmin(true);
        } else if (user.role === "atualizador") {
          if (isMounted) setIsAtualizador(true);
        } else {
          if (isMounted) {
            toast.error("Acesso negado. Permissões insuficientes.");
            navigate("/admin");
          }
          return;
        }
      } else {
        if (isMounted) {
          toast.error("Acesso negado. Usuário não encontrado.");
          navigate("/admin");
        }
        return;
      }
      if (isMounted) setLoading(false);
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remover navigate das dependências para evitar loop

  const handleLogout = () => {
    localAuth.logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">A verificar permissões...</p>
        </div>
      </div>
    );
  }

  // Permitir acesso tanto para admin quanto para atualizador
  if (!isAdmin && !isAtualizador) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold text-primary">
            Painel de Administração
          </h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="reservas" className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} max-w-4xl`}>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="ementa">Ementa</TabsTrigger>
            <TabsTrigger value="gestao">Gestão do Restaurante</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="config">Configurações</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="reservas">
            <ReservasTab />
          </TabsContent>

          <TabsContent value="ementa">
            <EmentaTab />
          </TabsContent>

          <TabsContent value="gestao">
            <GestaoTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="config">
              <ConfigTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
