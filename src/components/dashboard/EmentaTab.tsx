import { useEffect, useState } from "react";
import { localMenu, MenuItem as LocalMenuItem } from "@/lib/localStorage";
import { localAuth } from "@/lib/localAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Power, PowerOff, Upload, X, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type MenuItem = LocalMenuItem;

export const EmentaTab = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    secao: "Entradas",
    destaque: false,
    imagem_url: "",
  });
  const [imageSource, setImageSource] = useState<"url" | "upload">("url");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
    
    // Listener para atualizar quando houver mudanças no localStorage (outras abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'table_menu_ementa') {
        loadItems();
      }
    };
    
    // Listener para atualizar quando houver mudanças na mesma aba
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail?.key === 'table_menu_ementa') {
        loadItems();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, []);

  const loadItems = () => {
    setLoading(true);
    const data = localMenu.getAll();
    // Ordenar por seção e nome (criar cópia para não modificar o original)
    const sorted = [...data].sort((a, b) => {
      if (a.secao !== b.secao) {
        return a.secao.localeCompare(b.secao);
      }
      return a.nome.localeCompare(b.nome);
    });
    setItems(sorted);
    setLoading(false);
  };

  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      const hasImage = !!item.imagem_url;
      const isDataUrl = hasImage && item.imagem_url?.startsWith('data:');
      setImageSource(isDataUrl ? "upload" : "url");
      setFormData({
        nome: item.nome,
        descricao: item.descricao || "",
        preco: item.preco.toString(),
        secao: item.secao,
        destaque: item.destaque,
        imagem_url: isDataUrl ? "" : (item.imagem_url || ""),
      });
      setUploadedImage(isDataUrl ? item.imagem_url : null);
      setPreviewImage(item.imagem_url);
    } else {
      setEditingItem(null);
      setFormData({
        nome: "",
        descricao: "",
        preco: "",
        secao: "Entradas",
        destaque: false,
        imagem_url: "",
      });
      setImageSource("url");
      setUploadedImage(null);
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

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setUploadedImage(base64String);
      setPreviewImage(base64String);
      setFormData({ ...formData, imagem_url: "" }); // Limpar URL se houver
    };
    reader.onerror = () => {
      toast.error("Erro ao carregar a imagem");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setPreviewImage(null);
    setFormData({ ...formData, imagem_url: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    // Usar imagem carregada se houver, senão usar URL
    const finalImageUrl = imageSource === "upload" && uploadedImage 
      ? uploadedImage 
      : (formData.imagem_url.trim() || null);

    const data = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || null,
      preco: preco,
      secao: formData.secao as LocalMenuItem['secao'],
      destaque: formData.destaque,
      imagem_url: finalImageUrl,
    };

    if (editingItem) {
      const result = localMenu.update(editingItem.id, data);

      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar item");
      } else {
        toast.success("Item atualizado com sucesso!");
        setDialogOpen(false);
        loadItems();
      }
    } else {
      const result = localMenu.create(data);

      if (!result.success) {
        toast.error(result.error || "Erro ao adicionar item");
      } else {
        toast.success("Item adicionado com sucesso!");
        setDialogOpen(false);
        loadItems();
      }
    }
  };

  const handleDelete = (id: string) => {
    // Apenas o admin principal pode excluir pratos
    if (!localAuth.isMainAdmin()) {
      toast.error("Apenas o administrador principal pode excluir pratos");
      return;
    }

    if (!confirm("Tem certeza que deseja remover este item?")) return;

    const result = localMenu.delete(id);

    if (!result.success) {
      toast.error(result.error || "Erro ao remover item");
    } else {
      toast.success("Item removido com sucesso!");
      loadItems();
    }
  };

  const handleToggleAtivo = (id: string) => {
    // Permitir que admin e atualizadores ativem/desativem pratos
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas administradores e atualizadores podem ativar/desativar pratos.");
      return;
    }

    const result = localMenu.toggleAtivo(id);

    if (!result.success) {
      toast.error(result.error || "Erro ao ativar/desativar item");
    } else {
      const item = result.data;
      toast.success(`Item ${item?.ativo ? 'ativado' : 'desativado'} com sucesso!`);
      loadItems();
    }
  };

  const sections = ["Entradas", "Pratos Principais", "Sobremesas", "Bebidas"];

  return (
    <div className="space-y-6">
      <Button onClick={() => handleOpenDialog()}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Item
      </Button>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => {
            const sectionItems = items.filter((item) => item.secao === section);
            if (sectionItems.length === 0) return null;

            return (
              <div key={section}>
                <h3 className="text-2xl font-serif font-semibold mb-4 text-primary">
                  {section}
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {/* Botão de excluir - apenas para admin principal */}
                            {localAuth.isMainAdmin() && (
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
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
                  {previewImage && previewImage.startsWith('http') && (
                    <div className="mt-2">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={() => setPreviewImage(null)}
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="upload" className="space-y-2 mt-2">
                  {uploadedImage ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img 
                          src={uploadedImage} 
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

            <Button type="submit" className="w-full">
              {editingItem ? "Atualizar" : "Adicionar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
