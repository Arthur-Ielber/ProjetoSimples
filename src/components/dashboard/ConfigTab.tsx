import { useEffect, useState } from "react";
import { localConfig, Config as LocalConfig } from "@/lib/localStorage";
import { localAuth, User } from "@/lib/localAuth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Power, PowerOff, UtensilsCrossed, Calendar, Info, Upload, X, Image as ImageIcon } from "lucide-react";
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
  
  // Estados para upload de fotos
  const [fotoInicialFile, setFotoInicialFile] = useState<File | null>(null);
  const [fotoInicialPreview, setFotoInicialPreview] = useState<string | null>(null);
  const [fotoHistoriaFile, setFotoHistoriaFile] = useState<File | null>(null);
  const [fotoHistoriaPreview, setFotoHistoriaPreview] = useState<string | null>(null);
  const [fotoInicialOriginal, setFotoInicialOriginal] = useState(false);
  const [fotoHistoriaOriginal, setFotoHistoriaOriginal] = useState(false);

  useEffect(() => {
    loadConfig();
    loadAtualizadores();
  }, []);

  const loadAtualizadores = async () => {
    if (localAuth.isAdmin()) {
      try {
        const usuarios = await api.getUsuarios();
        // Filtrar apenas atualizadores (role = 'atualizador')
        const atualizadoresData = usuarios
          .filter((u: any) => u.role === 'atualizador')
          .map((u: any) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            active: u.active,
            createdAt: u.created_at
          }));
        setAtualizadores(atualizadoresData);
      } catch (error) {
        console.error('Erro ao carregar atualizadores:', error);
        // Fallback para localStorage
        setAtualizadores(localAuth.getAtualizadores());
      }
    }
  };

  const handleAddAtualizador = async () => {
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

    try {
      const result = await api.createUsuario({
        email: newAtualizador.email,
        password: newAtualizador.password,
        role: 'atualizador'
      });
      toast.success(result.message || "Usuário criado com sucesso!");
      setNewAtualizador({ email: "", password: "" });
      setShowAddForm(false);
      loadAtualizadores();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar usuário");
    }
  };

  const handleToggleAtualizador = async (id: string) => {
    try {
      const result = await api.toggleUsuario(id);
      toast.success(result.message || "Usuário atualizado com sucesso!");
      loadAtualizadores();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar usuário");
    }
  };

  const handleDeleteAtualizador = async () => {
    if (deleteDialog) {
      try {
        await api.deleteUsuario(deleteDialog);
        toast.success("Usuário deletado com sucesso!");
        loadAtualizadores();
      } catch (error: any) {
        toast.error(error.message || "Erro ao deletar usuário");
      }
      setDeleteDialog(null);
    }
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await api.getConfiguracoes();
      setConfig({
        id: data.id,
        telefone: data.telefone,
        email: data.email,
        horario: data.horario,
        historia: data.historia,
        mapa_url: data.mapa_url || null,
      });
      
      // Carregar previews das fotos se existirem
      const temFotoInicial = data.tem_foto_inicial === 1;
      const temFotoHistoria = data.tem_foto_historia === 1;
      
      if (temFotoInicial && data.foto_inicial_url) {
        setFotoInicialPreview(`http://localhost:3001${data.foto_inicial_url}`);
      }
      if (temFotoHistoria && data.foto_historia_url) {
        setFotoHistoriaPreview(`http://localhost:3001${data.foto_historia_url}`);
      }
      
      // Guardar estado inicial para detectar remoções
      setFotoInicialOriginal(temFotoInicial);
      setFotoHistoriaOriginal(temFotoHistoria);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
      // Fallback para localStorage
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

  const handleFotoInicialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um ficheiro de imagem válido");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 15MB");
      return;
    }

    setFotoInicialFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoInicialPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFotoHistoriaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um ficheiro de imagem válido");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 15MB");
      return;
    }

    setFotoHistoriaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoHistoriaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFotoInicial = () => {
    setFotoInicialFile(null);
    setFotoInicialPreview(null);
  };

  const handleRemoveFotoHistoria = () => {
    setFotoHistoriaFile(null);
    setFotoHistoriaPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    try {
      // Fazer upload das fotos se houver arquivos novos
      let fotoInicialBlob: string | null | undefined = undefined;
      let fotoHistoriaBlob: string | null | undefined = undefined;

      if (fotoInicialFile) {
        // Nova foto selecionada
        const uploadResult = await api.uploadEmentaImage(fotoInicialFile);
        fotoInicialBlob = uploadResult.blob;
      } else if (fotoInicialPreview === null && fotoInicialOriginal) {
        // Foto foi removida (tinha antes, agora não tem)
        fotoInicialBlob = null;
      }

      if (fotoHistoriaFile) {
        // Nova foto selecionada
        const uploadResult = await api.uploadEmentaImage(fotoHistoriaFile);
        fotoHistoriaBlob = uploadResult.blob;
      } else if (fotoHistoriaPreview === null && fotoHistoriaOriginal) {
        // Foto foi removida (tinha antes, agora não tem)
        fotoHistoriaBlob = null;
      }

      const updateData: any = {
        telefone: config.telefone,
        email: config.email,
        horario: config.horario,
        historia: config.historia,
        mapa_url: config.mapa_url,
      };

      // Incluir fotos apenas se foram modificadas
      if (fotoInicialBlob !== undefined) {
        updateData.foto_inicial = fotoInicialBlob;
      }
      if (fotoHistoriaBlob !== undefined) {
        updateData.foto_historia = fotoHistoriaBlob;
      }

      const result = await api.updateConfiguracoes(updateData);
      toast.success("Configurações atualizadas com sucesso!");
      if (result.data) {
        setConfig({
          id: result.data.id,
          telefone: result.data.telefone,
          email: result.data.email,
          horario: result.data.horario,
          historia: result.data.historia,
          mapa_url: result.data.mapa_url || null,
        });
        
        // Atualizar previews
        if (result.data.foto_inicial_url) {
          setFotoInicialPreview(`http://localhost:3001${result.data.foto_inicial_url}`);
        }
        if (result.data.foto_historia_url) {
          setFotoHistoriaPreview(`http://localhost:3001${result.data.foto_historia_url}`);
        }
        
        // Limpar arquivos temporários
        setFotoInicialFile(null);
        setFotoHistoriaFile(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar configurações");
    } finally {
      setSaving(false);
    }
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

          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label htmlFor="foto_inicial">Foto Inicial do Site</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Imagem que aparece na página inicial (máximo 15MB)
              </p>
              {fotoInicialPreview ? (
                <div className="space-y-2">
                  <div className="relative">
                    <img 
                      src={fotoInicialPreview} 
                      alt="Foto inicial" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveFotoInicial}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    id="foto_inicial"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoInicialUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('foto_inicial')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Trocar Foto
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="foto_inicial"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoInicialUpload}
                    className="hidden"
                  />
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('foto_inicial')?.click()}
                  >
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Clique para selecionar uma imagem
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formatos: JPG, PNG, GIF | Máximo 15MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="foto_historia">Foto da História</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Imagem que aparece na seção "Nossa História" (máximo 15MB)
              </p>
              {fotoHistoriaPreview ? (
                <div className="space-y-2">
                  <div className="relative">
                    <img 
                      src={fotoHistoriaPreview} 
                      alt="Foto história" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveFotoHistoria}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    id="foto_historia"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoHistoriaUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('foto_historia')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Trocar Foto
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="foto_historia"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoHistoriaUpload}
                    className="hidden"
                  />
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('foto_historia')?.click()}
                  >
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Clique para selecionar uma imagem
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formatos: JPG, PNG, GIF | Máximo 15MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A guardar...
              </>
            ) : (
              "Guardar Alterações"
            )}
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
                      <span>Criado em: {new Date(atualizador.createdAt || atualizador.created_at).toLocaleDateString("pt-PT")}</span>
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
