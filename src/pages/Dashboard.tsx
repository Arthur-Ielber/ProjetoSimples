import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { localAuth, User } from "@/lib/localAuth";
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
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
        if (isMounted) setCurrentUser(user);
        if (user.role === "admin") {
          if (isMounted) setIsAdmin(true);
          if (isMounted) setIsMainAdmin(localAuth.isMainAdmin());
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
      <header className="bg-card border-b shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-base sm:text-xl md:text-2xl font-serif font-bold text-primary truncate w-full sm:w-auto">
              Painel de Administração
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              {currentUser && (
                <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                  {currentUser.email}
                </span>
              )}
              <Button variant="outline" onClick={handleLogout} size="sm" className="text-xs sm:text-sm shrink-0">
                <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sair</span>
                <span className="sm:hidden">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <Tabs defaultValue="reservas" className="space-y-4 sm:space-y-6">
          <div className="w-full">
            <TabsList className={`w-full !inline-grid !h-auto gap-3 sm:gap-4 p-0 bg-transparent ${
              isMainAdmin 
                ? 'grid-cols-2 sm:grid-cols-4' 
                : 'grid-cols-3'
            }`}>
              <TabsTrigger 
                value="reservas" 
                className="text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-3 min-w-0 w-full rounded-lg border border-border bg-muted/50 hover:bg-muted data-[state=active]:bg-background data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-md transition-all"
              >
                Reservas
              </TabsTrigger>
              <TabsTrigger 
                value="ementa" 
                className="text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-3 min-w-0 w-full rounded-lg border border-border bg-muted/50 hover:bg-muted data-[state=active]:bg-background data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-md transition-all"
              >
                Ementa
              </TabsTrigger>
              <TabsTrigger 
                value="gestao" 
                className="text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-3 min-w-0 w-full rounded-lg border border-border bg-muted/50 hover:bg-muted data-[state=active]:bg-background data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-md transition-all"
              >
                <span className="sm:hidden">Gestão</span>
                <span className="hidden sm:inline">Gestão do Restaurante</span>
              </TabsTrigger>
              {isMainAdmin && (
                <TabsTrigger 
                  value="config" 
                  className="text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-3 min-w-0 w-full rounded-lg border border-border bg-muted/50 hover:bg-muted data-[state=active]:bg-background data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-md transition-all"
                >
                  <span className="sm:hidden">Config</span>
                  <span className="hidden sm:inline">Configurações</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="reservas">
            <ReservasTab />
          </TabsContent>

          <TabsContent value="ementa">
            <EmentaTab />
          </TabsContent>

          <TabsContent value="gestao">
            <GestaoTab />
          </TabsContent>

          {isMainAdmin && (
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
