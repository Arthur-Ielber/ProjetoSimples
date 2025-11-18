import { useEffect, useState } from "react";
import { localPedidos, Pedido, ItemPedido } from "@/lib/localStorage";
import { localMenu } from "@/lib/localStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Receipt, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const GestaoTab = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nomeCliente, setNomeCliente] = useState("");
  const [itensPedido, setItensPedido] = useState<Array<ItemPedido & { tempId: string }>>([]);
  const [menuItems, setMenuItems] = useState<Array<{ id: string; nome: string; preco: number }>>([]);

  useEffect(() => {
    loadPedidos();
    loadMenuItems();
    
    // Listener para mudanças no localStorage
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'table_menu_pedidos') {
        loadPedidos();
      }
    };
    
    window.addEventListener('localStorageChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, []);

  const loadPedidos = () => {
    setLoading(true);
    // Obter apenas pedidos do dia atual
    const pedidosDoDia = localPedidos.getDoDia();
    // Ordenar por hora (mais recente primeiro)
    const sorted = pedidosDoDia.sort((a, b) => {
      if (a.hora !== b.hora) {
        return b.hora.localeCompare(a.hora);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setPedidos(sorted);
    setLoading(false);
  };

  const loadMenuItems = () => {
    // Carregar apenas pratos ativos
    const items = localMenu.getAtivos();
    setMenuItems(items.map(item => ({ id: item.id, nome: item.nome, preco: item.preco })));
  };

  const handleOpenDialog = () => {
    setNomeCliente("");
    setItensPedido([]);
    setDialogOpen(true);
  };

  const handleAddItem = () => {
    if (menuItems.length === 0) {
      toast.error("Não há pratos disponíveis na ementa");
      return;
    }
    
    const novoItem: ItemPedido & { tempId: string } = {
      tempId: crypto.randomUUID(),
      menuItemId: menuItems[0].id,
      nome: menuItems[0].nome,
      preco: menuItems[0].preco,
      quantidade: 1,
    };
    
    setItensPedido([...itensPedido, novoItem]);
  };

  const handleRemoveItem = (tempId: string) => {
    setItensPedido(itensPedido.filter(item => item.tempId !== tempId));
  };

  const handleUpdateItem = (tempId: string, updates: Partial<ItemPedido>) => {
    setItensPedido(itensPedido.map(item => 
      item.tempId === tempId ? { ...item, ...updates } : item
    ));
  };

  const calcularTotal = () => {
    const subtotal = itensPedido.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const taxa = subtotal * 0.05;
    return {
      subtotal,
      taxa,
      total: subtotal + taxa,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nomeCliente.trim()) {
      toast.error("Por favor, insira o nome do cliente");
      return;
    }
    
    if (itensPedido.length === 0) {
      toast.error("Por favor, adicione pelo menos um prato ao pedido");
      return;
    }
    
    const itens: ItemPedido[] = itensPedido.map(({ tempId, ...item }) => item);
    
    const result = localPedidos.create({
      nomeCliente: nomeCliente.trim(),
      itens,
    });
    
    if (!result.success) {
      toast.error(result.error || "Erro ao criar pedido");
      return;
    }
    
    toast.success("Pedido criado com sucesso!");
    setDialogOpen(false);
    loadPedidos();
  };

  const handleDelete = (id: string) => {
    const result = localPedidos.delete(id);
    if (!result.success) {
      toast.error(result.error || "Erro ao excluir pedido");
      return;
    }
    toast.success("Pedido excluído com sucesso!");
    loadPedidos();
  };

  const totalDia = pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
  const hoje = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totais = calcularTotal();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-primary">
            Gestão do Restaurante
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {hoje}
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Comanda
        </Button>
      </div>

      {/* Resumo do dia */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              <p className="text-2xl font-bold text-primary">{pedidos.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total do Dia</p>
              <p className="text-2xl font-bold text-primary">
                €{totalDia.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Média por Pedido</p>
              <p className="text-2xl font-bold text-primary">
                €{pedidos.length > 0 ? (totalDia / pedidos.length).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de pedidos */}
      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pedido registrado hoje</p>
            <p className="text-sm mt-2">Clique em "Nova Comanda" para criar um pedido</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{pedido.nomeCliente}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pedido.hora} • {pedido.itens.length} {pedido.itens.length === 1 ? 'prato' : 'pratos'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(pedido.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {pedido.itens.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm py-2 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-muted-foreground">
                          {item.quantidade}x €{item.preco.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        €{(item.preco * item.quantidade).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-1 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>€{pedido.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa (5%):</span>
                    <span>€{pedido.taxa.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t">
                    <span>Total:</span>
                    <span>€{pedido.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar nova comanda */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Comanda</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nomeCliente">Nome do Cliente</Label>
              <Input
                id="nomeCliente"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Ex: João Silva"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Pratos do Pedido</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Prato
                </Button>
              </div>

              {itensPedido.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum prato adicionado
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em "Adicionar Prato" para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itensPedido.map((item) => (
                    <Card key={item.tempId} className="p-4">
                      <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-2">
                          <Select
                            value={item.menuItemId}
                            onValueChange={(value) => {
                              const selectedItem = menuItems.find(m => m.id === value);
                              if (selectedItem) {
                                handleUpdateItem(item.tempId, {
                                  menuItemId: selectedItem.id,
                                  nome: selectedItem.nome,
                                  preco: selectedItem.preco,
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {menuItems.map((menuItem) => (
                                <SelectItem key={menuItem.id} value={menuItem.id}>
                                  {menuItem.nome} - €{menuItem.preco.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`qtd-${item.tempId}`} className="text-sm">
                              Quantidade:
                            </Label>
                            <Input
                              id={`qtd-${item.tempId}`}
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) =>
                                handleUpdateItem(item.tempId, {
                                  quantidade: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">
                              = €{(item.preco * item.quantidade).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.tempId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {itensPedido.length > 0 && (
              <Card className="p-4 bg-accent/5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>€{totais.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa (5%):</span>
                    <span>€{totais.taxa.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t">
                    <span>Total:</span>
                    <span>€{totais.total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={itensPedido.length === 0}>
                Criar Comanda
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

