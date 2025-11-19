import { useEffect, useState } from "react";
import { localPedidos, Pedido, ItemPedido, MenuItem, localMesas, Mesa, localSections, MenuSection, StatusPedido, localReservas } from "@/lib/localStorage";
import { localMenu } from "@/lib/localStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Receipt, Table, Power, PowerOff, Pencil, ShoppingCart, CheckCircle, X, RotateCcw } from "lucide-react";

export const GestaoTab = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mesaDialogOpen, setMesaDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"mesas" | "pedidos">("mesas");
  const [nomeCliente, setNomeCliente] = useState("");
  const [mesaId, setMesaId] = useState<string | null>(null);
  const [itensPedido, setItensPedido] = useState<Array<ItemPedido & { tempId: string }>>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [mesaFormData, setMesaFormData] = useState({ numero: "", capacidade: 4 });
  const [mesaAcoesDialogOpen, setMesaAcoesDialogOpen] = useState(false);
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null);
  const [mesaPreSelecionada, setMesaPreSelecionada] = useState(false);
  const [observacoes, setObservacoes] = useState<string>("");
  const [pedidoStatusTab, setPedidoStatusTab] = useState<"abertas" | "pendentes" | "finalizadas">("abertas");
  const [finalizarDialogOpen, setFinalizarDialogOpen] = useState(false);
  const [pedidoParaFinalizar, setPedidoParaFinalizar] = useState<Pedido | null>(null);
  const [formaPagamentoFinalizacao, setFormaPagamentoFinalizacao] = useState<string>("");
  const [observacoesFinalizacao, setObservacoesFinalizacao] = useState<string>("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    loadPedidos();
    loadMenuItems();
    loadMesas();
    loadSections();
    
    // Listener para mudanças no localStorage
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'table_menu_pedidos') {
        loadPedidos();
      } else if (customEvent.detail?.key === 'table_menu_ementa') {
        loadMenuItems();
      } else if (customEvent.detail?.key === 'table_menu_mesas') {
        loadMesas();
      } else if (customEvent.detail?.key === 'table_menu_secoes') {
        loadSections();
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
  
  const getPedidosPorStatus = (status: StatusPedido) => {
    return pedidos.filter(p => p.status === status);
  };

  const loadMenuItems = () => {
    // Carregar apenas pratos ativos
    const items = localMenu.getAtivos();
    setMenuItems(items);
    
    // Remover itens selecionados que não existem mais na ementa
    const itemIds = new Set(items.map(item => item.id));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      prev.forEach(id => {
        if (!itemIds.has(id)) {
          newSet.delete(id);
        }
      });
      return newSet;
    });
    
    // Remover itens do pedido que não existem mais na ementa
    setItensPedido(prev => prev.filter(item => itemIds.has(item.menuItemId)));
  };

  const loadSections = () => {
    const allSections = localSections.getAll();
    // Ordenar por ordem
    const sorted = [...allSections].sort((a, b) => a.ordem - b.ordem);
    setSections(sorted);
  };

  const loadMesas = () => {
    const mesasData = localMesas.getAll();
    setMesas(mesasData);
  };

  const handleOpenDialog = (mesaIdParam?: string | null) => {
    setNomeCliente("");
    setMesaId(mesaIdParam || null);
    setMesaPreSelecionada(!!mesaIdParam); // Se veio da mesa, está pré-selecionada
    setItensPedido([]);
    setSelectedItems(new Set());
    setEditingPedidoId(null);
    setDialogOpen(true);
  };

  const handleMesaClick = (mesa: Mesa) => {
    if (!mesa.ativa) {
      toast.error("Esta mesa está desabilitada");
      return;
    }
    setMesaSelecionada(mesa);
    setMesaAcoesDialogOpen(true);
  };

  const handleAbrirComanda = () => {
    if (!mesaSelecionada) {
      toast.error("Mesa não selecionada");
      return;
    }
    
    // Preparar todos os estados necessários
    const mesaIdValue = mesaSelecionada.id;
    
    // Fechar diálogo de ações primeiro
    setMesaAcoesDialogOpen(false);
    setMesaSelecionada(null);
    
    // Preparar estados imediatamente
    setMesaId(mesaIdValue);
    setMesaPreSelecionada(true); // Mesa pré-selecionada, não pode ser alterada
    setNomeCliente("");
    setItensPedido([]);
    setSelectedItems(new Set());
    setEditingPedidoId(null);
    
    // Abrir diálogo após um pequeno delay para garantir que o estado anterior foi limpo
    setTimeout(() => {
      setDialogOpen(true);
    }, 150);
  };

  const handleEditarPedido = (pedido: Pedido) => {
    const itensExistentes = pedido.itens.map(item => ({
      ...item,
      tempId: crypto.randomUUID(),
    }));
    const selectedIds = new Set(itensExistentes.map(item => item.menuItemId));
    
    // Preparar estados
    setEditingPedidoId(pedido.id);
    setMesaId(pedido.mesaId || null);
    setMesaPreSelecionada(false); // Permite alterar a mesa se necessário
    setNomeCliente(pedido.nomeCliente || "");
    setItensPedido(itensExistentes);
    setSelectedItems(selectedIds);
    setObservacoes(pedido.observacoes || "");
    
    // Abrir diálogo
    setDialogOpen(true);
  };

  const handleAdicionarItens = () => {
    if (!mesaSelecionada) {
      toast.error("Mesa não selecionada");
      return;
    }
    
    const pedidosNaMesa = localMesas.getPedidosAtivos(mesaSelecionada.id);
    if (pedidosNaMesa.length === 0) {
      toast.error("Não há comanda ativa para esta mesa");
      return;
    }
    
    // Ordenar por data/hora e usar o pedido mais recente
    const pedidosOrdenados = [...pedidosNaMesa].sort((a, b) => {
      if (a.data !== b.data) {
        return b.data.localeCompare(a.data);
      }
      return b.hora.localeCompare(a.hora);
    });
    const pedidoAtivo = pedidosOrdenados[0];
    
    if (!pedidoAtivo) {
      toast.error("Erro ao carregar comanda");
      return;
    }
    
    // Fechar diálogo de ações primeiro
    setMesaAcoesDialogOpen(false);
    setMesaSelecionada(null);
    
    // Usar a função de editar pedido, mas com mesa pré-selecionada
    const itensExistentes = pedidoAtivo.itens.map(item => ({
      ...item,
      tempId: crypto.randomUUID(),
    }));
    const selectedIds = new Set(itensExistentes.map(item => item.menuItemId));
    
    setEditingPedidoId(pedidoAtivo.id);
    setMesaId(mesaSelecionada.id);
    setMesaPreSelecionada(true); // Mesa pré-selecionada, não pode ser alterada
    setNomeCliente(pedidoAtivo.nomeCliente || "");
    setItensPedido(itensExistentes);
    setSelectedItems(selectedIds);
    setObservacoes(pedidoAtivo.observacoes || "");
    
    // Abrir diálogo após um pequeno delay
    setTimeout(() => {
      setDialogOpen(true);
    }, 150);
  };


  const handleToggleItem = (menuItemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    
    if (checked) {
      newSelected.add(menuItemId);
      const menuItem = menuItems.find(m => m.id === menuItemId);
      if (menuItem) {
    const novoItem: ItemPedido & { tempId: string } = {
      tempId: crypto.randomUUID(),
          menuItemId: menuItem.id,
          nome: menuItem.nome,
          preco: menuItem.preco,
      quantidade: 1,
    };
    setItensPedido([...itensPedido, novoItem]);
      }
    } else {
      newSelected.delete(menuItemId);
      setItensPedido(itensPedido.filter(item => item.menuItemId !== menuItemId));
    }
    
    setSelectedItems(newSelected);
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(menuItems.map(item => item.id));
      setSelectedItems(allIds);
      
      const newItems: Array<ItemPedido & { tempId: string }> = menuItems.map(menuItem => ({
        tempId: crypto.randomUUID(),
        menuItemId: menuItem.id,
        nome: menuItem.nome,
        preco: menuItem.preco,
        quantidade: 1,
      }));
      setItensPedido(newItems);
    } else {
      setSelectedItems(new Set());
      setItensPedido([]);
    }
  };

  const handleUpdateItem = (menuItemId: string, updates: Partial<ItemPedido>) => {
    setItensPedido(itensPedido.map(item => 
      item.menuItemId === menuItemId ? { ...item, ...updates } : item
    ));
  };

  const handleRemoveItem = (tempId: string) => {
    const item = itensPedido.find(i => i.tempId === tempId);
    if (item) {
      setItensPedido(itensPedido.filter(i => i.tempId !== tempId));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.menuItemId);
        return newSet;
      });
    }
  };

  const handleAbrirDialogFinalizacao = (pedido: Pedido) => {
    setPedidoParaFinalizar(pedido);
    setFormaPagamentoFinalizacao(pedido.formaPagamento || "");
    setObservacoesFinalizacao(pedido.observacoesFinalizacao || "");
    setFinalizarDialogOpen(true);
  };

  const handleMarcarPendente = () => {
    try {
      if (!pedidoParaFinalizar) {
        toast.error("Erro: comanda não encontrada");
        return;
      }
      
      if (!formaPagamentoFinalizacao || formaPagamentoFinalizacao.trim() === "") {
        toast.error("Por favor, selecione a forma de pagamento");
        return;
      }

      const pedidoId = pedidoParaFinalizar.id;
      const formaPag = formaPagamentoFinalizacao.trim();
      const obsFinalizacao = observacoesFinalizacao?.trim() || null;

      const result = localPedidos.marcarPendente(
        pedidoId,
        formaPag,
        obsFinalizacao
      );
      
      if (!result.success) {
        toast.error(result.error || "Erro ao marcar comanda como pendente");
        return;
      }

      toast.success("Comanda marcada como pendente de finalização!");
      
      // Limpar estados e fechar diálogo
      setFinalizarDialogOpen(false);
      setPedidoParaFinalizar(null);
      setFormaPagamentoFinalizacao("");
      setObservacoesFinalizacao("");
      
      // Recarregar pedidos e mudar aba
      loadPedidos();
      setPedidoStatusTab("pendentes");
    } catch (error) {
      console.error("Erro em handleMarcarPendente:", error);
      toast.error("Erro inesperado ao marcar comanda como pendente");
    }
  };

  const handleFinalizarComanda = () => {
    try {
      if (!pedidoParaFinalizar) {
        toast.error("Erro: comanda não encontrada");
        return;
      }
      
      // Validar forma de pagamento se ainda não foi marcada como pendente
      if (pedidoParaFinalizar.status === 'aberta' && (!formaPagamentoFinalizacao || formaPagamentoFinalizacao.trim() === "")) {
        toast.error("Por favor, selecione a forma de pagamento");
        return;
      }

      // Capturar valores antes de abrir o diálogo
      const pedidoId = pedidoParaFinalizar.id;
      const pedidoStatus = pedidoParaFinalizar.status;
      const formaPag = formaPagamentoFinalizacao?.trim() || "";
      const obsFinalizacao = observacoesFinalizacao?.trim() || null;

      // Fechar diálogo de finalização temporariamente
      setFinalizarDialogOpen(false);

      // Mostrar diálogo de confirmação
      setTimeout(() => {
        setConfirmDialogData({
          title: "Finalizar Comanda",
          message: "Tem certeza que deseja finalizar esta comanda? A mesa será liberada.",
          onConfirm: () => {
            try {
              // Se ainda não foi marcada como pendente, marcar primeiro
              if (pedidoStatus === 'aberta') {
                const resultPendente = localPedidos.marcarPendente(
                  pedidoId,
                  formaPag,
                  obsFinalizacao
                );
                
                if (!resultPendente.success) {
                  toast.error(resultPendente.error || "Erro ao processar comanda");
                  setConfirmDialogOpen(false);
                  setConfirmDialogData(null);
                  return;
                }
              }

              const result = localPedidos.finalizar(pedidoId);
              
              if (!result.success) {
                toast.error(result.error || "Erro ao finalizar comanda");
                setConfirmDialogOpen(false);
                setConfirmDialogData(null);
                return;
              }

              toast.success("Comanda finalizada com sucesso! Mesa liberada.");
              setConfirmDialogOpen(false);
              setPedidoParaFinalizar(null);
              setFormaPagamentoFinalizacao("");
              setObservacoesFinalizacao("");
              setConfirmDialogData(null);
              
              // Recarregar pedidos e mudar aba
              loadPedidos();
              setPedidoStatusTab("finalizadas");
            } catch (error) {
              console.error("Erro ao finalizar comanda:", error);
              toast.error("Erro inesperado ao finalizar comanda");
              setConfirmDialogOpen(false);
              setConfirmDialogData(null);
            }
          }
        });
        setConfirmDialogOpen(true);
      }, 150);
    } catch (error) {
      console.error("Erro em handleFinalizarComanda:", error);
      toast.error("Erro inesperado");
    }
  };

  const handleReabrirComanda = (pedidoId: string) => {
    const result = localPedidos.reabrir(pedidoId);
    if (!result.success) {
      toast.error(result.error || "Erro ao reabrir comanda");
      return;
    }

    toast.success("Comanda reaberta com sucesso!");
    loadPedidos();
    // Mudar para aba de abertas
    setPedidoStatusTab("abertas");
  };

  const calcularTotal = () => {
    const subtotal = itensPedido.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    return {
      subtotal,
      taxa: 0,
      total: subtotal,
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
    
    if (editingPedidoId) {
      // Atualizar pedido existente
      const result = localPedidos.update(editingPedidoId, {
        nomeCliente: nomeCliente.trim(),
        mesaId: mesaId || null,
        itens,
        observacoes: observacoes.trim() || null,
      });
      
      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar pedido");
        return;
      }
      
      toast.success("Pedido atualizado com sucesso!");
    } else {
      // Criar novo pedido
      // Verificar se a mesa está ocupada
      if (mesaId) {
        const pedidosAtivosNaMesa = localMesas.getPedidosAtivos(mesaId);
        if (pedidosAtivosNaMesa.length > 0) {
          toast.error(`A mesa ${mesas.find(m => m.id === mesaId)?.numero || mesaId} já possui comanda(s) ativa(s)`);
          return;
        }

        // Verificar se há reserva confirmada para esta mesa
        const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        const agora = new Date();
        const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
        
        // Buscar reservas confirmadas para esta mesa hoje
        const reservasConfirmadas = localReservas.getReservasConfirmadasParaMesa(mesaId, hoje);
        
        if (reservasConfirmadas.length > 0) {
          // Verificar se há uma reserva confirmada para o horário atual (com tolerância de 30 minutos antes e 2 horas depois)
          const reservaValida = reservasConfirmadas.find(r => {
            const [horaReserva, minutoReserva] = r.hora_reserva.split(':').map(Number);
            const [horaAtualNum, minutoAtualNum] = horaAtual.split(':').map(Number);
            
            const horaReservaMinutos = horaReserva * 60 + minutoReserva;
            const horaAtualMinutos = horaAtualNum * 60 + minutoAtualNum;
            
            // Permitir abrir comanda 30 minutos antes até 2 horas depois do horário da reserva
            const toleranciaAntes = 30; // minutos
            const toleranciaDepois = 120; // minutos
            
            return (horaAtualMinutos >= horaReservaMinutos - toleranciaAntes) && 
                   (horaAtualMinutos <= horaReservaMinutos + toleranciaDepois);
          });

          if (!reservaValida) {
            const proximaReserva = reservasConfirmadas
              .sort((a, b) => a.hora_reserva.localeCompare(b.hora_reserva))
              .find(r => {
                const [horaReserva] = r.hora_reserva.split(':').map(Number);
                const [horaAtualNum] = horaAtual.split(':').map(Number);
                return horaReserva >= horaAtualNum;
              });

            if (proximaReserva) {
              toast.error(
                `A mesa ${mesas.find(m => m.id === mesaId)?.numero || mesaId} tem reserva confirmada para ${proximaReserva.hora_reserva}. ` +
                `A comanda só pode ser aberta entre 30 minutos antes e 2 horas depois do horário da reserva.`
              );
            } else {
              toast.error(
                `A mesa ${mesas.find(m => m.id === mesaId)?.numero || mesaId} tem reserva confirmada para hoje, ` +
                `mas o horário já passou. A comanda só pode ser aberta entre 30 minutos antes e 2 horas depois do horário da reserva.`
              );
            }
            return;
          }
        }
      }
    
    const result = localPedidos.create({
      nomeCliente: nomeCliente.trim(),
        mesaId: mesaId || null,
      itens,
        observacoes: observacoes.trim() || null,
    });
    
    if (!result.success) {
      toast.error(result.error || "Erro ao criar pedido");
      return;
    }
    
    toast.success("Pedido criado com sucesso!");
    }
    
    setDialogOpen(false);
    setEditingPedidoId(null);
    setObservacoes("");
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

  const handleOpenMesaDialog = (mesa?: Mesa) => {
    if (mesa) {
      setEditingMesa(mesa);
      setMesaFormData({ numero: mesa.numero, capacidade: mesa.capacidade });
    } else {
      setEditingMesa(null);
      setMesaFormData({ numero: "", capacidade: 4 });
    }
    setMesaDialogOpen(true);
  };

  const handleMesaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mesaFormData.numero.trim()) {
      toast.error("Número da mesa é obrigatório.");
      return;
    }

    if (editingMesa) {
      const result = localMesas.update(editingMesa.id, {
        numero: mesaFormData.numero,
        capacidade: mesaFormData.capacidade,
      });
      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar mesa");
      } else {
        toast.success("Mesa atualizada com sucesso!");
        setMesaDialogOpen(false);
        loadMesas();
      }
    } else {
      const result = localMesas.create({
        numero: mesaFormData.numero,
        capacidade: mesaFormData.capacidade,
        ativa: true,
      });
      if (!result.success) {
        toast.error(result.error || "Erro ao criar mesa");
      } else {
        toast.success("Mesa criada com sucesso!");
        setMesaDialogOpen(false);
        loadMesas();
      }
    }
  };

  const handleDeleteMesa = (id: string) => {
    setConfirmDialogData({
      title: "Remover Mesa",
      message: "Tem certeza que deseja remover esta mesa?",
      onConfirm: () => {
        const result = localMesas.delete(id);
        if (!result.success) {
          toast.error(result.error || "Erro ao remover mesa");
        } else {
          toast.success("Mesa removida com sucesso!");
          loadMesas();
        }
        setConfirmDialogOpen(false);
        setConfirmDialogData(null);
      }
    });
    setConfirmDialogOpen(true);
  };

  const handleToggleMesaAtiva = (id: string) => {
    const result = localMesas.toggleAtiva(id);
    if (!result.success) {
      toast.error(result.error || "Erro ao ativar/desativar mesa");
    } else {
      const mesa = result.data;
      toast.success(`Mesa ${mesa?.ativa ? 'ativada' : 'desativada'} com sucesso!`);
      loadMesas();
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary">
            Gestão do Restaurante
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {hoje}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "mesas" ? "default" : "outline"}
              onClick={() => setViewMode("mesas")}
              className="flex-1 sm:flex-none"
            >
              <Table className="mr-2 h-4 w-4" />
              Mesas
            </Button>
            <Button
              variant={viewMode === "pedidos" ? "default" : "outline"}
              onClick={() => setViewMode("pedidos")}
              className="flex-1 sm:flex-none"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Pedidos
            </Button>
          </div>
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Comanda
        </Button>
        </div>
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

      {/* Visualização de Mesas */}
      {viewMode === "mesas" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mesas do Restaurante</h3>
            <Button onClick={() => handleOpenMesaDialog()} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Mesa
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {mesas.map((mesa) => {
              const pedidosNaMesa = localMesas.getPedidosAtivos(mesa.id);
              const temPedidos = pedidosNaMesa.length > 0;
              
              return (
                <Card
                  key={mesa.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    !mesa.ativa ? 'opacity-50' : ''
                  } ${
                    temPedidos ? 'border-primary border-2' : ''
                  }`}
                  onClick={() => handleMesaClick(mesa)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Table className={`h-8 w-8 ${temPedidos ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-center">
                        <p className="font-bold text-lg">Mesa {mesa.numero}</p>
                        <p className="text-xs text-muted-foreground">
                          {mesa.capacidade} {mesa.capacidade === 1 ? 'pessoa' : 'pessoas'}
                        </p>
                        {temPedidos && (
                          <p className="text-xs text-primary font-medium mt-1">
                            {pedidosNaMesa.length} {pedidosNaMesa.length === 1 ? 'pedido' : 'pedidos'}
                          </p>
                        )}
                        {!mesa.ativa && (
                          <p className="text-xs text-destructive font-medium mt-1">
                            Desabilitada
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 mt-3 justify-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMesaDialog(mesa);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMesaAtiva(mesa.id);
                        }}
                        className="h-7 w-7 p-0"
                        title={mesa.ativa ? "Desabilitar mesa" : "Habilitar mesa"}
                      >
                        {mesa.ativa ? (
                          <PowerOff className="h-3 w-3" />
                        ) : (
                          <Power className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMesa(mesa.id);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        disabled={temPedidos}
                        title={temPedidos ? "Não é possível excluir mesa com pedidos" : "Excluir mesa"}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog de ações da mesa */}
      <Dialog 
        open={mesaAcoesDialogOpen && !dialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setMesaAcoesDialogOpen(false);
            setMesaSelecionada(null);
          } else if (!dialogOpen) {
            setMesaAcoesDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Mesa {mesaSelecionada?.numero}
            </DialogTitle>
            <DialogDescription>
              Escolha uma ação para esta mesa
            </DialogDescription>
          </DialogHeader>

          {mesaSelecionada && (
            <div className="space-y-4">
              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Capacidade</p>
                <p className="font-medium">
                  {mesaSelecionada.capacidade} {mesaSelecionada.capacidade === 1 ? 'pessoa' : 'pessoas'}
                </p>
              </div>

              {(() => {
                const pedidosNaMesa = localMesas.getPedidosAtivos(mesaSelecionada.id);
                const temComanda = pedidosNaMesa.length > 0;
                // Ordenar por data/hora e usar o pedido mais recente
                const pedidosOrdenados = temComanda ? [...pedidosNaMesa].sort((a, b) => {
                  if (a.data !== b.data) {
                    return b.data.localeCompare(a.data);
                  }
                  return b.hora.localeCompare(a.hora);
                }) : [];
                const pedidoAtivo = pedidosOrdenados.length > 0 ? pedidosOrdenados[0] : null;

                return (
                  <>
                    {temComanda && pedidoAtivo && (
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground mb-2">Comanda Ativa</p>
                        <p className="font-medium">{pedidoAtivo.nomeCliente}</p>
                        <p className="text-sm text-muted-foreground">
                          {pedidoAtivo.itens.length} {pedidoAtivo.itens.length === 1 ? 'item' : 'itens'} • Total: €{pedidoAtivo.total.toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {!temComanda ? (
                        <Button
                          onClick={handleAbrirComanda}
                          className="w-full"
                          size="lg"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Abrir Comanda
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={handleAdicionarItens}
                            className="w-full"
                            size="lg"
                            variant="default"
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Adicionar Itens
                          </Button>
                          <Button
                            onClick={() => {
                              if (pedidoAtivo) {
                                handleAbrirDialogFinalizacao(pedidoAtivo);
                                setMesaAcoesDialogOpen(false);
                              }
                            }}
                            className="w-full"
                            size="lg"
                            variant="outline"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Finalizar Comanda
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setMesaAcoesDialogOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de pedidos */}
      {viewMode === "pedidos" && (
        <Tabs value={pedidoStatusTab} onValueChange={(v) => setPedidoStatusTab(v as "abertas" | "pendentes" | "finalizadas")} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="abertas">Abertas ({getPedidosPorStatus('aberta').length})</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes ({getPedidosPorStatus('pendente').length})</TabsTrigger>
            <TabsTrigger value="finalizadas">Finalizadas ({getPedidosPorStatus('finalizada').length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="abertas" className="mt-4">
            {getPedidosPorStatus('aberta').length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma comanda aberta</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
                {getPedidosPorStatus('aberta').map((pedido) => (
            <Card key={pedido.id} className="shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{pedido.nomeCliente}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pedido.hora} • {pedido.itens.length} {pedido.itens.length === 1 ? 'prato' : 'pratos'}
                            {pedido.mesaId && (
                              <> • Mesa {mesas.find(m => m.id === pedido.mesaId)?.numero || pedido.mesaId}</>
                            )}
                    </p>
                  </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditarPedido(pedido)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAbrirDialogFinalizacao(pedido)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Finalizar
                          </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(pedido.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                        </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {pedido.itens.map((item, index) => (
                    <div
                      key={index}
                            className="text-sm py-2 border-b last:border-0"
                    >
                            <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-muted-foreground">
                          {item.quantidade}x €{item.preco.toFixed(2)}
                        </p>
                                {item.observacoes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Obs: {item.observacoes}
                                  </p>
                                )}
                      </div>
                      <p className="font-semibold">
                        €{(item.preco * item.quantidade).toFixed(2)}
                      </p>
                            </div>
                    </div>
                  ))}
                </div>
                      
                      {pedido.observacoes && (
                        <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-primary/20">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Observações da Comanda:</p>
                          <p className="text-sm">{pedido.observacoes}</p>
                        </div>
                      )}
                
                <div className="space-y-1 pt-4 border-t">
                        <div className="flex justify-between text-lg font-bold text-primary">
                          <span>Total:</span>
                          <span>€{pedido.total.toFixed(2)}</span>
                  </div>
                  </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pendentes" className="mt-4">
            {getPedidosPorStatus('pendente').length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma comanda pendente de finalização</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {getPedidosPorStatus('pendente').map((pedido) => (
                  <Card key={pedido.id} className="shadow-soft">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{pedido.nomeCliente}</CardTitle>
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              Pendente
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {pedido.hora} • {pedido.itens.length} {pedido.itens.length === 1 ? 'prato' : 'pratos'}
                            {pedido.mesaId && (
                              <> • Mesa {mesas.find(m => m.id === pedido.mesaId)?.numero || pedido.mesaId}</>
                            )}
                            {pedido.formaPagamento && (
                              <> • {pedido.formaPagamento}</>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReabrirComanda(pedido.id)}
                            title="Reabrir comanda (voltar para aberta)"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reabrir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditarPedido(pedido)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAbrirDialogFinalizacao(pedido)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Finalizar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(pedido.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {pedido.itens.map((item, index) => (
                          <div
                            key={index}
                            className="text-sm py-2 border-b last:border-0"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium">{item.nome}</p>
                                <p className="text-muted-foreground">
                                  {item.quantidade}x €{item.preco.toFixed(2)}
                                </p>
                                {item.observacoes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Obs: {item.observacoes}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold">
                                €{(item.preco * item.quantidade).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {pedido.observacoes && (
                        <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-primary/20">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Observações da Comanda:</p>
                          <p className="text-sm">{pedido.observacoes}</p>
                        </div>
                      )}
                      
                      {pedido.observacoesFinalizacao && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Observações de Finalização:</p>
                          <p className="text-sm">{pedido.observacoesFinalizacao}</p>
                        </div>
                      )}
                      
                      <div className="space-y-1 pt-4 border-t">
                        <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Total:</span>
                    <span>€{pedido.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
            )}
          </TabsContent>
          
          <TabsContent value="finalizadas" className="mt-4">
            {getPedidosPorStatus('finalizada').length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma comanda finalizada hoje</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {getPedidosPorStatus('finalizada').map((pedido) => (
                  <Card key={pedido.id} className="shadow-soft">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{pedido.nomeCliente}</CardTitle>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Finalizada
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {pedido.hora} • {pedido.itens.length} {pedido.itens.length === 1 ? 'prato' : 'pratos'}
                            {pedido.mesaId && (
                              <> • Mesa {mesas.find(m => m.id === pedido.mesaId)?.numero || pedido.mesaId}</>
                            )}
                            {pedido.formaPagamento && (
                              <> • {pedido.formaPagamento}</>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {pedido.itens.map((item, index) => (
                          <div
                            key={index}
                            className="text-sm py-2 border-b last:border-0"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium">{item.nome}</p>
                                <p className="text-muted-foreground">
                                  {item.quantidade}x €{item.preco.toFixed(2)}
                                </p>
                                {item.observacoes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Obs: {item.observacoes}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold">
                                €{(item.preco * item.quantidade).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {pedido.observacoes && (
                        <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-primary/20">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Observações da Comanda:</p>
                          <p className="text-sm">{pedido.observacoes}</p>
                        </div>
                      )}
                      
                      {pedido.observacoesFinalizacao && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Observações de Finalização:</p>
                          <p className="text-sm">{pedido.observacoesFinalizacao}</p>
                        </div>
                      )}
                      
                      <div className="space-y-1 pt-4 border-t">
                        <div className="flex justify-between text-lg font-bold text-primary">
                          <span>Total:</span>
                          <span>€{pedido.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog para criar nova comanda */}
      <Dialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Limpar estados quando o dialog é fechado
            setNomeCliente("");
            setMesaId(null);
            setMesaPreSelecionada(false);
            setItensPedido([]);
            setSelectedItems(new Set());
            setEditingPedidoId(null);
          }
          setDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden p-0 sm:p-6 flex flex-col">
          <div className="p-4 sm:p-6 pb-0 sm:pb-0">
          <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingPedidoId ? "Adicionar Itens à Comanda" : "Nova Comanda"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingPedidoId 
                  ? "Adicione novos itens à comanda existente" 
                  : "Preencha os dados do cliente e selecione os pratos do pedido"}
              </DialogDescription>
          </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 sm:px-6 pb-4 space-y-4 overflow-y-auto flex-1">
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
              <Label htmlFor="mesa">
                Mesa {mesaPreSelecionada ? "(pré-selecionada)" : "(opcional)"}
              </Label>
              <Select
                value={mesaId || undefined}
                onValueChange={(value) => {
                  if (value === "none") {
                    setMesaId(null);
                  } else {
                    setMesaId(value || null);
                  }
                }}
                disabled={mesaPreSelecionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma mesa" />
                </SelectTrigger>
                <SelectContent>
                  {!mesaPreSelecionada && (
                    <SelectItem value="none">Sem mesa</SelectItem>
                  )}
                  {mesas.filter(m => m.ativa).map((mesa) => (
                    <SelectItem key={mesa.id} value={mesa.id}>
                      Mesa {mesa.numero} ({mesa.capacidade} {mesa.capacidade === 1 ? 'pessoa' : 'pessoas'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mesaId && (() => {
                const mesaSelecionada = mesas.find(m => m.id === mesaId);
                if (mesaSelecionada) {
                  const pedidosNaMesa = localMesas.getPedidosAtivos(mesaId);
                  return (
                    <div className="mt-2 p-3 bg-accent/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Mesa {mesaSelecionada.numero}</p>
                          <p className="text-xs text-muted-foreground">
                            Capacidade: {mesaSelecionada.capacidade} {mesaSelecionada.capacidade === 1 ? 'pessoa' : 'pessoas'}
                            {pedidosNaMesa.length > 0 && (
                              <> • {pedidosNaMesa.length} {pedidosNaMesa.length === 1 ? 'pedido ativo' : 'pedidos ativos'}</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              </div>

            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <Label className="text-base font-semibold">Selecionar Pratos</Label>
                {menuItems.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedItems.size === menuItems.length && menuItems.length > 0}
                      onCheckedChange={handleToggleAll}
                    />
                    <Label
                      htmlFor="select-all"
                      className="text-xs sm:text-sm font-normal cursor-pointer"
                    >
                      Marcar todos
                    </Label>
                  </div>
                )}
              </div>

              {menuItems.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum prato disponível na ementa
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicione pratos na aba "Ementa" primeiro
                  </p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-1 sm:pr-2 -mr-1 sm:mr-0">
                  {sections.map((section) => {
                    // Filtrar pratos desta seção
                    const pratosDaSecao = menuItems.filter(item => item.secao === section.nome);
                    
                    // Se não houver pratos nesta seção, não renderizar
                    if (pratosDaSecao.length === 0) return null;
                    
                    return (
                      <div key={section.id} className="space-y-2">
                        <div className="sticky top-0 bg-background z-10 pb-2 border-b -mx-1 px-1">
                          <h3 className="font-semibold text-base sm:text-lg text-primary">{section.nome}</h3>
                        </div>
                        <div className="space-y-3 pl-2">
                          {pratosDaSecao.map((menuItem) => {
                            const isSelected = selectedItems.has(menuItem.id);
                            const itemPedido = itensPedido.find(item => item.menuItemId === menuItem.id);
                            
                            return (
                              <Card key={menuItem.id} className={`p-3 sm:p-4 ${isSelected ? 'border-primary' : ''}`}>
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
                                  <div className="flex items-center space-x-2 sm:space-x-3 pt-1 w-full sm:w-auto">
                                    <Checkbox
                                      id={`item-${menuItem.id}`}
                                      checked={isSelected}
                                      onCheckedChange={(checked) => 
                                        handleToggleItem(menuItem.id, checked as boolean)
                                      }
                                    />
                                    <Label
                                      htmlFor={`item-${menuItem.id}`}
                                      className="cursor-pointer flex-1"
                                    >
                                      <div>
                                        <p className="font-medium text-sm sm:text-base">{menuItem.nome}</p>
                                        {menuItem.descricao && (
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {menuItem.descricao}
                                          </p>
                                        )}
                                        <p className="text-sm text-muted-foreground mt-1">
                                          €{menuItem.preco.toFixed(2)}
                                        </p>
                                      </div>
                                    </Label>
                                  </div>
                                  
                                  {isSelected && itemPedido && (
                                    <div className="w-full space-y-2">
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto sm:ml-auto">
                                        <Label htmlFor={`qtd-${menuItem.id}`} className="text-xs sm:text-sm whitespace-nowrap">
                              Quantidade:
                            </Label>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Input
                                            id={`qtd-${menuItem.id}`}
                              type="number"
                              min="1"
                                            value={itemPedido.quantidade}
                              onChange={(e) =>
                                              handleUpdateItem(menuItem.id, {
                                  quantidade: parseInt(e.target.value) || 1,
                                })
                              }
                                            className="w-20 sm:w-20"
                            />
                                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                            = €{(itemPedido.preco * itemPedido.quantidade).toFixed(2)}
                            </span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveItem(itemPedido.tempId)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                          </div>
                        </div>
                                      <div className="w-full">
                                        <Textarea
                                          id={`obs-${menuItem.id}`}
                                          placeholder="Observações do item (opcional)"
                                          value={itemPedido.observacoes || ""}
                                          onChange={(e) =>
                                            handleUpdateItem(menuItem.id, {
                                              observacoes: e.target.value || null,
                                            })
                                          }
                                          className="min-h-[60px] text-xs"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Pratos sem seção (caso existam) */}
                  {(() => {
                    const pratosSemSecao = menuItems.filter(item => {
                      const secaoExiste = sections.some(s => s.nome === item.secao);
                      return !secaoExiste;
                    });
                    
                    if (pratosSemSecao.length === 0) return null;
                    
                    return (
                      <div className="space-y-2">
                        <div className="sticky top-0 bg-background z-10 pb-2 border-b -mx-1 px-1">
                          <h3 className="font-semibold text-base sm:text-lg text-muted-foreground">Outros</h3>
                        </div>
                        <div className="space-y-3 pl-2">
                          {pratosSemSecao.map((menuItem) => {
                            const isSelected = selectedItems.has(menuItem.id);
                            const itemPedido = itensPedido.find(item => item.menuItemId === menuItem.id);
                            
                            return (
                              <Card key={menuItem.id} className={`p-3 sm:p-4 ${isSelected ? 'border-primary' : ''}`}>
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
                                  <div className="flex items-center space-x-2 sm:space-x-3 pt-1 w-full sm:w-auto">
                                    <Checkbox
                                      id={`item-${menuItem.id}`}
                                      checked={isSelected}
                                      onCheckedChange={(checked) => 
                                        handleToggleItem(menuItem.id, checked as boolean)
                                      }
                                    />
                                    <Label
                                      htmlFor={`item-${menuItem.id}`}
                                      className="cursor-pointer flex-1"
                                    >
                                      <div>
                                        <p className="font-medium text-sm sm:text-base">{menuItem.nome}</p>
                                        {menuItem.descricao && (
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {menuItem.descricao}
                                          </p>
                                        )}
                                        <p className="text-sm text-muted-foreground mt-1">
                                          €{menuItem.preco.toFixed(2)}
                                        </p>
                                      </div>
                                    </Label>
                                  </div>
                                  
                                  {isSelected && itemPedido && (
                                    <div className="w-full space-y-2">
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto sm:ml-auto">
                                        <Label htmlFor={`qtd-${menuItem.id}`} className="text-xs sm:text-sm whitespace-nowrap">
                                          Quantidade:
                                        </Label>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                          <Input
                                            id={`qtd-${menuItem.id}`}
                                            type="number"
                                            min="1"
                                            value={itemPedido.quantidade}
                                            onChange={(e) =>
                                              handleUpdateItem(menuItem.id, {
                                                quantidade: parseInt(e.target.value) || 1,
                                              })
                                            }
                                            className="w-20 sm:w-20"
                                          />
                                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                            = €{(itemPedido.preco * itemPedido.quantidade).toFixed(2)}
                                          </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                                            onClick={() => handleRemoveItem(itemPedido.tempId)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                                        </div>
                                      </div>
                                      <div className="w-full">
                                        <Textarea
                                          id={`obs-${menuItem.id}`}
                                          placeholder="Observações do item (opcional)"
                                          value={itemPedido.observacoes || ""}
                                          onChange={(e) =>
                                            handleUpdateItem(menuItem.id, {
                                              observacoes: e.target.value || null,
                                            })
                                          }
                                          className="min-h-[60px] text-xs"
                                        />
                                      </div>
                                    </div>
                                  )}
                      </div>
                    </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            </div>
            
            {itensPedido.length > 0 && (() => {
              const totais = calcularTotal();
              return (
                <div className="px-4 sm:px-6 pt-4 border-t bg-background">
                  <Card className="p-3 sm:p-4 bg-accent/5 border-0 shadow-none">
                <div className="space-y-2">
                      <div className="flex justify-between text-base sm:text-lg font-bold text-primary">
                    <span>Total:</span>
                    <span>€{totais.total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
                </div>
              );
            })()}

            <div className="px-4 sm:px-6 py-4 border-t bg-background flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto flex-1 order-1 sm:order-2" 
                disabled={itensPedido.length === 0}
              >
                {editingPedidoId ? "Atualizar Comanda" : "Criar Comanda"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de finalização */}
      <Dialog open={finalizarDialogOpen} onOpenChange={setFinalizarDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Finalizar Comanda</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {pedidoParaFinalizar && (
                <>Comanda de {pedidoParaFinalizar.nomeCliente} • Total: €{pedidoParaFinalizar.total.toFixed(2)}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {pedidoParaFinalizar && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="formaPagamentoFinalizacao" className="text-sm">Forma de Pagamento *</Label>
                <Select
                  value={formaPagamentoFinalizacao ? formaPagamentoFinalizacao : undefined}
                  onValueChange={(value) => setFormaPagamentoFinalizacao(value)}
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="MB Way">MB Way</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="observacoesFinalizacao" className="text-sm">Observações de Finalização (opcional)</Label>
                <Textarea
                  id="observacoesFinalizacao"
                  placeholder="Detalhes sobre a finalização..."
                  value={observacoesFinalizacao}
                  onChange={(e) => setObservacoesFinalizacao(e.target.value)}
                  className="min-h-[80px] mt-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="default"
                  onClick={handleMarcarPendente}
                  className="w-full"
                  disabled={!formaPagamentoFinalizacao || formaPagamentoFinalizacao.trim() === ""}
                >
                  Marcar como Pendente
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleFinalizarComanda}
                  className="w-full"
                  disabled={pedidoParaFinalizar?.status === 'aberta' && (!formaPagamentoFinalizacao || formaPagamentoFinalizacao.trim() === "")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Comanda
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFinalizarDialogOpen(false);
                    setPedidoParaFinalizar(null);
                    setFormaPagamentoFinalizacao("");
                    setObservacoesFinalizacao("");
                  }}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação */}
      <Dialog 
        open={confirmDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialogOpen(false);
            setConfirmDialogData(null);
          }
        }}
      >
        <DialogContent className="max-w-[90vw] sm:max-w-md p-4 sm:p-6 z-[60]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{confirmDialogData?.title || "Confirmar"}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base pt-2">
              {confirmDialogData?.message || ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setConfirmDialogData(null);
              }}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirmDialogData?.onConfirm) {
                  confirmDialogData.onConfirm();
                }
              }}
              className="w-full sm:w-auto flex-1 order-1 sm:order-2"
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerenciar mesas */}
      <Dialog open={mesaDialogOpen} onOpenChange={setMesaDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingMesa ? "Editar Mesa" : "Nova Mesa"}
            </DialogTitle>
            <DialogDescription>
              {editingMesa ? "Altere os dados da mesa" : "Adicione uma nova mesa ao restaurante"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMesaSubmit} className="space-y-4">
            <div>
              <Label htmlFor="mesaNumero">Número da Mesa</Label>
              <Input
                id="mesaNumero"
                value={mesaFormData.numero}
                onChange={(e) => setMesaFormData({ ...mesaFormData, numero: e.target.value })}
                placeholder="Ex: 1, A1, Varanda 1"
                required
              />
            </div>

            <div>
              <Label htmlFor="mesaCapacidade">Capacidade (pessoas)</Label>
              <Input
                id="mesaCapacidade"
                type="number"
                min="1"
                value={mesaFormData.capacidade}
                onChange={(e) => setMesaFormData({ ...mesaFormData, capacidade: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMesaDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingMesa ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

