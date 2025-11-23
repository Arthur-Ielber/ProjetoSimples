import { useEffect, useState } from "react";
import { MenuItem as LocalMenuItem, MenuSection } from "@/lib/localStorage";
import { localAuth } from "@/lib/localAuth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Power, PowerOff, Upload, X, Image as ImageIcon, FolderPlus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type MenuItem = LocalMenuItem;

export const EmentaTab = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null);
  const [sectionFormData, setSectionFormData] = useState({ nome: "" });
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    secao: "",
    destaque: false,
    imagem_url: "",
  });
  const [imageSource, setImageSource] = useState<"url" | "upload">("url");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Carregar seções primeiro, depois os itens
    loadSections();
    loadItems();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(() => {
      loadSections();
      loadItems();
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      // Carregar dados apenas do banco de dados (API)
      const apiData = await api.getEmenta();
      
      // Processar dados da API
      const processedItems = apiData.map((item: any) => ({
        ...item,
        preco: typeof item.preco === 'string' ? parseFloat(item.preco) : item.preco,
      }));
      
      // Ordenar por ordem da seção e depois por nome
      const sectionsMap = new Map(sections.map(s => [s.nome, s.ordem || 0]));
      const sorted = [...processedItems].sort((a, b) => {
        const ordemA = sectionsMap.get(a.secao) ?? 999;
        const ordemB = sectionsMap.get(b.secao) ?? 999;
        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }
        return a.nome.localeCompare(b.nome);
      });
      setItems(sorted);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast.error('Erro ao carregar itens do menu');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      // Carregar dados apenas do banco de dados (API)
      const apiData = await api.getMenuSecoes();
      
      // Processar e ordenar seções
      const processedSections = apiData.map((section: any) => ({
        ...section,
        ordem: section.ordem || 0,
      }));
      
      // Ordenar por ordem
      const sorted = [...processedSections].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      setSections(sorted);
      
      // Se não houver seção selecionada no formData, usar a primeira seção disponível
      if (!formData.secao && sorted.length > 0) {
        setFormData(prev => ({ ...prev, secao: sorted[0].nome }));
      }
    } catch (error) {
      console.error('Erro ao carregar seções:', error);
      toast.error('Erro ao carregar seções');
      setSections([]);
    }
  };

  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      // Sempre usar URL agora (não mais base64)
      setImageSource("url");
      setFormData({
        nome: item.nome,
        descricao: item.descricao || "",
        preco: item.preco.toString(),
        secao: item.secao,
        destaque: item.destaque,
        imagem_url: item.imagem_url || "",
      });
      setUploadedImage(null);
      setUploadedFile(null);
      setPreviewImage(item.imagem_url || null);
    } else {
      setEditingItem(null);
      const firstSection = sections.length > 0 ? sections[0].nome : "";
      setFormData({
        nome: "",
        descricao: "",
        preco: "",
        secao: firstSection,
        destaque: false,
        imagem_url: "",
      });
      setImageSource("url");
      setUploadedImage(null);
      setUploadedFile(null);
      setPreviewImage(null);
    }
    setDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um ficheiro de imagem válido");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    // Guardar o arquivo para upload posterior
    setUploadedFile(file);
    
    // Criar preview usando FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreviewImage(previewUrl);
      setFormData({ ...formData, imagem_url: "" }); // Limpar URL se houver
    };
    reader.onerror = () => {
      toast.error("Erro ao carregar a imagem");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setPreviewImage(null);
    setFormData({ ...formData, imagem_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar preço
    const preco = parseFloat(formData.preco);
    if (isNaN(preco) || preco <= 0) {
      toast.error("Preço inválido. Digite um valor maior que zero.");
      return;
    }

    // Validar nome
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }

    setUploading(true);
    let finalImageUrl: string | null = null;
    let imagemBlob: string | null = null;

    try {
      // Se houver arquivo para upload, fazer upload e obter base64
      if (imageSource === "upload" && uploadedFile) {
        const uploadResult = await api.uploadEmentaImage(uploadedFile);
        // O servidor retorna o blob em base64
        imagemBlob = uploadResult.blob;
        // Não usar URL quando temos BLOB
        finalImageUrl = null;
      } else if (imageSource === "url" && formData.imagem_url.trim()) {
        finalImageUrl = formData.imagem_url.trim();
        imagemBlob = null;
      }

      // Salvar no banco de dados (API)
      const data = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        preco: preco,
        secao: formData.secao,
        destaque: formData.destaque,
        imagem_url: finalImageUrl,
        imagem_blob: imagemBlob, // Enviar BLOB em base64
      };

      if (editingItem) {
        await api.updateEmenta(editingItem.id, data);
        toast.success("Item atualizado com sucesso!");
      } else {
        await api.createEmenta(data);
        toast.success("Item adicionado com sucesso!");
      }

      setDialogOpen(false);
      await loadItems();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar item");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Apenas o admin principal pode excluir pratos
    if (!localAuth.isMainAdmin()) {
      toast.error("Apenas o administrador principal pode excluir pratos");
      return;
    }

    if (!confirm("Tem certeza que deseja remover este item?")) return;

    try {
      // Deletar via API (todos os itens estão no banco de dados)
      await api.deleteEmenta(id);
      toast.success("Item removido com sucesso!");
      await loadItems();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover item");
    }
  };

  const handleToggleAtivo = async (id: string) => {
    // Permitir que admin e atualizadores ativem/desativar pratos
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas administradores e atualizadores podem ativar/desativar pratos.");
      return;
    }

    try {
      // Atualizar via API (todos os itens estão no banco de dados)
      await api.toggleEmentaAtivo(id);
      toast.success("Status do item alterado com sucesso!");
      await loadItems();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status do item");
    }
  };

  const handleOpenSectionDialog = (section?: MenuSection) => {
    if (section) {
      setEditingSection(section);
      setSectionFormData({ nome: section.nome });
    } else {
      setEditingSection(null);
      setSectionFormData({ nome: "" });
    }
    setSectionDialogOpen(true);
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sectionFormData.nome.trim()) {
      toast.error("Nome da seção é obrigatório.");
      return;
    }

    try {
      if (editingSection) {
        // Atualizar via API (todas as seções estão no banco de dados)
        await api.updateMenuSecao(editingSection.id, { nome: sectionFormData.nome });
        toast.success("Seção atualizada com sucesso!");
      } else {
        // Criar nova seção no banco de dados
        await api.createMenuSecao({ nome: sectionFormData.nome });
        toast.success("Seção criada com sucesso!");
      }
      setSectionDialogOpen(false);
      await loadSections();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar seção");
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta seção?")) return;

    try {
      // Deletar via API (todas as seções estão no banco de dados)
      await api.deleteMenuSecao(id);
      toast.success("Seção removida com sucesso!");
      await loadSections();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover seção");
    }
  };

  // Função auxiliar para obter URL completa da imagem
  const getImageUrl = (url: string | null | undefined, itemId?: string): string | null => {
    if (!url) {
      // Se não tem URL mas tem ID, pode ter imagem_blob no banco
      if (itemId) {
        // Buscar imagem no banco (imagem_blob)
        return api.getEmentaImage(itemId);
      }
      return null;
    }
    // Se já é uma URL completa (http/https), retornar como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Se é uma rota de API para imagem_blob
    if (url.startsWith('/api/upload/ementa/')) {
      return `http://localhost:3001${url}`;
    }
    // Se é uma URL relativa (começa com /uploads), adicionar o servidor
    if (url.startsWith('/uploads')) {
      return `http://localhost:3001${url}`;
    }
    // Se é base64 (data:), retornar como está (para compatibilidade com dados antigos)
    if (url.startsWith('data:')) {
      return url;
    }
    // Caso contrário, tratar como URL relativa
    return `http://localhost:3001${url.startsWith('/') ? url : '/' + url}`;
  };

  const user = localAuth.getCurrentUser();
  const canEditEmenta = user && (user.role === 'admin' && localAuth.isMainAdmin());

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {canEditEmenta && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        )}
        <Button onClick={() => handleOpenSectionDialog()} variant="outline">
          <FolderPlus className="mr-2 h-4 w-4" />
          Gerenciar Seções
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => {
            const sectionItems = items.filter((item) => item.secao === section.nome);
            if (sectionItems.length === 0) return null;

            return (
              <div key={section.id}>
                <h3 className="text-2xl font-serif font-semibold mb-4 text-primary">
                  {section.nome}
                </h3>
                <div className="grid gap-4">
                  {sectionItems.map((item) => (
                    <Card key={item.id} className={`shadow-soft ${!item.ativo ? 'opacity-60' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{item.nome}</CardTitle>
                              {!item.ativo && (
                                <Badge variant="secondary" className="text-xs">
                                  Inativo
                                </Badge>
                              )}
                              {item.destaque && item.ativo && (
                                <span className="text-xs text-accent font-medium">
                                  ⭐ Destaque
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {/* Botão de ativar/desativar - disponível para admin e atualizadores */}
                            {(() => {
                              const user = localAuth.getCurrentUser();
                              return user && (user.role === 'admin' || user.role === 'atualizador');
                            })() && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleAtivo(item.id)}
                                title={item.ativo ? "Desativar prato" : "Ativar prato"}
                              >
                                {item.ativo ? (
                                  <PowerOff className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {/* Botão de editar - apenas para admin principal */}
                            {canEditEmenta && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDialog(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {/* Botão de excluir - apenas para admin principal */}
                            {canEditEmenta && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                                title="Excluir prato (apenas admin principal)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {item.descricao && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.descricao}
                          </p>
                        )}
                        <p className="text-lg font-semibold text-primary">
                          €{item.preco.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item" : "Adicionar Item"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="preco">Preço (€)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="secao">Secção</Label>
              <Select
                value={formData.secao}
                onValueChange={(value) => setFormData({ ...formData, secao: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma seção" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.nome}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Imagem do Prato (opcional)</Label>
              <Tabs value={imageSource} onValueChange={(v) => setImageSource(v as "url" | "upload")} className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="upload">Carregar Ficheiro</TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="space-y-2 mt-2">
                  <Input
                    id="imagem_url"
                    type="url"
                    value={formData.imagem_url}
                    onChange={(e) => {
                      setFormData({ ...formData, imagem_url: e.target.value });
                      setPreviewImage(e.target.value || null);
                    }}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                  {previewImage && (
                    <div className="mt-2">
                      <img 
                        src={getImageUrl(previewImage) || ''} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={() => setPreviewImage(null)}
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="upload" className="space-y-2 mt-2">
                  {previewImage ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Imagem carregada com sucesso
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('imagem_file')?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Trocar Imagem
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('imagem_file')?.click()}
                      >
                        <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          Clique para selecionar uma imagem
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Formatos: JPG, PNG, GIF | Máximo 5MB
                        </p>
                      </div>
                      <Input
                        id="imagem_file"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="destaque"
                checked={formData.destaque}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, destaque: checked })
                }
              />
              <Label htmlFor="destaque">Marcar como destaque</Label>
            </div>

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadedFile ? "A fazer upload..." : "A guardar..."}
                </>
              ) : (
                editingItem ? "Atualizar" : "Adicionar"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerenciar seções */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? "Editar Seção" : "Nova Seção"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSectionSubmit} className="space-y-4">
            <div>
              <Label htmlFor="sectionNome">Nome da Seção</Label>
              <Input
                id="sectionNome"
                value={sectionFormData.nome}
                onChange={(e) => setSectionFormData({ nome: e.target.value })}
                placeholder="Ex: Aperitivos"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSectionDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingSection ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>

          {/* Lista de seções existentes */}
          {!editingSection && sections.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <Label className="mb-3 block">Seções Existentes</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {sections.map((section) => {
                  const itemsCount = items.filter(item => item.secao === section.nome).length;
                  return (
                    <Card key={section.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{section.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSectionDialogOpen(false);
                              setTimeout(() => handleOpenSectionDialog(section), 100);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {localAuth.isMainAdmin() && (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSection(section.id)}
                              disabled={itemsCount > 0}
                              title={itemsCount > 0 ? "Não é possível excluir seção com itens" : "Excluir seção"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
