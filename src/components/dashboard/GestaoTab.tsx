import { useEffect, useState, useCallback } from "react";
import { Pedido, ItemPedido, MenuItem, Mesa, MenuSection, StatusPedido } from "@/lib/localStorage";
import { api } from "@/lib/api";
import { localAuth } from "@/lib/localAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Receipt, Table, Power, PowerOff, Pencil, ShoppingCart, CheckCircle, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const GestaoTab = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [horaAtual, setHoraAtual] = useState<string>("");
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
  const [reservaSelecionada, setReservaSelecionada] = useState<string | null>(null);
  const [reservasDoDia, setReservasDoDia] = useState<any[]>([]);
  const [carregandoReservas, setCarregandoReservas] = useState(false);
  const [abaComanda, setAbaComanda] = useState<"manual" | "reserva">("manual");
  const [dataSelecionada, setDataSelecionada] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [historicoDias, setHistoricoDias] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [diaSelecionadoHistorico, setDiaSelecionadoHistorico] = useState<Date | undefined>(undefined);
  const [diasComVendas, setDiasComVendas] = useState<Set<string>>(new Set());

  const loadMesas = useCallback(async () => {
    try {
      // Tentar carregar da API primeiro
      const mesasData = await api.getMesas();
      console.log('[GESTAO] Mesas carregadas da API:', mesasData);
      // Converter formato da API para o formato esperado
      const mesasFormatadas = mesasData.map((mesa: any) => {
        // Garantir que capacidade é um número
        const capacidade = typeof mesa.capacidade === 'number' 
          ? mesa.capacidade 
          : parseInt(mesa.capacidade) || 1;
        
        console.log('[GESTAO] Mesa formatada:', {
          id: mesa.id,
          numero: mesa.numero,
          capacidadeOriginal: mesa.capacidade,
          capacidadeFormatada: capacidade,
          tipo: typeof mesa.capacidade
        });
        
        return {
          id: mesa.id,
          numero: mesa.numero,
          capacidade: capacidade,
          ativa: mesa.ativa === true || mesa.ativa === 1,
          created_at: mesa.created_at,
          updated_at: mesa.updated_at,
        };
      });
      console.log('[GESTAO] Mesas formatadas finais:', mesasFormatadas);
      setMesas(mesasFormatadas);
      } catch (error) {
      console.error('Erro ao carregar mesas da API:', error);
      toast.error('Erro ao carregar mesas');
      setMesas([]);
    }
  }, []);

  // Atualizar horário atual a cada segundo
  useEffect(() => {
    const atualizarHora = () => {
      const agora = new Date();
      const hora = String(agora.getHours()).padStart(2, '0');
      const minuto = String(agora.getMinutes()).padStart(2, '0');
      const segundo = String(agora.getSeconds()).padStart(2, '0');
      setHoraAtual(`${hora}:${minuto}:${segundo}`);
    };
    
    atualizarHora(); // Atualizar imediatamente
    const interval = setInterval(atualizarHora, 1000); // Atualizar a cada segundo
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        // Carregar tudo (ementa combina localStorage + API, resto só API)
        await Promise.all([
          loadMenuItems(), // Combina localStorage + API
          loadSections(), // Combina localStorage + API
          loadPedidos(),
          loadMesas(),
          loadReservasDoDia(dataSelecionada)
        ]);
      } catch (error) {
        console.error('[GESTAO] Erro ao inicializar:', error);
        toast.error('Erro ao carregar dados iniciais');
      } finally {
        setLoading(false);
      }
    };
    initialize();
    
    // Verificar e cancelar comandas de reserva antigas sem itens (2 minutos)
    const cancelarComandasAntigas = async () => {
      try {
        const result = await api.cancelarComandasAntigas();
        if (result.success && result.canceladas > 0) {
          console.log(`${result.canceladas} comanda(s) de reserva cancelada(s) automaticamente por inatividade`);
          loadPedidos(); // Recarregar pedidos após cancelamento
        }
      } catch (error) {
        console.error('Erro ao cancelar comandas antigas:', error);
      }
    };

    // Verificar e criar comandas automáticas para reservas confirmadas
    const verificarComandasAutomaticas = async () => {
      try {
        // Buscar reservas confirmadas do banco de dados
        const reservasData = await api.getReservas();
        const hoje = new Date().toISOString().split('T')[0];
        const agora = new Date();
        const horaAtualStr = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
        const [horaAtualNum, minutoAtualNum] = horaAtualStr.split(':').map(Number);
        const horaAtualMinutos = horaAtualNum * 60 + minutoAtualNum;
        
        const reservasConfirmadas = reservasData.filter((r: any) => 
          (r.estado === 'aguardando_cliente' || r.estado === 'confirmado_cliente' || r.estado === 'cliente_na_mesa') && 
          r.mesa_id && 
          r.data_reserva === hoje
        );

        console.log(`[AUTO] Verificando ${reservasConfirmadas.length} reservas confirmadas para hoje`);

        // Buscar pedidos existentes da API
        const pedidos = await api.getPedidos(hoje);

        for (const reserva of reservasConfirmadas) {
          if (!reserva.mesa_id) {
            console.log(`[AUTO] Reserva ${reserva.id} não tem mesa_id, pulando`);
            continue;
          }

          // Verificar se já existe comanda para esta reserva (incluindo finalizadas)
          const jaTemComanda = pedidos.some((p: any) => {
            const temIdReserva = p.reservaId === reserva.id;
            const temIdNaObservacao = p.observacoes?.includes(`ID: ${reserva.id}`);
            const observacaoReserva = `Comanda aberta automaticamente para reserva confirmada (ID: ${reserva.id}`;
            return temIdReserva || temIdNaObservacao || p.observacoes?.includes(observacaoReserva);
          });

          if (jaTemComanda) {
            console.log(`[AUTO] Comanda já existe para reserva ${reserva.id}, pulando`);
            continue;
          }

          // Verificar se chegou a hora exata da reserva (ou até 5 minutos antes)
          const [horaReserva, minutoReserva] = reserva.hora_reserva.split(':').map(Number);
          const horaReservaMinutos = horaReserva * 60 + minutoReserva;
          
          console.log(`[AUTO] Reserva ${reserva.id}: Hora reserva ${horaReserva}:${String(minutoReserva).padStart(2, '0')} (${horaReservaMinutos} min), Hora atual ${horaAtualStr} (${horaAtualMinutos} min)`);
          
          // Criar comanda apenas quando chegar o horário exato da reserva ou depois
          if (horaAtualMinutos >= horaReservaMinutos) {
            // Verificar se a mesa não está ocupada
            try {
              const pedidosAtivosNaMesa = await api.getPedidosAtivosMesa(reserva.mesa_id);
              if (pedidosAtivosNaMesa.length === 0) {
                // Criar comanda automaticamente via API
                try {
                  const result = await api.createPedido({
                    nomeCliente: `${reserva.nome} ${reserva.apelido}`,
                    mesaId: reserva.mesa_id,
                    reservaId: reserva.id,
                    itens: [],
                    observacoes: `Comanda aberta automaticamente para reserva confirmada (ID: ${reserva.id}, ${reserva.data_reserva} às ${reserva.hora_reserva}). Cliente: ${reserva.nome} ${reserva.apelido}`,
                  });

                  if (result.success) {
                    console.log(`[AUTO] ✅ Comanda criada automaticamente para reserva ${reserva.id} - Cliente: ${reserva.nome} ${reserva.apelido} - Mesa: ${reserva.mesa_id}`);
                    loadPedidos(); // Recarregar pedidos
                  } else {
                    console.error(`[AUTO] ❌ Erro ao criar comanda para reserva ${reserva.id}:`, result.error);
                  }
                } catch (error) {
                  console.error(`[AUTO] ❌ Erro ao criar comanda para reserva ${reserva.id}:`, error);
                }
              } else {
                console.log(`[AUTO] Mesa ${reserva.mesa_id} já está ocupada (${pedidosAtivosNaMesa.length} comanda(s) ativa(s)), não criando comanda para reserva ${reserva.id}`);
              }
            } catch (error) {
              console.error(`[AUTO] Erro ao verificar pedidos ativos da mesa ${reserva.mesa_id}:`, error);
            }
          } else {
            const diferencaMinutos = horaAtualMinutos - horaReservaMinutos;
            if (diferencaMinutos < -5) {
              console.log(`[AUTO] Reserva ${reserva.id} ainda não chegou a hora (faltam ${Math.abs(diferencaMinutos)} minutos)`);
            } else {
              console.log(`[AUTO] Reserva ${reserva.id} já passou do prazo (${diferencaMinutos} minutos depois)`);
            }
          }
        }
      } catch (error) {
        console.error('[AUTO] Erro ao verificar comandas automáticas:', error);
      }
    };

    // Verificar imediatamente ao carregar
    cancelarComandasAntigas();
    verificarComandasAutomaticas();

    // Atualizar mesas a cada 30 segundos
    const mesasUpdateInterval = setInterval(() => {
      loadMesas();
    }, 30000);

    // Atualizar reservas do dia a cada 30 segundos
    const reservasDoDiaInterval = setInterval(() => {
      loadReservasDoDia(dataSelecionada);
    }, 30000);

    // Verificar comandas automáticas a cada 30 segundos
    const comandaAutoInterval = setInterval(() => {
      verificarComandasAutomaticas();
    }, 30000);

    // Verificar e cancelar comandas antigas a cada 30 segundos
    const comandaCheckInterval = setInterval(() => {
      cancelarComandasAntigas();
    }, 30000);
    
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
          clearInterval(mesasUpdateInterval);
          clearInterval(reservasDoDiaInterval);
          clearInterval(comandaAutoInterval);
          clearInterval(comandaCheckInterval);
          window.removeEventListener('localStorageChange', handleStorageChange);
        };
  }, [loadMesas]);

  const loadPedidos = async () => {
    try {
      // Obter apenas pedidos do dia atual da API
      const hoje = new Date().toISOString().split('T')[0];
      const pedidosDoDia = await api.getPedidos(hoje);
      // Ordenar por hora (mais recente primeiro)
      const sorted = pedidosDoDia.sort((a: any, b: any) => {
        if (a.hora !== b.hora) {
          return b.hora.localeCompare(a.hora);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setPedidos(sorted);
    } catch (error) {
      console.error('Erro ao carregar pedidos da API:', error);
      toast.error('Erro ao carregar pedidos');
      setPedidos([]);
    }
  };
  
  const getPedidosPorStatus = (status: StatusPedido) => {
    return pedidos.filter(p => p.status === status);
  };

  const loadMenuItems = async () => {
    try {
      // Carregar dados apenas do banco de dados (API) - apenas ativos
      const apiData = await api.getEmentaAtivos();
      
      // Processar dados da API
      const processedItems = apiData.map((item: any) => ({
        ...item,
        preco: typeof item.preco === 'string' ? parseFloat(item.preco) : item.preco,
      }));
      
      setMenuItems(processedItems);
      
      // Remover itens selecionados que não existem mais na ementa
      const itemIds = new Set(processedItems.map((item: any) => item.id));
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
    } catch (error) {
      console.error('Erro ao carregar itens do menu:', error);
      toast.error('Erro ao carregar itens do menu');
      setMenuItems([]);
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
    } catch (error) {
      console.error('Erro ao carregar seções:', error);
      toast.error('Erro ao carregar seções');
      setSections([]);
    }
  };

  const loadReservasDoDia = async (data?: string) => {
    setCarregandoReservas(true);
    try {
      const dataParaBuscar = data || dataSelecionada;
      const todasReservas = await api.getReservas();
      // Mostrar TODAS as reservas do dia selecionado (não apenas confirmadas)
      const reservasDoDiaSelecionado = todasReservas.filter((r: any) => {
        const dataReservaNormalizada = r.data_reserva.split('T')[0];
        return dataReservaNormalizada === dataParaBuscar;
      });
      
      // Ordenar por hora
      reservasDoDiaSelecionado.sort((a: any, b: any) => {
        return a.hora_reserva.localeCompare(b.hora_reserva);
      });
      
      setReservasDoDia(reservasDoDiaSelecionado);
      console.log(`[GESTAO] Carregadas ${reservasDoDiaSelecionado.length} reservas para ${dataParaBuscar}`);
    } catch (error) {
      console.error('Erro ao carregar reservas do dia:', error);
      toast.error('Erro ao carregar reservas');
    } finally {
      setCarregandoReservas(false);
    }
  };

  const loadHistorico = async () => {
    setCarregandoHistorico(true);
    try {
      // Buscar todos os pedidos do histórico
      const todosPedidos = await api.getPedidosHistorico();
      
      // Buscar todas as reservas
      const todasReservas = await api.getReservas();
      
      // Agrupar por data
      const diasMap = new Map<string, {
        data: string;
        pedidos: any[];
        reservas: any[];
        totalVendas: number;
        totalReservas: number;
        totalConfirmadas: number;
      }>();
      
      // Processar pedidos
      todosPedidos.forEach((pedido: any) => {
        const data = pedido.data;
        if (!diasMap.has(data)) {
          diasMap.set(data, {
            data,
            pedidos: [],
            reservas: [],
            totalVendas: 0,
            totalReservas: 0,
            totalConfirmadas: 0,
          });
        }
        const dia = diasMap.get(data)!;
        dia.pedidos.push(pedido);
        dia.totalVendas += pedido.total || 0;
      });
      
      // Processar reservas
      todasReservas.forEach((reserva: any) => {
        const dataReservaNormalizada = reserva.data_reserva.split('T')[0];
        if (!diasMap.has(dataReservaNormalizada)) {
          diasMap.set(dataReservaNormalizada, {
            data: dataReservaNormalizada,
            pedidos: [],
            reservas: [],
            totalVendas: 0,
            totalReservas: 0,
            totalConfirmadas: 0,
          });
        }
        const dia = diasMap.get(dataReservaNormalizada)!;
        dia.reservas.push(reserva);
        dia.totalReservas += 1;
        if (reserva.estado === 'confirmado_cliente' || reserva.estado === 'aguardando_cliente' || reserva.estado === 'cliente_na_mesa') {
          dia.totalConfirmadas += 1;
        }
      });
      
      // Converter para array e ordenar por data (mais recente primeiro)
      const diasArray = Array.from(diasMap.values()).sort((a, b) => 
        b.data.localeCompare(a.data)
      );
      
      // Criar Set com todas as datas que têm vendas ou reservas
      const diasComVendasSet = new Set<string>();
      diasArray.forEach(dia => {
        if (dia.totalVendas > 0 || dia.totalReservas > 0) {
          diasComVendasSet.add(dia.data);
        }
      });
      
      setDiasComVendas(diasComVendasSet);
      setHistoricoDias(diasArray);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const handleSelecionarReserva = (reservaId: string) => {
    const reserva = reservasDoDia.find(r => r.id === reservaId);
    if (reserva) {
      setReservaSelecionada(reservaId);
      setNomeCliente(`${reserva.nome} ${reserva.apelido}`);
      if (reserva.mesa_id && !mesaPreSelecionada) {
        setMesaId(reserva.mesa_id);
      }
      toast.success(`Reserva selecionada: ${reserva.nome} ${reserva.apelido} - ${reserva.hora_reserva}`);
    }
  };

  const handleOpenDialog = (mesaIdParam?: string | null) => {
    setNomeCliente("");
    setMesaId(mesaIdParam || null);
    setMesaPreSelecionada(!!mesaIdParam); // Se veio da mesa, está pré-selecionada
    setItensPedido([]);
    setSelectedItems(new Set());
    setEditingPedidoId(null);
    setReservaSelecionada(null);
    setAbaComanda("manual");
    setObservacoes("");
    loadReservasDoDia(dataSelecionada);
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
    // Verificar permissões - admin e atualizador podem abrir comandas
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem abrir comandas.");
      return;
    }

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
    setReservaSelecionada(null);
    setAbaComanda("manual");
    setObservacoes("");
    loadReservasDoDia(dataSelecionada);
    
    // Abrir diálogo após um pequeno delay para garantir que o estado anterior foi limpo
    setTimeout(() => {
      setDialogOpen(true);
    }, 150);
  };

  const handleEditarPedido = (pedido: Pedido) => {
    // Verificar permissões - admin e atualizador podem editar pedidos
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem editar comandas.");
      return;
    }

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
    setReservaSelecionada(pedido.reservaId || null);
    setAbaComanda(pedido.reservaId ? "reserva" : "manual");
    loadReservasDoDia(dataSelecionada);
    
    // Abrir diálogo
    setDialogOpen(true);
  };

  const handleAdicionarItens = async () => {
    if (!mesaSelecionada) {
      toast.error("Mesa não selecionada");
      return;
    }
    
    try {
      const pedidosNaMesa = await api.getPedidosAtivosMesa(mesaSelecionada.id);
      if (pedidosNaMesa.length === 0) {
        toast.error("Não há comanda ativa para esta mesa");
        return;
      }
      
      // Ordenar por data/hora e usar o pedido mais recente
      const pedidosOrdenados = [...pedidosNaMesa].sort((a: any, b: any) => {
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
      
      // Guardar o ID da mesa antes de limpar o estado
      const mesaIdParaUsar = mesaSelecionada.id;
      
      // Fechar diálogo de ações primeiro
      setMesaAcoesDialogOpen(false);
      setMesaSelecionada(null);
      
      // Usar a função de editar pedido, mas com mesa pré-selecionada
      const itensExistentes = pedidoAtivo.itens.map((item: any) => ({
        ...item,
        tempId: crypto.randomUUID(),
      }));
      const selectedIds = new Set(itensExistentes.map((item: any) => item.menuItemId));
      
      setEditingPedidoId(pedidoAtivo.id);
      setMesaId(mesaIdParaUsar);
      setMesaPreSelecionada(true); // Mesa pré-selecionada, não pode ser alterada
      setNomeCliente(pedidoAtivo.nomeCliente || "");
      setItensPedido(itensExistentes);
      setSelectedItems(selectedIds);
      setObservacoes(pedidoAtivo.observacoes || "");
      
      // Abrir diálogo após um pequeno delay
      setTimeout(() => {
        setDialogOpen(true);
      }, 150);
    } catch (error: any) {
      console.error('Erro ao carregar comanda:', error);
      toast.error(error.message || "Erro ao carregar comanda");
    }
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
    // Verificar permissões - admin e atualizador podem finalizar comandas
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem finalizar comandas.");
      return;
    }

    setPedidoParaFinalizar(pedido);
    setFormaPagamentoFinalizacao(pedido.formaPagamento || "");
    setObservacoesFinalizacao(pedido.observacoesFinalizacao || "");
    setFinalizarDialogOpen(true);
  };

  const handleMarcarPendente = async () => {
    // Verificar permissões - admin e atualizador podem marcar como pendente
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem marcar comandas como pendentes.");
      return;
    }

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

      await api.marcarPedidoPendente(pedidoId, {
        formaPagamento: formaPag,
        observacoesFinalizacao: obsFinalizacao
      });

      toast.success("Comanda marcada como pendente de finalização!");
      
      // Limpar estados e fechar diálogo
      setFinalizarDialogOpen(false);
      setPedidoParaFinalizar(null);
      setFormaPagamentoFinalizacao("");
      setObservacoesFinalizacao("");
      
      // Recarregar pedidos e mudar aba
      await loadPedidos();
      setPedidoStatusTab("pendentes");
    } catch (error: any) {
      console.error("Erro em handleMarcarPendente:", error);
      toast.error(error.message || "Erro ao marcar comanda como pendente");
    }
  };

  const handleFinalizarComanda = () => {
    // Verificar permissões - admin e atualizador podem finalizar comandas
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem finalizar comandas.");
      return;
    }

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
          onConfirm: async () => {
            try {
              // Se ainda não foi marcada como pendente, marcar primeiro
              if (pedidoStatus === 'aberta') {
                try {
                  await api.marcarPedidoPendente(pedidoId, {
                    formaPagamento: formaPag,
                    observacoesFinalizacao: obsFinalizacao
                  });
                } catch (error: any) {
                  toast.error(error.message || "Erro ao processar comanda");
                  setConfirmDialogOpen(false);
                  setConfirmDialogData(null);
                  return;
                }
              }

              try {
                await api.finalizarPedido(pedidoId);
                
                // Se a comanda tem reserva associada, finalizar a reserva também
                if (pedidoParaFinalizar.reservaId) {
                  try {
                    await api.updateReserva(pedidoParaFinalizar.reservaId, {
                      estado: 'finalizado'
                    });
                    toast.success("Comanda e reserva finalizadas com sucesso! Mesa liberada.");
                  } catch (error) {
                    console.error('Erro ao finalizar reserva:', error);
                    toast.success("Comanda finalizada com sucesso! Mesa liberada. (Aviso: Erro ao finalizar reserva)");
                  }
                } else {
                  toast.success("Comanda finalizada com sucesso! Mesa liberada.");
                }

                setConfirmDialogOpen(false);
                setPedidoParaFinalizar(null);
                setFormaPagamentoFinalizacao("");
                setObservacoesFinalizacao("");
                setConfirmDialogData(null);
                
                // Recarregar pedidos e mudar aba
                await loadPedidos();
                setPedidoStatusTab("finalizadas");
              } catch (error: any) {
                toast.error(error.message || "Erro ao finalizar comanda");
                setConfirmDialogOpen(false);
                setConfirmDialogData(null);
                return;
              }
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

  const handleReabrirComanda = async (pedidoId: string) => {
    // Verificar permissões - apenas admin pode reabrir comandas
    const user = localAuth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      toast.error("Acesso negado. Apenas administradores podem reabrir comandas.");
      return;
    }

    try {
      await api.reabrirPedido(pedidoId);
      toast.success("Comanda reaberta com sucesso!");
      await loadPedidos();
      // Mudar para aba de abertas
      setPedidoStatusTab("abertas");
    } catch (error: any) {
      toast.error(error.message || "Erro ao reabrir comanda");
    }
  };

  const calcularTotal = () => {
    const subtotal = itensPedido.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    return {
      subtotal,
      taxa: 0,
      total: subtotal,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    try {
      if (editingPedidoId) {
        // Atualizar pedido existente via API
        await api.updatePedido(editingPedidoId, {
          nomeCliente: nomeCliente.trim(),
          mesaId: mesaId || null,
          reservaId: reservaSelecionada || null,
          itens,
          observacoes: observacoes.trim() || null,
        });
        
        toast.success("Pedido atualizado com sucesso!");
      } else {
        // Criar novo pedido
        // Verificar se a mesa está ocupada
        if (mesaId) {
          try {
            const pedidosAtivosNaMesa = await api.getPedidosAtivosMesa(mesaId);
            if (pedidosAtivosNaMesa.length > 0) {
              toast.error(`A mesa ${mesas.find(m => m.id === mesaId)?.numero || mesaId} já possui comanda(s) ativa(s)`);
              return;
            }

            // Verificar se há reserva confirmada para esta mesa
            const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
            const agora = new Date();
            const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
            
            // Buscar reservas confirmadas para esta mesa hoje via API
            const reservasConfirmadas = await api.getReservasPorMesa(mesaId, hoje);
            const reservasConfirmadasFiltradas = reservasConfirmadas.filter((r: any) => r.estado === 'confirmado');
            
            if (reservasConfirmadasFiltradas.length > 0) {
              // Verificar se há uma reserva confirmada para o horário atual (com tolerância de 30 minutos antes e 2 horas depois)
              const reservaValida = reservasConfirmadasFiltradas.find((r: any) => {
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
                const proximaReserva = reservasConfirmadasFiltradas
                  .sort((a: any, b: any) => a.hora_reserva.localeCompare(b.hora_reserva))
                  .find((r: any) => {
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
          } catch (error) {
            console.error('Erro ao verificar mesa ocupada ou reservas:', error);
            // Continuar mesmo com erro, mas avisar
            toast.warning('Aviso: Não foi possível verificar se a mesa está ocupada ou tem reservas');
          }
        }
      
        // Criar pedido via API
        await api.createPedido({
          nomeCliente: nomeCliente.trim(),
          mesaId: mesaId || null,
          reservaId: reservaSelecionada || null,
          itens,
          observacoes: observacoes.trim() || null,
        });
        
        toast.success("Pedido criado com sucesso!");
      }
      
      setDialogOpen(false);
      setEditingPedidoId(null);
      setObservacoes("");
      await loadPedidos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar pedido");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePedido(id);
      toast.success("Pedido excluído com sucesso!");
      await loadPedidos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir pedido");
    }
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

  const handleMesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar permissões - admin e atualizador podem criar/editar mesas
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem gerenciar mesas.");
      return;
    }

    if (!mesaFormData.numero.trim()) {
      toast.error("Número da mesa é obrigatório.");
      return;
    }

    try {
      if (editingMesa) {
        await api.updateMesa(editingMesa.id, {
          numero: mesaFormData.numero,
          capacidade: mesaFormData.capacidade,
        });
        toast.success("Mesa atualizada com sucesso!");
      } else {
        await api.createMesa({
          numero: mesaFormData.numero,
          capacidade: mesaFormData.capacidade,
          ativa: true,
        });
        toast.success("Mesa criada com sucesso!");
      }
      setMesaDialogOpen(false);
      loadMesas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar mesa");
    }
  };

  const handleDeleteMesa = (id: string) => {
    // Verificar permissões - apenas admin pode deletar mesas
    const user = localAuth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      toast.error("Acesso negado. Apenas administradores podem remover mesas.");
      return;
    }

    setConfirmDialogData({
      title: "Remover Mesa",
      message: "Tem certeza que deseja remover esta mesa?",
      onConfirm: async () => {
        try {
          await api.deleteMesa(id);
          toast.success("Mesa removida com sucesso!");
          loadMesas();
        } catch (error: any) {
          toast.error(error.message || "Erro ao remover mesa");
        }
        setConfirmDialogOpen(false);
        setConfirmDialogData(null);
      }
    });
    setConfirmDialogOpen(true);
  };

  const handleToggleMesaAtiva = async (id: string) => {
    try {
      // Buscar mesa atual para saber o estado
      const mesaAtual = mesas.find(m => m.id === id);
      if (!mesaAtual) {
        toast.error("Mesa não encontrada");
        return;
      }
      
      // Atualizar via API
      const updated = await api.updateMesa(id, { ativa: !mesaAtual.ativa });
      toast.success(`Mesa ${updated.data.ativa ? 'ativada' : 'desativada'} com sucesso!`);
      loadMesas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao ativar/desativar mesa");
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
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {hoje}
            </p>
            {horaAtual && (
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse"></div>
                <p className="text-xs sm:text-sm font-mono font-semibold text-primary">
                  {horaAtual}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-md border border-border">
            <button
              onClick={() => setViewMode("mesas")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                viewMode === "mesas" 
                  ? "bg-primary text-primary-foreground shadow-md font-semibold scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <Table className="h-4 w-4" />
              <span>Mesas</span>
            </button>
            <button
              onClick={() => setViewMode("pedidos")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                viewMode === "pedidos" 
                  ? "bg-primary text-primary-foreground shadow-md font-semibold scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Pedidos</span>
            </button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMostrarHistorico(!mostrarHistorico);
                if (!mostrarHistorico) {
                  loadHistorico();
                }
              }}
              className={`flex-1 sm:flex-none min-w-[120px] transition-all ${
                mostrarHistorico 
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm font-semibold border-orange-500" 
                  : "hover:bg-yellow-500 hover:text-white border-yellow-200 text-yellow-600"
              }`}
            >
              <Receipt className="mr-2 h-4 w-4" />
              {mostrarHistorico ? "Ocultar Histórico" : "Histórico"}
            </Button>
            <Button 
              onClick={() => handleOpenDialog()} 
              variant="default"
              className="flex-1 sm:flex-none min-w-[120px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Comanda
            </Button>
          </div>
        </div>
      </div>

      {/* Histórico de Vendas */}
      {mostrarHistorico && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {carregandoHistorico ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : historicoDias.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum histórico encontrado
              </div>
            ) : (
              <div className="space-y-6">
                {/* Calendário */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-auto">
                    <Calendar
                      mode="single"
                      selected={diaSelecionadoHistorico}
                      onSelect={(date) => {
                        setDiaSelecionadoHistorico(date);
                      }}
                      disabled={(date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        return !diasComVendas.has(dateStr);
                      }}
                      modifiers={{
                        hasSales: (date) => {
                          const dateStr = format(date, "yyyy-MM-dd");
                          return diasComVendas.has(dateStr);
                        },
                      }}
                      modifiersClassNames={{
                        hasSales: "bg-primary/20 text-primary font-semibold",
                      }}
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </div>
                  
                  {/* Botão para limpar seleção */}
                  {diaSelecionadoHistorico && (
                    <div className="flex items-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDiaSelecionadoHistorico(undefined);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Limpar Seleção
                      </Button>
                    </div>
                  )}
                </div>

                {/* Lista de dias filtrados */}
                {historicoDias
                  .filter((dia) => {
                    if (!diaSelecionadoHistorico) {
                      return true; // Mostrar todos se nenhum dia estiver selecionado
                    }
                    const dataSelecionadaStr = format(diaSelecionadoHistorico, "yyyy-MM-dd");
                    return dia.data === dataSelecionadaStr;
                  })
                  .map((dia) => {
                    const dataFormatada = new Date(dia.data).toLocaleDateString("pt-PT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });
                    
                    return (
                      <Card key={dia.data} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{dataFormatada}</CardTitle>
                            <Badge variant="outline" className="text-sm">
                              {dia.data}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Total de Vendas</p>
                              <p className="text-xl font-bold text-primary">
                                €{dia.totalVendas.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Pedidos</p>
                              <p className="text-xl font-bold text-primary">
                                {dia.pedidos.length}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Reservas</p>
                              <p className="text-xl font-bold text-primary">
                                {dia.totalReservas}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Confirmadas</p>
                              <p className="text-xl font-bold text-green-600">
                                {dia.totalConfirmadas}
                              </p>
                            </div>
                          </div>
                          {dia.pedidos.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Média por Pedido</p>
                              <p className="text-lg font-semibold">
                                €{(dia.totalVendas / dia.pedidos.length).toFixed(2)}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                
                {/* Total Acumulado - só mostra se nenhum dia estiver selecionado */}
                {!diaSelecionadoHistorico && historicoDias.length > 0 && (
                  <Card className="bg-primary/5 border-primary">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Acumulado</p>
                          <p className="text-2xl font-bold text-primary">
                            €{historicoDias.reduce((sum, dia) => sum + dia.totalVendas, 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total de Pedidos</p>
                          <p className="text-2xl font-bold text-primary">
                            {historicoDias.reduce((sum, dia) => sum + dia.pedidos.length, 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total de Reservas</p>
                          <p className="text-2xl font-bold text-primary">
                            {historicoDias.reduce((sum, dia) => sum + dia.totalReservas, 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Dias com Vendas</p>
                          <p className="text-2xl font-bold text-primary">
                            {historicoDias.filter(dia => dia.totalVendas > 0).length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumo do dia */}
      <Card className="shadow-soft">
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm text-muted-foreground">Total de Pedidos</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{pedidos.length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm text-muted-foreground">Total do Dia</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                €{totalDia.toFixed(2)}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm text-muted-foreground">Média por Pedido</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                €{pedidos.length > 0 ? (totalDia / pedidos.length).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização de Mesas */}
      {viewMode === "mesas" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-base sm:text-lg font-semibold">Mesas do Restaurante</h3>
            <Button 
              onClick={() => handleOpenMesaDialog()} 
              variant="outline"
              className="flex-1 sm:flex-none min-w-[120px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Adicionar Mesa</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {mesas.map((mesa) => {
              // Usar pedidos já carregados para verificar se a mesa está ocupada
              const pedidosNaMesa = pedidos.filter((p: any) => p.mesaId === mesa.id && (p.status === 'aberta' || p.status === 'pendente'));
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
                    <div className="flex gap-2 mt-3 justify-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMesaDialog(mesa);
                        }}
                        className="h-8 w-8 sm:h-7 sm:w-7 p-0"
                        title="Editar mesa"
                      >
                        <Pencil className="h-4 w-4 sm:h-3 sm:w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMesaAtiva(mesa.id);
                        }}
                        className="h-8 w-8 sm:h-7 sm:w-7 p-0"
                        title={mesa.ativa ? "Desativar mesa" : "Ativar mesa"}
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
                // Usar pedidos já carregados para verificar se a mesa está ocupada
                const pedidosNaMesa = pedidos.filter((p: any) => p.mesaId === mesaSelecionada.id && (p.status === 'aberta' || p.status === 'pendente'));
                const temComanda = pedidosNaMesa.length > 0;
                // Ordenar por data/hora e usar o pedido mais recente
                const pedidosOrdenados = temComanda ? [...pedidosNaMesa].sort((a: any, b: any) => {
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

                    <div className="flex gap-2 flex-wrap">
                      {!temComanda ? (
                        <Button
                          onClick={handleAbrirComanda}
                          variant="default"
                          className="flex-1 min-w-[120px]"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Abrir Comanda
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={handleAdicionarItens}
                            variant="default"
                            className="flex-1 min-w-[120px]"
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
                            variant="outline"
                            className="flex-1 min-w-[120px]"
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
              variant="outline"
              onClick={() => setMesaAcoesDialogOpen(false)}
              className="min-w-[100px]"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lista de pedidos */}
      {viewMode === "pedidos" && (
        <Tabs value={pedidoStatusTab} onValueChange={(v) => setPedidoStatusTab(v as "abertas" | "pendentes" | "finalizadas")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="abertas" className="text-xs sm:text-sm py-2 px-2 sm:px-4">
              <span className="hidden sm:inline">Abertas</span>
              <span className="sm:hidden">Abertas</span>
              <span className="ml-1">({getPedidosPorStatus('aberta').length})</span>
            </TabsTrigger>
            <TabsTrigger value="pendentes" className="text-xs sm:text-sm py-2 px-2 sm:px-4">
              <span className="hidden sm:inline">Pendentes</span>
              <span className="sm:hidden">Pend.</span>
              <span className="ml-1">({getPedidosPorStatus('pendente').length})</span>
            </TabsTrigger>
            <TabsTrigger value="finalizadas" className="text-xs sm:text-sm py-2 px-2 sm:px-4">
              <span className="hidden sm:inline">Finalizadas</span>
              <span className="sm:hidden">Final.</span>
              <span className="ml-1">({getPedidosPorStatus('finalizada').length})</span>
            </TabsTrigger>
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
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{pedido.nomeCliente}</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                      {pedido.hora} • {pedido.itens.length} {pedido.itens.length === 1 ? 'prato' : 'pratos'}
                            {pedido.mesaId && (
                              <> • Mesa {mesas.find(m => m.id === pedido.mesaId)?.numero || pedido.mesaId}</>
                            )}
                    </p>
                  </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            onClick={() => handleEditarPedido(pedido)}
                            className="flex-1 min-w-[80px]"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            <span>Editar</span>
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => handleAbrirDialogFinalizacao(pedido)}
                            className="flex-1 min-w-[80px]"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>Finalizar</span>
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(pedido.id)}
                            className="flex-1 min-w-[80px]"
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
                          {item.quantidade}x €{Number(item.preco).toFixed(2)}
                        </p>
                                {item.observacoes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Obs: {item.observacoes}
                                  </p>
                                )}
                      </div>
                      <p className="font-semibold">
                        €{(Number(item.preco) * item.quantidade).toFixed(2)}
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
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              onClick={() => handleReabrirComanda(pedido.id)}
                              title="Reabrir comanda (voltar para aberta)"
                              className="flex-1 min-w-[80px]"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reabrir
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleEditarPedido(pedido)}
                              className="flex-1 min-w-[80px]"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="default"
                              onClick={() => handleAbrirDialogFinalizacao(pedido)}
                              className="flex-1 min-w-[80px]"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalizar
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(pedido.id)}
                              className="flex-1 min-w-[80px]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                                  {item.quantidade}x €{Number(item.preco).toFixed(2)}
                                </p>
                                {item.observacoes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Obs: {item.observacoes}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold">
                                €{(Number(item.preco) * item.quantidade).toFixed(2)}
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
                                  {item.quantidade}x €{Number(item.preco).toFixed(2)}
                                </p>
                                {item.observacoes && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Obs: {item.observacoes}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold">
                                €{(Number(item.preco) * item.quantidade).toFixed(2)}
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
            {!editingPedidoId && (
              <div className="px-4 sm:px-6 pb-2">
                <Tabs value={abaComanda} onValueChange={(v) => setAbaComanda(v as "manual" | "reserva")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Criar Manualmente</TabsTrigger>
                    <TabsTrigger value="reserva">Selecionar Reserva</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
            <div className="px-4 sm:px-6 pb-4 space-y-4 overflow-y-auto flex-1">
            {abaComanda === "reserva" && !editingPedidoId ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Reservas do Dia</Label>
                    <Input
                      type="date"
                      value={dataSelecionada}
                      onChange={(e) => {
                        setDataSelecionada(e.target.value);
                        loadReservasDoDia(e.target.value);
                      }}
                      className="w-auto text-xs"
                    />
                  </div>
                  {carregandoReservas ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Carregando reservas...</span>
                    </div>
                  ) : reservasDoDia.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma reserva encontrada para {new Date(dataSelecionada).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {reservasDoDia.map((reserva) => {
                        const isSelected = reservaSelecionada === reserva.id;
                        const mesaReserva = mesas.find(m => m.id === reserva.mesa_id);
                        return (
                          <Card
                            key={reserva.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                            }`}
                            onClick={() => handleSelecionarReserva(reserva.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold">{reserva.nome} {reserva.apelido}</p>
                                    {isSelected && (
                                      <CheckCircle className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {reserva.hora_reserva} • {reserva.numero_pessoas} {reserva.numero_pessoas === 1 ? 'pessoa' : 'pessoas'}
                                    {mesaReserva && ` • Mesa ${mesaReserva.numero}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {reserva.telefone} • {reserva.email}
                                  </p>
                                  <div className="mt-2">
                                    <Badge variant={(reserva.estado === 'aguardando_cliente' || reserva.estado === 'confirmado_cliente' || reserva.estado === 'cliente_na_mesa') ? 'default' : 'secondary'}>
                                      {reserva.estado === 'confirmado_cliente' 
                                        ? 'Confirmado pelo Cliente' 
                                        : reserva.estado === 'aguardando_cliente' 
                                        ? 'Aguardando Cliente'
                                        : reserva.estado === 'cliente_na_mesa'
                                        ? 'Cliente na Mesa'
                                        : 'Pendente'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
                {reservaSelecionada && (
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary">
                      ✓ Reserva selecionada. Os dados do cliente foram preenchidos automaticamente.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
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
                  // Usar pedidos já carregados para verificar se a mesa está ocupada
                  const pedidosNaMesa = pedidos.filter((p: any) => p.mesaId === mesaId && (p.status === 'aberta' || p.status === 'pendente'));
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
                                          €{Number(menuItem.preco).toFixed(2)}
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
                                            = €{(Number(itemPedido.preco) * itemPedido.quantidade).toFixed(2)}
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
                                          €{Number(menuItem.preco).toFixed(2)}
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
                                            = €{(Number(itemPedido.preco) * itemPedido.quantidade).toFixed(2)}
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
            </>
            )}
            
            {itensPedido.length > 0 && abaComanda === "manual" && (() => {
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

              <div className="flex gap-2 flex-wrap pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMarcarPendente}
                  className="flex-1 min-w-[140px]"
                  disabled={!formaPagamentoFinalizacao || formaPagamentoFinalizacao.trim() === ""}
                >
                  Marcar como Pendente
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleFinalizarComanda}
                  className="flex-1 min-w-[140px]"
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
                onChange={(e) => {
                  const numero = e.target.value;
                  // Se o número for um número válido, usar como capacidade também
                  const numeroInt = parseInt(numero);
                  if (!isNaN(numeroInt) && numeroInt > 0) {
                    setMesaFormData({ numero, capacidade: numeroInt });
                  } else {
                    setMesaFormData({ ...mesaFormData, numero });
                  }
                }}
                placeholder="Ex: 1, A1, Varanda 1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                A capacidade será automaticamente definida igual ao número da mesa
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                Você pode ajustar manualmente se necessário
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMesaDialogOpen(false)}
                className="flex-1 min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="default"
                className="flex-1 min-w-[100px]"
              >
                {editingMesa ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

