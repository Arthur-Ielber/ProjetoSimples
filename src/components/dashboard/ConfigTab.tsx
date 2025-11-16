import { useEffect, useState } from "react";
import { localConfig, Config as LocalConfig } from "@/lib/localStorage";
import { localAuth, User } from "@/lib/localAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Power, PowerOff, UtensilsCrossed, Calendar, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Config = LocalConfig;

export const ConfigTab = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [atualizadores, setAtualizadores] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAtualizador, setNewAtualizador] = useState({ email: "", password: "" });
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadAtualizadores();
  }, []);

  const loadAtualizadores = () => {
    if (localAuth.isAdmin()) {
      setAtualizadores(localAuth.getAtualizadores());
    }
  };

  const handleAddAtualizador = () => {
    // Validação de senha
    if (newAtualizador.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAtualizador.email)) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    const result = localAuth.createAtualizador(newAtualizador.email, newAtualizador.password);
    if (result.success) {
      toast.success(result.message);
      setNewAtualizador({ email: "", password: "" });
      setShowAddForm(false);
      loadAtualizadores();
    } else {
      toast.error(result.message);
    }
  };

  const handleToggleAtualizador = (id: string) => {
    const result = localAuth.toggleAtualizador(id);
    if (result.success) {
      toast.success(result.message);
      loadAtualizadores();
    } else {
      toast.error(result.message);
    }
  };

  const handleDeleteAtualizador = () => {
    if (deleteDialog) {
      const result = localAuth.deleteAtualizador(deleteDialog);
      if (result.success) {
        toast.success(result.message);
        loadAtualizadores();
      } else {
        toast.error(result.message);
      }
      setDeleteDialog(null);
    }
  };

  const loadConfig = () => {
    setLoading(true);
    try {
      // localConfig.get() sempre retorna um config (cria padrão se não existir)
      const data = localConfig.get();
      setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
      // Tentar criar config padrão mesmo em caso de erro
      try {
        const defaultConfig = localConfig.get();
        setConfig(defaultConfig);
      } catch (e) {
        console.error('Erro ao criar config padrão:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    const result = localConfig.update({
      telefone: config.telefone,
      email: config.email,
      horario: config.horario,
      historia: config.historia,
      mapa_url: config.mapa_url,
    });

    if (!result.success) {
      toast.error(result.error || "Erro ao atualizar configurações");
    } else {
      toast.success("Configurações atualizadas com sucesso!");
      if (result.data) {
        setConfig(result.data);
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não houver config após o carregamento, mostrar mensagem de erro
  if (!config && !loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>Erro ao carregar configurações. Por favor, recarregue a página.</p>
            <Button onClick={loadConfig} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se ainda estiver carregando ou config for null, mostrar loading
  if (!config) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Informações do Restaurante</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={config.telefone}
              onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="horario">Horário de Funcionamento</Label>
            <Textarea
              id="horario"
              value={config.horario}
              onChange={(e) => setConfig({ ...config, horario: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="historia">História do Restaurante</Label>
            <Textarea
              id="historia"
              value={config.historia}
              onChange={(e) => setConfig({ ...config, historia: e.target.value })}
              rows={5}
              required
            />
          </div>

          <div>
            <Label htmlFor="mapa_url">URL do Google Maps (iframe)</Label>
            <Input
              id="mapa_url"
              type="url"
              value={config.mapa_url || ""}
              onChange={(e) => setConfig({ ...config, mapa_url: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "A guardar..." : "Guardar Alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>

    {localAuth.isAdmin() && (
      <Card className="shadow-soft mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Crie usuários que podem editar a ementa e gerenciar reservas
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-accent/5 rounded-lg border border-accent/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">
                  Permissões dos Usuários Criados:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    Editar ementa (adicionar, editar e remover pratos)
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Gerenciar reservas (aceitar ou recusar)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg space-y-4 bg-card">
              <div>
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newAtualizador.email}
                  onChange={(e) => setNewAtualizador({ ...newAtualizador, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-password">Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newAtualizador.password}
                  onChange={(e) => setNewAtualizador({ ...newAtualizador, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddAtualizador} size="sm" disabled={!newAtualizador.email || !newAtualizador.password || newAtualizador.password.length < 6}>
                  Criar Usuário
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAtualizador({ email: "", password: "" });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {atualizadores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  Nenhum usuário cadastrado
                </p>
                <p className="text-xs text-muted-foreground">
                  Clique em "Novo Usuário" para criar um usuário que pode editar a ementa e gerenciar reservas
                </p>
              </div>
            ) : (
              atualizadores.map((atualizador) => (
                <div
                  key={atualizador.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{atualizador.email}</p>
                      <Badge variant={atualizador.active ? "default" : "secondary"}>
                        {atualizador.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Criado em: {new Date(atualizador.createdAt).toLocaleDateString("pt-PT")}</span>
                      <span className="flex items-center gap-1">
                        <UtensilsCrossed className="h-3 w-3" />
                        Ementa
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Reservas
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAtualizador(atualizador.id)}
                    >
                      {atualizador.active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog(atualizador.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )}

    <AlertDialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar este atualizador? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteAtualizador} className="bg-destructive text-destructive-foreground">
            Deletar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};
