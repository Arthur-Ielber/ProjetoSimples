import { useEffect, useState } from "react";
import { localMenu, MenuItem as LocalMenuItem } from "@/lib/localStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    setLoading(true);
    const data = localMenu.getAll();
    // Ordenar por seção e nome
    const sorted = data.sort((a, b) => {
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
      setFormData({
        nome: item.nome,
        descricao: item.descricao || "",
        preco: item.preco.toString(),
        secao: item.secao,
        destaque: item.destaque,
        imagem_url: item.imagem_url || "",
      });
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
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      nome: formData.nome,
      descricao: formData.descricao || null,
      preco: parseFloat(formData.preco),
      secao: formData.secao,
      destaque: formData.destaque,
      imagem_url: formData.imagem_url || null,
    };

    if (editingItem) {
      const result = localMenu.update(editingItem.id, {
        ...data,
        secao: data.secao as LocalMenuItem['secao'],
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar item");
      } else {
        toast.success("Item atualizado com sucesso!");
        setDialogOpen(false);
        loadItems();
      }
    } else {
      const result = localMenu.create({
        ...data,
        secao: data.secao as LocalMenuItem['secao'],
      });

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
    if (!confirm("Tem certeza que deseja remover este item?")) return;

    const result = localMenu.delete(id);

    if (!result.success) {
      toast.error(result.error || "Erro ao remover item");
    } else {
      toast.success("Item removido com sucesso!");
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
                    <Card key={item.id} className="shadow-soft">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{item.nome}</CardTitle>
                            {item.destaque && (
                              <span className="text-xs text-accent font-medium">
                                ⭐ Destaque
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
              <Label htmlFor="imagem_url">URL da Imagem (opcional)</Label>
              <Input
                id="imagem_url"
                type="url"
                value={formData.imagem_url}
                onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
              />
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
