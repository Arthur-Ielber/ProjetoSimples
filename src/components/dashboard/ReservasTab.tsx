import { useEffect, useState } from "react";
import { Mesa } from "@/lib/localStorage";
import { api } from "@/lib/api";
import { emailService } from "@/lib/emailService";
import { localAuth } from "@/lib/localAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

// Tipo Reserva baseado na API
type Reserva = {
  id: string;
  nome: string;
  apelido: string;
  telefone: string;
  email: string;
  data_reserva: string;
  hora_reserva: string;
  numero_pessoas: number;
  estado: EstadoReserva;
  mesaId: string | null;
  observacoes: Array<{
    id: string;
    mensagem: string;
    autor: string;
    autor_nome?: string;
    created_at: string;
  }>;
  tokenConfirmacao: string | null;
  tokenCancelamento?: string | null;
  confirmadoPeloCliente?: boolean;
  respostaCliente?: string | null;
  observacoesRestaurante?: string | null;
};

type EstadoReserva = 'pendente' | 'aguardando_cliente' | 'confirmado_cliente' | 'cliente_na_mesa' | 'cancelado' | 'finalizado';
type FiltroReserva = 'todas' | EstadoReserva;

export const ReservasTab = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [filtro, setFiltro] = useState<FiltroReserva>("pendente");
  const [loading, setLoading] = useState(true);
  const [mesaDialogOpen, setMesaDialogOpen] = useState(false);
  const [reservaParaConfirmar, setReservaParaConfirmar] = useState<Reserva | null>(null);
  const [mesaSelecionada, setMesaSelecionada] = useState<string | null>(null);
  const [mesasDisponiveis, setMesasDisponiveis] = useState<Mesa[]>([]);
  const [observacoesRestaurante, setObservacoesRestaurante] = useState<string>("");
  const [respostaCliente, setRespostaCliente] = useState<string>("");
  const [editarObservacoesDialogOpen, setEditarObservacoesDialogOpen] = useState(false);
  const [reservaParaEditar, setReservaParaEditar] = useState<Reserva | null>(null);
  const [observacoesEditadas, setObservacoesEditadas] = useState<string>("");
  const [respostaClienteEditada, setRespostaClienteEditada] = useState<string>("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [reservaParaAtualizarStatus, setReservaParaAtualizarStatus] = useState<Reserva | null>(null);
  const [novoEstado, setNovoEstado] = useState<EstadoReserva>("pendente");
  const [respostaClienteStatus, setRespostaClienteStatus] = useState<string>("");
  const [observacoesDialogOpen, setObservacoesDialogOpen] = useState(false);
  const [reservaParaObservacoes, setReservaParaObservacoes] = useState<Reserva | null>(null);
  const [observacoesInternas, setObservacoesInternas] = useState<string>("");
  const [mostrarCampoObservacoes, setMostrarCampoObservacoes] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  useEffect(() => {
    loadReservas();
    loadMesas();
    
    // Listener para mudanças (apenas para pedidos, já que reservas e mesas vêm do banco)
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'table_menu_pedidos') {
        verificarEAbrirComandas();
      }
    };
    
    window.addEventListener('localStorageChange', handleStorageChange);
    
    // Atualizar a cada 30 segundos para manter dados atualizados
    const reservasInterval = setInterval(loadReservas, 30000);
    const mesasInterval = setInterval(loadMesas, 30000);
    
    // Verificar e abrir comandas automaticamente a cada 30 segundos (para teste)
    const comandaCheckInterval = setInterval(verificarEAbrirComandas, 30000);
    
    // Verificar comandas ao carregar
    verificarEAbrirComandas();
    
    // Verificar comandas sem interação e finalizar reservas canceladas a cada 30 segundos (para teste)
    const verificarComandasEReservas = async () => {
      try {
        // Cancelar comandas sem interação em 5 minutos
        await api.cancelarComandasAntigas();
        
        // Finalizar reservas canceladas sem interação em 5 minutos
        await api.finalizarReservasCanceladasAntigas();
        
        // Recarregar reservas para atualizar a lista
        await loadReservas();
      } catch (error) {
        console.error('[AUTO] Erro ao verificar comandas e reservas:', error);
      }
    };
    
    const verificacaoInterval = setInterval(verificarComandasEReservas, 30000);
    
    // Verificar imediatamente ao carregar
    verificarComandasEReservas();

    // Listener para recarregar reservas quando uma nova for criada
    const handleReservaCriada = () => {
      console.log('[RESERVAS] Nova reserva criada, recarregando lista...');
      loadReservas();
    };
    
    window.addEventListener('reservaCriada', handleReservaCriada);
    
    return () => {
      clearInterval(reservasInterval);
      clearInterval(mesasInterval);
      clearInterval(comandaCheckInterval);
      clearInterval(verificacaoInterval);
      window.removeEventListener('localStorageChange', handleStorageChange);
      window.removeEventListener('reservaCriada', handleReservaCriada);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função de migração removida - reservas vêm apenas do banco de dados

  const loadReservas = async () => {
    setLoading(true);
    try {
      const data = await api.getReservas();
      console.log('[RESERVAS] Dados recebidos da API:', data);
      
      // Verificar se data é um array
      if (!Array.isArray(data)) {
        console.error('[RESERVAS] API não retornou um array:', data);
        throw new Error('Formato de dados inválido da API');
      }
      
      // Se não houver reservas, apenas definir array vazio
      if (data.length === 0) {
        console.log('[RESERVAS] Nenhuma reserva encontrada na API.');
        setReservas([]);
        setLoading(false);
        return;
      }
      
      // Converter formato da API para formato local
      const reservasFormatadas = data.map((r: any) => ({
        id: r.id,
        nome: r.nome,
        apelido: r.apelido,
        telefone: r.telefone,
        email: r.email,
        data_reserva: r.data_reserva,
        hora_reserva: r.hora_reserva,
        numero_pessoas: r.numero_pessoas,
        estado: r.estado,
        mesaId: r.mesa_id,
        observacoes: r.observacoes || [],
        tokenConfirmacao: r.token_confirmacao,
        tokenCancelamento: r.token_cancelamento,
        confirmadoPeloCliente: !!(r.confirmado_pelo_cliente === 1 || r.confirmado_pelo_cliente === true || r.confirmado_pelo_cliente === '1' || r.confirmado_pelo_cliente),
        respostaCliente: r.resposta_cliente,
        observacoesRestaurante: r.observacoes_restaurante,
      }));
      
      console.log('[RESERVAS] Reservas formatadas:', reservasFormatadas);
      
      // Log específico para reservas confirmadas
      reservasFormatadas.forEach(r => {
        if (r.estado === 'confirmado') {
          const original = data.find((d: any) => d.id === r.id);
          console.log(`[RESERVAS DEBUG] ${r.nome}:`, {
            estado: r.estado,
            confirmadoPeloCliente: r.confirmadoPeloCliente,
            tipo: typeof r.confirmadoPeloCliente,
            original_confirmado_pelo_cliente: original?.confirmado_pelo_cliente,
            tipo_original: typeof original?.confirmado_pelo_cliente,
            Boolean: Boolean(r.confirmadoPeloCliente)
          });
        }
      });
      
      // Ordenar por data e hora
      // Reservas finalizadas: mais novas primeiro (decrescente)
      // Outras reservas: mais antigas primeiro (crescente)
      const sorted = reservasFormatadas.sort((a, b) => {
        const aFinalizada = a.estado === 'finalizado';
        const bFinalizada = b.estado === 'finalizado';
        
        // Se ambas são finalizadas, ordenar decrescente (mais novas primeiro)
        if (aFinalizada && bFinalizada) {
          if (a.data_reserva !== b.data_reserva) {
            return b.data_reserva.localeCompare(a.data_reserva); // Decrescente
          }
          return b.hora_reserva.localeCompare(a.hora_reserva); // Decrescente
        }
        
        // Se apenas uma é finalizada, colocar finalizadas no final
        if (aFinalizada && !bFinalizada) return 1;
        if (!aFinalizada && bFinalizada) return -1;
        
        // Para outras reservas, ordenar crescente (mais antigas primeiro)
        if (a.data_reserva !== b.data_reserva) {
          return a.data_reserva.localeCompare(b.data_reserva);
        }
        return a.hora_reserva.localeCompare(b.hora_reserva);
      });
      
      console.log('[RESERVAS] Total de reservas carregadas:', sorted.length);
      setReservas(sorted);
    } catch (error) {
      console.error('[RESERVAS] Erro ao carregar reservas:', error);
      toast.error('Erro ao carregar reservas da API.');
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMesas = async () => {
    try {
      const data = await api.getMesas();
      setMesas(data);
    } catch (error) {
      console.error('Erro ao carregar mesas da API:', error);
      toast.error('Erro ao carregar mesas. Tente recarregar a página.');
      setMesas([]);
    }
  };

  // Função para cancelar comandas de reserva sem itens com mais de 2 minutos
  const cancelarComandasAntigas = async () => {
    try {
      const result = await api.cancelarComandasAntigas();
      if (result.success && result.canceladas > 0) {
        console.log(`${result.canceladas} comanda(s) de reserva cancelada(s) automaticamente por inatividade`);
      }
    } catch (error) {
      console.error('Erro ao cancelar comandas antigas:', error);
    }
  };

  // Função para verificar e abrir comandas automaticamente
  const verificarEAbrirComandas = async () => {
    // Primeiro, cancelar comandas antigas sem itens
    cancelarComandasAntigas();

    const hoje = new Date().toISOString().split('T')[0];
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    
    console.log(`[AUTO COMANDAS] Verificando comandas automáticas - Data: ${hoje}, Hora atual: ${horaAtual}`);
    console.log(`[AUTO COMANDAS] Total de reservas carregadas: ${reservas.length}`);
    
    // Usar a lista de reservas já carregada (que vem da API)
    // Apenas reservas confirmadas pelo cliente devem abrir comanda automaticamente
    const reservasConfirmadas = reservas.filter(r => {
      const estadoOk = r.estado === 'confirmado_cliente';
      const temMesa = !!r.mesaId;
      // Normalizar datas para comparação (remover hora se houver)
      const dataReservaNormalizada = r.data_reserva.split('T')[0];
      const dataOk = dataReservaNormalizada === hoje;
      
      console.log(`[AUTO COMANDAS] Verificando reserva ${r.id}:`, {
        estado: r.estado,
        estadoOk,
        mesaId: r.mesaId,
        temMesa,
        dataReserva: dataReservaNormalizada,
        dataOk,
        passaFiltros: estadoOk && temMesa && dataOk
      });
      
      if (estadoOk && temMesa && dataOk) {
        console.log(`[AUTO COMANDAS] ✅ Reserva ${r.id} passou nos filtros: estado=${r.estado}, mesaId=${r.mesaId}, data=${dataReservaNormalizada}`);
      } else if (estadoOk && !temMesa) {
        console.log(`[AUTO COMANDAS] ⚠️ Reserva ${r.id} está confirmada mas NÃO TEM MESA atribuída!`);
      }
      
      return estadoOk && temMesa && dataOk;
    });

    console.log(`[AUTO COMANDAS] Encontradas ${reservasConfirmadas.length} reservas confirmadas pelo cliente para hoje`);

    try {
      // Buscar pedidos do dia da API
      const pedidosDoDia = await api.getPedidos(hoje);
      const [horaAtualNum, minutoAtualNum] = horaAtual.split(':').map(Number);
      const horaAtualMinutos = horaAtualNum * 60 + minutoAtualNum;

      for (const reserva of reservasConfirmadas) {
        if (!reserva.mesaId) {
          console.log(`[AUTO COMANDAS] Reserva ${reserva.id} não tem mesaId, pulando`);
          continue;
        }

        console.log(`[AUTO COMANDAS] Verificando reserva ${reserva.id} - ${reserva.nome} ${reserva.apelido}, Hora: ${reserva.hora_reserva}, Mesa: ${reserva.mesaId}`);

        // Verificar se já existe comanda para esta reserva (incluindo finalizadas)
        const jaTemComanda = pedidosDoDia.some((p: any) => {
          const temIdReserva = p.reservaId === reserva.id;
          const temIdNaObservacao = p.observacoes?.includes(`ID: ${reserva.id}`);
          const observacaoReserva = `Comanda aberta automaticamente para reserva confirmada (ID: ${reserva.id}`;
          const temObservacaoReserva = p.observacoes?.includes(observacaoReserva);
          return temIdReserva || temIdNaObservacao || temObservacaoReserva;
        });

        if (jaTemComanda) {
          console.log(`[AUTO COMANDAS] Comanda já existe para reserva ${reserva.id}, pulando criação automática`);
          continue;
        }

        // Verificar se está no horário exato da reserva ou depois
        const [horaReserva, minutoReserva] = reserva.hora_reserva.split(':').map(Number);
        const horaReservaMinutos = horaReserva * 60 + minutoReserva;
        
        console.log(`[AUTO COMANDAS] Reserva ${reserva.id}: Hora reserva ${horaReserva}:${String(minutoReserva).padStart(2, '0')} (${horaReservaMinutos} min), Hora atual ${horaAtual} (${horaAtualMinutos} min)`);
        
        // Criar comanda apenas quando chegar o horário exato da reserva ou depois
        if (horaAtualMinutos >= horaReservaMinutos) {
          console.log(`[AUTO COMANDAS] Horário da reserva ${reserva.id} chegou ou passou, verificando mesa...`);
          
          // Verificar se a mesa não está ocupada usando a API
          const pedidosAtivosNaMesa = await api.getPedidosAtivosMesa(reserva.mesaId, hoje);
          
          if (pedidosAtivosNaMesa.length === 0) {
            console.log(`[AUTO COMANDAS] Mesa ${reserva.mesaId} está disponível, atualizando status e criando comanda...`);
            console.log(`[AUTO COMANDAS] Dados da reserva:`, {
              id: reserva.id,
              nome: `${reserva.nome} ${reserva.apelido}`,
              mesaId: reserva.mesaId,
              data: reserva.data_reserva,
              hora: reserva.hora_reserva
            });
            
            try {
              // PRIMEIRO: Atualizar status da reserva para "cliente_na_mesa"
              console.log(`[AUTO COMANDAS] Atualizando status da reserva ${reserva.id} para 'cliente_na_mesa'...`);
              await api.updateReserva(reserva.id, {
                estado: 'cliente_na_mesa',
                mesa_id: reserva.mesaId
              });
              console.log(`[AUTO COMANDAS] ✅ Status da reserva ${reserva.id} atualizado para 'cliente_na_mesa'`);
              
              // SEGUNDO: Criar comanda automaticamente via API
              const dadosComanda = {
                nomeCliente: `${reserva.nome} ${reserva.apelido}`,
                mesaId: reserva.mesaId,
                reservaId: reserva.id,
                itens: [],
                observacoes: `Comanda aberta automaticamente para reserva confirmada (ID: ${reserva.id}, ${reserva.data_reserva} às ${reserva.hora_reserva}). Cliente: ${reserva.nome} ${reserva.apelido}`,
              };
              
              console.log(`[AUTO COMANDAS] Criando comanda com dados:`, dadosComanda);
              
              const resultado = await api.createPedido(dadosComanda);
              
              console.log(`[AUTO COMANDAS] ✅ Comanda criada automaticamente para reserva ${reserva.id}:`, resultado);
              console.log(`[AUTO COMANDAS] Mesa atribuída: ${reserva.mesaId}`);
              
              if (resultado.success && resultado.data) {
                console.log(`[AUTO COMANDAS] Comanda criada com ID: ${resultado.data.id}, Mesa: ${resultado.data.mesaId}`);
                toast.success(`Cliente ${reserva.nome} ${reserva.apelido} atribuído à mesa ${reserva.mesaId} - Comanda criada automaticamente`);
              } else {
                toast.success(`Cliente ${reserva.nome} ${reserva.apelido} atribuído à mesa - Comanda criada automaticamente`);
              }
              
              // Recarregar reservas para atualizar o status
              await loadReservas();
            } catch (error) {
              console.error(`[AUTO COMANDAS] ❌ Erro ao processar reserva ${reserva.id}:`, error);
              toast.error(`Erro ao processar reserva de ${reserva.nome} ${reserva.apelido}`);
            }
          } else {
            console.log(`[AUTO COMANDAS] Mesa ${reserva.mesaId} está ocupada (${pedidosAtivosNaMesa.length} pedido(s) ativo(s)), não criando comanda`);
          }
        } else {
          const minutosRestantes = horaReservaMinutos - horaAtualMinutos;
          console.log(`[AUTO COMANDAS] Reserva ${reserva.id} ainda não chegou no horário (faltam ${minutosRestantes} minutos)`);
        }
      }
    } catch (error) {
      console.error('[AUTO COMANDAS] ❌ Erro ao verificar e abrir comandas automáticas:', error);
    }
  };

  const handleConfirmarComMesa = async () => {
    if (!reservaParaConfirmar) return;

    // Verificar permissões - admin e atualizador podem confirmar reservas
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem confirmar reservas.");
      return;
    }

    if (!mesaSelecionada || mesaSelecionada === "none") {
      toast.error("Por favor, selecione uma mesa");
      return;
    }

    // Gerar tokens únicos para confirmação e cancelamento
    const tokenConfirmacao = crypto.randomUUID();
    const tokenCancelamento = crypto.randomUUID();
    
    // Guardar a resposta antes de atualizar
    const respostaParaEmail = respostaCliente.trim() || '';

    try {
      // Atualizar no banco de dados primeiro
      await api.updateReserva(reservaParaConfirmar.id, {
        estado: 'aguardando_cliente',
        mesa_id: mesaSelecionada,
        token_confirmacao: tokenConfirmacao,
        token_cancelamento: tokenCancelamento,
      });

      // Recarregar reservas da API para atualizar a lista
      await loadReservas();

      // Verificar se deve criar comanda automaticamente agora
      const hoje = new Date().toISOString().split('T')[0];
      const agora = new Date();
      const horaAtualStr = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
      const [horaAtualNum, minutoAtualNum] = horaAtualStr.split(':').map(Number);
      const horaAtualMinutos = horaAtualNum * 60 + minutoAtualNum;
      
      const [horaReserva, minutoReserva] = reservaParaConfirmar.hora_reserva.split(':').map(Number);
      const horaReservaMinutos = horaReserva * 60 + minutoReserva;
      
      // Se a reserva é para hoje e já passou a hora (ou está até 5 minutos antes), criar comanda
      if (reservaParaConfirmar.data_reserva === hoje && 
          horaAtualMinutos >= horaReservaMinutos - 5 && 
          horaAtualMinutos <= horaReservaMinutos + 120) {
        
        // Verificar se já existe comanda para esta reserva usando a API
        try {
          const pedidosDoDia = await api.getPedidos(hoje);
          const jaTemComanda = pedidosDoDia.some((p: any) => {
            const temIdReserva = p.observacoes?.includes(`ID: ${reservaParaConfirmar.id}`);
            const observacaoReserva = `Comanda aberta automaticamente para reserva confirmada (ID: ${reservaParaConfirmar.id}`;
            return temIdReserva || p.observacoes?.includes(observacaoReserva);
          });

          if (!jaTemComanda) {
            // Verificar se a mesa não está ocupada usando a API
            const pedidosAtivosNaMesa = await api.getPedidosAtivosMesa(mesaSelecionada, hoje);
            if (pedidosAtivosNaMesa.length === 0) {
              // Criar comanda automaticamente via API
              await api.createPedido({
                nomeCliente: `${reservaParaConfirmar.nome} ${reservaParaConfirmar.apelido}`,
                mesaId: mesaSelecionada,
                reservaId: reservaParaConfirmar.id,
                itens: [],
                observacoes: `Comanda aberta automaticamente para reserva confirmada (ID: ${reservaParaConfirmar.id}, ${reservaParaConfirmar.data_reserva} às ${reservaParaConfirmar.hora_reserva}). Cliente: ${reservaParaConfirmar.nome} ${reservaParaConfirmar.apelido}`,
              });
              console.log(`[AUTO] Comanda criada imediatamente ao confirmar reserva ${reservaParaConfirmar.id}`);
              toast.success("Comanda criada automaticamente para a reserva!");
            }
          }
        } catch (error) {
          console.error('[AUTO] Erro ao criar comanda ao confirmar reserva:', error);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao confirmar reserva no banco de dados");
      console.error('Erro ao atualizar reserva no banco:', error);
      return;
    }

    toast.success("Reserva confirmada com mesa selecionada!");
    setMesaDialogOpen(false);
    
    // Mostrar loading imediatamente
    setEnviandoEmail(true);
    
    // Buscar reserva atualizada da lista (que já foi recarregada)
    const reservaAtualizada = reservas.find(r => r.id === reservaParaConfirmar.id);
    const reservaId = reservaParaConfirmar.id;
    
    // Função para abrir o pop-up de observações
    const abrirPopUpObservacoes = () => {
      // Buscar reserva atualizada novamente (caso tenha sido atualizada)
      const reservaFinal = reservas.find(r => r.id === reservaId);
      if (reservaFinal) {
        setReservaParaObservacoes(reservaFinal);
        setObservacoesInternas(reservaFinal.observacoesRestaurante || "");
        setMostrarCampoObservacoes(false);
        setEnviandoEmail(false);
        setObservacoesDialogOpen(true);
      } else {
        setEnviandoEmail(false);
      }
    };
    
    // Enviar email ao cliente com token de confirmação
    if (reservaAtualizada) {
        try {
          const mesaNumero = mesas.find(m => m.id === reservaAtualizada.mesaId)?.numero || null;
          
          // Log para debug
          console.log('[RESERVAS TAB] Enviando email ao confirmar com mesa:', {
            email: reservaAtualizada.email,
            estado: reservaAtualizada.estado,
            tokenConfirmacao: tokenConfirmacao ? tokenConfirmacao.substring(0, 20) + '...' : 'AUSENTE',
            mesaNumero: mesaNumero,
            deveMostrarBotoes: reservaAtualizada.estado === 'aguardando_cliente' && tokenConfirmacao ? 'SIM' : 'NÃO'
          });
          
          // Usar Promise.race para garantir que o pop-up apareça em no máximo 2 segundos
          const emailPromise = emailService.sendReservationEmail({
            email: reservaAtualizada.email,
            nome: reservaAtualizada.nome,
            apelido: reservaAtualizada.apelido,
            data_reserva: reservaAtualizada.data_reserva,
            hora_reserva: reservaAtualizada.hora_reserva,
            numero_pessoas: reservaAtualizada.numero_pessoas,
            estado: reservaAtualizada.estado,
            mesaNumero: mesaNumero,
            respostaCliente: respostaParaEmail || reservaAtualizada.respostaCliente || undefined,
            tokenConfirmacao: tokenConfirmacao ? tokenConfirmacao : undefined,
            tokenCancelamento: tokenCancelamento ? tokenCancelamento : undefined,
          });

        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 2000);
        });

        // Aguardar o email ou timeout de 2 segundos, o que vier primeiro
        await Promise.race([emailPromise, timeoutPromise]);

        // Verificar resultado do email (se já completou)
        emailPromise.then((emailResult) => {
          if (emailResult.success) {
            toast.success("Email enviado ao cliente com sucesso!");
          } else {
            toast.warning(`Email não foi enviado: ${emailResult.error}`);
          }
        }).catch((error) => {
          console.error('Erro ao enviar email:', error);
        });

        // Abrir pop-up imediatamente após o timeout ou quando o email completar
        abrirPopUpObservacoes();
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        abrirPopUpObservacoes();
      }
    } else {
      setEnviandoEmail(false);
    }

    setReservaParaConfirmar(null);
    setMesaSelecionada(null);
    setRespostaCliente("");
    loadReservas();
  };

  const handleConfirmarAtualizacaoStatus = async () => {
    if (!reservaParaAtualizarStatus) return;

    // Verificar permissões - admin e atualizador podem atualizar status
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem atualizar reservas.");
      return;
    }

    try {
      // Se o estado for 'aguardando_cliente' e não houver token, gerar novos tokens
      let tokenParaAtualizar = reservaParaAtualizarStatus.tokenConfirmacao;
      let tokenCancelamentoParaAtualizar = reservaParaAtualizarStatus.tokenCancelamento;
      if (novoEstado === 'aguardando_cliente') {
        if (!tokenParaAtualizar) {
          tokenParaAtualizar = crypto.randomUUID();
        }
        if (!tokenCancelamentoParaAtualizar) {
          tokenCancelamentoParaAtualizar = crypto.randomUUID();
        }
      }

      // Atualizar no banco de dados usando a API
      await api.updateReserva(reservaParaAtualizarStatus.id, {
        estado: novoEstado,
        resposta_cliente: respostaClienteStatus.trim() || undefined,
        token_confirmacao: novoEstado === 'aguardando_cliente' ? tokenParaAtualizar : undefined,
        token_cancelamento: novoEstado === 'aguardando_cliente' ? tokenCancelamentoParaAtualizar : undefined,
      });

      const mensagens: Record<EstadoReserva, string> = {
        pendente: "Reserva marcada como pendente!",
        aguardando_cliente: "Reserva confirmada pelo restaurante! Aguardando confirmação do cliente.",
        confirmado_cliente: "Reserva confirmada pelo cliente!",
        cliente_na_mesa: "Cliente na mesa!",
        cancelado: "Reserva cancelada!",
        finalizado: "Reserva finalizada!",
      };
      toast.success(mensagens[novoEstado]);

      // Recarregar reservas da API
      await loadReservas();

      setStatusDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao atualizar status da reserva:', error);
      toast.error(error.message || "Erro ao atualizar reserva");
      return;
    }
    
    // Preparar dados antes de enviar email
    const reservaId = reservaParaAtualizarStatus.id;
    
    // SEMPRE garantir que há um token (para todos os estados, não apenas confirmado)
    let tokenFinal = reservaParaAtualizarStatus.tokenConfirmacao || tokenParaAtualizar;
    if (!tokenFinal) {
      // Se não houver token, gerar um novo
      tokenFinal = crypto.randomUUID();
      // Atualizar no banco
      try {
        await api.updateReserva(reservaId, {
          token_confirmacao: tokenFinal
        });
        console.log('[RESERVAS TAB] Token gerado e salvo:', tokenFinal.substring(0, 20) + '...');
      } catch (error) {
        console.error('Erro ao atualizar token no banco:', error);
        // Continuar mesmo se falhar
      }
    }
    
    // Tentar buscar reserva atualizada da API, mas usar dados locais como fallback
    let reservaAtualizadaApi: any = null;
    try {
      reservaAtualizadaApi = await api.getReservaById(reservaId);
      // Se o token foi atualizado, usar o token final
      if (novoEstado === 'aguardando_cliente' && tokenFinal) {
        reservaAtualizadaApi.token_confirmacao = tokenFinal;
      }
    } catch (error) {
      console.error('Erro ao buscar reserva atualizada:', error);
      // Usar dados da reserva original como fallback
      reservaAtualizadaApi = {
        id: reservaParaAtualizarStatus.id,
        nome: reservaParaAtualizarStatus.nome,
        apelido: reservaParaAtualizarStatus.apelido,
        telefone: reservaParaAtualizarStatus.telefone,
        email: reservaParaAtualizarStatus.email,
        data_reserva: reservaParaAtualizarStatus.data_reserva,
        hora_reserva: reservaParaAtualizarStatus.hora_reserva,
        numero_pessoas: reservaParaAtualizarStatus.numero_pessoas,
        estado: novoEstado,
        mesa_id: reservaParaAtualizarStatus.mesaId,
        token_confirmacao: tokenFinal,
        resposta_cliente: respostaClienteStatus.trim() || reservaParaAtualizarStatus.respostaCliente || null,
        observacoes_restaurante: reservaParaAtualizarStatus.observacoesRestaurante || null,
        observacoes: reservaParaAtualizarStatus.observacoes || [],
      };
    }
    
    console.log('[RESERVAS TAB] Token final para email:', {
      novoEstado,
      tokenParaAtualizar: tokenParaAtualizar ? tokenParaAtualizar.substring(0, 20) + '...' : 'null',
      tokenDoBanco: reservaAtualizadaApi?.token_confirmacao ? reservaAtualizadaApi.token_confirmacao.substring(0, 20) + '...' : 'null',
      tokenFinal: tokenFinal ? tokenFinal.substring(0, 20) + '...' : 'null',
          deveMostrarBotoes: novoEstado === 'aguardando_cliente' && tokenFinal ? 'SIM' : 'NÃO'
    });
    
    // Converter formato da API para formato local
    const reservaAtualizada = {
      id: reservaAtualizadaApi.id,
      nome: reservaAtualizadaApi.nome,
      apelido: reservaAtualizadaApi.apelido,
      telefone: reservaAtualizadaApi.telefone,
      email: reservaAtualizadaApi.email,
      data_reserva: reservaAtualizadaApi.data_reserva,
      hora_reserva: reservaAtualizadaApi.hora_reserva,
      numero_pessoas: reservaAtualizadaApi.numero_pessoas,
      estado: reservaAtualizadaApi.estado || novoEstado,
      mesaId: reservaAtualizadaApi.mesa_id,
      tokenConfirmacao: tokenFinal || reservaAtualizadaApi.token_confirmacao || undefined,
      tokenCancelamento: tokenCancelamentoParaAtualizar || reservaAtualizadaApi.token_cancelamento || undefined,
      respostaCliente: reservaAtualizadaApi.resposta_cliente || respostaClienteStatus.trim() || null,
      observacoesRestaurante: reservaAtualizadaApi.observacoes_restaurante || null,
      observacoes: reservaAtualizadaApi.observacoes || [],
    };
      
    // Função para abrir o pop-up de observações
    const abrirPopUpObservacoes = () => {
      setReservaParaObservacoes(reservaAtualizada);
      setObservacoesInternas(reservaAtualizada.observacoesRestaurante || "");
      setMostrarCampoObservacoes(false);
      setEnviandoEmail(false);
      setObservacoesDialogOpen(true);
    };

    // Enviar email APENAS quando o restaurante confirmar a reserva (estado mudar para 'aguardando_cliente')
    // Este é o primeiro email que o cliente recebe, com os botões para validar/cancelar
    const estadoAnterior = reservaParaAtualizarStatus.estado;
    const deveEnviarEmail = novoEstado === 'aguardando_cliente' && estadoAnterior !== 'aguardando_cliente';
    
    if (deveEnviarEmail) {
      // Mostrar loading imediatamente
      setEnviandoEmail(true);
      
      try {
        const mesaNumero = mesas.find(m => m.id === reservaAtualizada.mesaId)?.numero || null;
        
        // Log para debug
        console.log('[RESERVAS TAB] Enviando email com dados:', {
          email: reservaAtualizada.email,
          estadoAnterior,
          novoEstado,
          estado: reservaAtualizada.estado,
          tokenConfirmacao: reservaAtualizada.tokenConfirmacao ? reservaAtualizada.tokenConfirmacao.substring(0, 20) + '...' : 'AUSENTE',
          mesaNumero: mesaNumero,
          deveMostrarBotoes: reservaAtualizada.estado === 'aguardando_cliente' && reservaAtualizada.tokenConfirmacao ? 'SIM' : 'NÃO'
        });
        
        // Garantir que os tokens sejam sempre passados
        const tokenParaEmail = reservaAtualizada.tokenConfirmacao 
          ? String(reservaAtualizada.tokenConfirmacao) 
          : (tokenFinal ? String(tokenFinal) : undefined);
        const tokenCancelamentoParaEmail = reservaAtualizada.tokenCancelamento 
          ? String(reservaAtualizada.tokenCancelamento) 
          : (tokenCancelamentoParaAtualizar ? String(tokenCancelamentoParaAtualizar) : undefined);
        
        console.log('[RESERVAS TAB] Tokens finais para envio de email:', {
          tokenConfirmacaoOriginal: reservaAtualizada.tokenConfirmacao ? reservaAtualizada.tokenConfirmacao.substring(0, 20) + '...' : 'AUSENTE',
          tokenFinal: tokenFinal ? tokenFinal.substring(0, 20) + '...' : 'AUSENTE',
          tokenParaEmail: tokenParaEmail ? tokenParaEmail.substring(0, 20) + '...' : 'AUSENTE',
          tokenCancelamentoParaEmail: tokenCancelamentoParaEmail ? tokenCancelamentoParaEmail.substring(0, 20) + '...' : 'AUSENTE',
          estado: reservaAtualizada.estado
        });
        
        // Enviar email
        const emailPromise = emailService.sendReservationEmail({
          email: reservaAtualizada.email,
          nome: reservaAtualizada.nome,
          apelido: reservaAtualizada.apelido,
          data_reserva: reservaAtualizada.data_reserva,
          hora_reserva: reservaAtualizada.hora_reserva,
          numero_pessoas: reservaAtualizada.numero_pessoas,
          estado: reservaAtualizada.estado,
          mesaNumero: mesaNumero,
          respostaCliente: reservaAtualizada.respostaCliente,
          tokenConfirmacao: tokenParaEmail,
          tokenCancelamento: tokenCancelamentoParaEmail,
        });

        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 2000);
        });

        // Aguardar o email ou timeout de 2 segundos, o que vier primeiro
        await Promise.race([emailPromise, timeoutPromise]);

        // Verificar resultado do email (se já completou)
        emailPromise.then((emailResult) => {
          if (emailResult.success) {
            toast.success("Email enviado ao cliente com sucesso!");
          } else {
            console.warn(`Email não foi enviado: ${emailResult.error}`);
            // Não mostrar toast de erro, apenas logar
          }
        }).catch((error) => {
          console.error('Erro ao enviar email:', error);
          // Não mostrar toast de erro, apenas logar
        });

        // Abrir pop-up imediatamente após o timeout ou quando o email completar
        abrirPopUpObservacoes();
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        // Continuar mesmo se o email falhar
        abrirPopUpObservacoes();
      }
    } else {
      // Se for pendente ou não houver mudança de estado, apenas abrir pop-up
      abrirPopUpObservacoes();
    }
    
    setReservaParaAtualizarStatus(null);
    setRespostaClienteStatus("");
  };

  const handleSalvarObservacoesInternas = async () => {
    if (!reservaParaObservacoes) return;

    // Verificar permissões - admin e atualizador podem salvar observações
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem salvar observações.");
      return;
    }

    try {
      await api.updateReserva(reservaParaObservacoes.id, {
        observacoes_restaurante: observacoesInternas.trim() || undefined,
      });
      await loadReservas();
      toast.success("Observações salvas com sucesso!");
      setObservacoesDialogOpen(false);
      setMostrarCampoObservacoes(false);
      setReservaParaObservacoes(null);
      setObservacoesInternas("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar observações");
      console.error('Erro ao salvar observações:', error);
    }
  };

  const updateStatus = async (id: string, estado: EstadoReserva) => {
    // Verificar permissões - admin e atualizador podem atualizar status
    const user = localAuth.getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'atualizador')) {
      toast.error("Acesso negado. Apenas usuários autenticados podem atualizar reservas.");
      return;
    }

    // Buscar reserva da lista atual (que vem da API)
    const reserva = reservas.find(r => r.id === id);
    if (!reserva) {
      toast.error("Reserva não encontrada");
      return;
    }

    // Se for confirmar, mostrar diálogo de seleção de mesa
    if (estado === 'aguardando_cliente') {
      try {
        // Buscar mesas disponíveis usando a API
        const todasMesas = await api.getMesasAtivas();
        const mesasDisponiveisList: Mesa[] = [];

        for (const mesa of todasMesas) {
          // Verificar se a mesa tem comandas ativas
          try {
            const pedidosAtivos = await api.getPedidosAtivosMesa(mesa.id);
            if (pedidosAtivos && pedidosAtivos.length > 0) {
              continue; // Mesa ocupada
            }
          } catch (error) {
            console.error(`Erro ao verificar pedidos ativos da mesa ${mesa.id}:`, error);
            // Em caso de erro, considerar a mesa como disponível
          }

          // Verificar se há reserva confirmada para esta mesa no mesmo horário
          try {
            const reservasConfirmadas = await api.getReservasPorMesa(mesa.id, reserva.data_reserva);
            const temReservaNoHorario = reservasConfirmadas.some((r: any) => {
              if (r.estado !== 'aguardando_cliente' && r.estado !== 'confirmado_cliente') return false;
              const [horaReserva, minutoReserva] = r.hora_reserva.split(':').map(Number);
              const [horaAtual, minutoAtual] = reserva.hora_reserva.split(':').map(Number);
              
              const horaReservaMinutos = horaReserva * 60 + minutoReserva;
              const horaAtualMinutos = horaAtual * 60 + minutoAtual;
              
              // Considerar conflito se estiver dentro de 2 horas de diferença
              return Math.abs(horaReservaMinutos - horaAtualMinutos) < 120;
            });

            if (!temReservaNoHorario) {
              mesasDisponiveisList.push(mesa);
            }
          } catch (error) {
            console.error(`Erro ao verificar reservas da mesa ${mesa.id}:`, error);
            // Em caso de erro, considerar a mesa como disponível
            mesasDisponiveisList.push(mesa);
          }
        }
        
        if (mesasDisponiveisList.length === 0) {
          toast.error("Não há mesas disponíveis para este horário. Por favor, verifique as mesas ocupadas.");
          return;
        }

        setMesasDisponiveis(mesasDisponiveisList);
        setReservaParaConfirmar(reserva);
        // Inicializar mesaSelecionada como string ou "none" para evitar problema de controlled/uncontrolled
        setMesaSelecionada(reserva.mesaId ? reserva.mesaId : null);
        setRespostaCliente(reserva.respostaCliente || "");
        setMesaDialogOpen(true);
      } catch (error) {
        console.error('Erro ao buscar mesas disponíveis:', error);
        toast.error("Erro ao buscar mesas disponíveis. Tente novamente.");
      }
      return;
    }

    // Para outros estados, mostrar diálogo para resposta ao cliente
    setReservaParaAtualizarStatus(reserva);
    setNovoEstado(estado);
    setRespostaClienteStatus(reserva.respostaCliente || "");
    setStatusDialogOpen(true);
  };

  const reservasFiltradas =
    filtro === "todas"
      ? reservas
      : reservas.filter((r) => r.estado === filtro);

  const getStatusBadge = (estado: EstadoReserva) => {
    const variants: Record<EstadoReserva, "default" | "secondary" | "destructive" | "outline"> = {
      pendente: "secondary",
      aguardando_cliente: "default",
      confirmado_cliente: "default",
      cliente_na_mesa: "default",
      cancelado: "destructive",
      finalizado: "outline",
    };

    const labels: Record<EstadoReserva, string> = {
      pendente: "Pendente",
      aguardando_cliente: "Aguardando Cliente",
      confirmado_cliente: "Confirmado pelo Cliente",
      cliente_na_mesa: "Cliente na Mesa",
      cancelado: "Cancelado",
      finalizado: "Finalizado",
    };

    return (
      <Badge variant={variants[estado]}>
        {labels[estado]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["pendente", "aguardando_cliente", "confirmado_cliente", "cliente_na_mesa", "cancelado", "finalizado", "todas"] as const).map((f) => (
            <Button
              key={f}
              variant={filtro === f ? "default" : "outline"}
              onClick={() => setFiltro(f)}
            >
              {f === "todas" 
                ? "Todas" 
                : f === "aguardando_cliente"
                ? "Aguardando Cliente"
                : f === "confirmado_cliente"
                ? "Confirmado pelo Cliente"
                : f === "cliente_na_mesa"
                ? "Cliente na Mesa"
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('[MANUAL] Verificação manual de comandas acionada');
            verificarEAbrirComandas();
            toast.info('Verificando comandas automáticas...');
          }}
          className="text-xs"
        >
          🔄 Verificar Comandas
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reservasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma reserva encontrada
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reservasFiltradas.map((reserva) => (
            <Card key={reserva.id} className="shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {reserva.nome} {reserva.apelido}
                    </CardTitle>
                    {(() => {
                      const isConfirmadoCliente = reserva.estado === 'confirmado_cliente';
                      
                      return isConfirmadoCliente ? (
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                            ✓ Confirmada pelo cliente via email
                          </Badge>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  {getStatusBadge(reserva.estado)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{reserva.telefone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{reserva.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {new Date(reserva.data_reserva).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hora</p>
                    <p className="font-medium">{reserva.hora_reserva}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pessoas</p>
                    <p className="font-medium">{reserva.numero_pessoas}</p>
                  </div>
                  {reserva.mesaId && (
                    <div>
                      <p className="text-muted-foreground">Mesa</p>
                      <p className="font-medium">
                        Mesa {mesas.find(m => m.id === reserva.mesaId)?.numero || reserva.mesaId}
                      </p>
                    </div>
                  )}
                  {reserva.estado === 'confirmado_cliente' && (
                    <div className="md:col-span-2 mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                            Reserva confirmada pelo cliente
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                            O cliente confirmou a reserva através do link enviado por email
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(reserva.estado === 'aguardando_cliente' || reserva.estado === 'confirmado_cliente') && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {reserva.observacoesRestaurante ? 'Observações do Restaurante' : 'Adicionar Observações'}
                      </p>
                    <Button
                      size="sm"
                        variant="outline"
                        onClick={() => {
                          setReservaParaEditar(reserva);
                          setObservacoesEditadas(reserva.observacoesRestaurante || "");
                          setRespostaClienteEditada(reserva.respostaCliente || "");
                          setEditarObservacoesDialogOpen(true);
                        }}
                      >
                        {reserva.observacoesRestaurante ? 'Editar' : 'Adicionar'}
                    </Button>
                  </div>
                    {reserva.observacoesRestaurante && (
                      <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">{reserva.observacoesRestaurante}</p>
                    )}
                  </div>
                )}

                {reserva.respostaCliente && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Resposta ao Cliente</p>
                    <p className="text-sm whitespace-pre-wrap bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">{reserva.respostaCliente}</p>
                  </div>
                )}

                {/* Seletor de Status */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor={`status-${reserva.id}`} className="text-sm font-medium">
                      Status da Reserva:
                    </Label>
                    <Select
                      value={reserva.estado}
                      onValueChange={(value) => updateStatus(reserva.id, value as EstadoReserva)}
                      disabled={reserva.estado === "finalizado"}
                    >
                      <SelectTrigger
                        id={`status-${reserva.id}`}
                        className="w-[180px]"
                        disabled={reserva.estado === "finalizado"}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
                        <SelectItem value="confirmado_cliente">Confirmado pelo Cliente</SelectItem>
                        <SelectItem value="cliente_na_mesa">Cliente na Mesa</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {reserva.estado === "finalizado" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Reserva finalizada. Não é possível alterar o status.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para selecionar mesa ao confirmar reserva */}
      <Dialog open={mesaDialogOpen} onOpenChange={(open) => {
        setMesaDialogOpen(open);
        if (!open) {
          // Limpar estados quando o diálogo é fechado
          setMesaSelecionada(null);
          setReservaParaConfirmar(null);
          setRespostaCliente("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva e Selecionar Mesa</DialogTitle>
            <DialogDescription>
              Selecione uma mesa disponível para esta reserva. A comanda será aberta automaticamente no horário da reserva.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reservaParaConfirmar && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{reservaParaConfirmar.nome} {reservaParaConfirmar.apelido}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(reservaParaConfirmar.data_reserva).toLocaleDateString("pt-PT")} às {reservaParaConfirmar.hora_reserva}
                </p>
                <p className="text-xs text-muted-foreground">
                  {reservaParaConfirmar.numero_pessoas} {reservaParaConfirmar.numero_pessoas === 1 ? 'pessoa' : 'pessoas'}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="mesa-select">Mesa Disponível</Label>
              <Select
                value={mesaSelecionada ? mesaSelecionada : "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setMesaSelecionada(null);
                  } else {
                    setMesaSelecionada(value);
                  }
                }}
              >
                <SelectTrigger id="mesa-select">
                  <SelectValue placeholder="Selecione uma mesa" />
                </SelectTrigger>
                <SelectContent>
                  {mesasDisponiveis.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhuma mesa disponível
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none">Sem mesa específica</SelectItem>
                      {mesasDisponiveis.map((mesa) => (
                        <SelectItem key={mesa.id} value={mesa.id}>
                          Mesa {mesa.numero} (Capacidade: {mesa.capacidade})
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              {mesasDisponiveis.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {mesasDisponiveis.length} {mesasDisponiveis.length === 1 ? 'mesa disponível' : 'mesas disponíveis'} para este horário
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="resposta-cliente">Resposta ao Cliente (opcional)</Label>
              <Textarea
                id="resposta-cliente"
                value={respostaCliente}
                onChange={(e) => setRespostaCliente(e.target.value)}
                placeholder="Ex: Obrigado por escolher nosso restaurante! Estamos ansiosos para recebê-lo..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {respostaCliente.length}/500 caracteres
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta mensagem será enviada ao cliente junto com o status da reserva.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setMesaDialogOpen(false);
                  setReservaParaConfirmar(null);
                  setMesaSelecionada(null);
                  setRespostaCliente("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarComMesa}
                disabled={!mesaSelecionada || mesaSelecionada === "none" || mesasDisponiveis.length === 0}
              >
                Confirmar Reserva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar observações */}
      <Dialog open={editarObservacoesDialogOpen} onOpenChange={setEditarObservacoesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Observações e Reenviar Email</DialogTitle>
            <DialogDescription>
              Edite as observações e um novo email será enviado ao cliente com um novo link de confirmação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reservaParaEditar && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{reservaParaEditar.nome} {reservaParaEditar.apelido}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(reservaParaEditar.data_reserva).toLocaleDateString("pt-PT")} às {reservaParaEditar.hora_reserva}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="observacoes-editadas">Observações do Restaurante</Label>
              <Textarea
                id="observacoes-editadas"
                value={observacoesEditadas}
                onChange={(e) => setObservacoesEditadas(e.target.value)}
                placeholder="Ex: Mesa perto da janela, vista para o mar, área reservada..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {observacoesEditadas.length}/500 caracteres
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditarObservacoesDialogOpen(false);
                  setReservaParaEditar(null);
                  setObservacoesEditadas("");
                  setRespostaClienteEditada("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!reservaParaEditar) return;

                  // Gerar novos tokens
                  const novoTokenConfirmacao = crypto.randomUUID();
                  const novoTokenCancelamento = crypto.randomUUID();

                  // Atualizar reserva com novas observações e novos tokens
                  try {
                    await api.updateReserva(reservaParaEditar.id, {
                      observacoes_restaurante: observacoesEditadas.trim() || undefined,
                      resposta_cliente: respostaClienteEditada.trim() || reservaParaEditar.respostaCliente || undefined,
                      token_confirmacao: novoTokenConfirmacao,
                      token_cancelamento: novoTokenCancelamento,
                      confirmado_pelo_cliente: false, // Resetar confirmação do cliente
                    });
                    await loadReservas();
                    toast.success("Observações atualizadas!");

                    // Enviar novo email ao cliente
                    const reservaAtualizada = reservas.find(r => r.id === reservaParaEditar.id);
                  if (reservaAtualizada) {
                    try {
                      const mesaNumero = mesas.find(m => m.id === reservaAtualizada.mesaId)?.numero || null;
                      
                      const emailResult = await emailService.sendReservationEmail({
                        email: reservaAtualizada.email,
                        nome: reservaAtualizada.nome,
                        apelido: reservaAtualizada.apelido,
                        data_reserva: reservaAtualizada.data_reserva,
                        hora_reserva: reservaAtualizada.hora_reserva,
                        numero_pessoas: reservaAtualizada.numero_pessoas,
                        estado: reservaAtualizada.estado,
                        mesaNumero: mesaNumero,
                        respostaCliente: reservaAtualizada.respostaCliente,
                        tokenConfirmacao: novoTokenConfirmacao,
                        tokenCancelamento: novoTokenCancelamento,
                      });

                      if (emailResult.success) {
                        toast.success("Novo email enviado ao cliente com sucesso!");
                      } else {
                        toast.warning(`Email não foi enviado: ${emailResult.error}`);
                      }
                    } catch (error) {
                      console.error('Erro ao enviar email:', error);
                      toast.warning("Observações atualizadas, mas houve um erro ao enviar o email.");
                    }
                  }
                  } catch (error: any) {
                    toast.error(error.message || "Erro ao atualizar observações");
                    console.error('Erro ao atualizar reserva:', error);
                    return;
                  }

                  setEditarObservacoesDialogOpen(false);
                  setReservaParaEditar(null);
                  setObservacoesEditadas("");
                  setRespostaClienteEditada("");
                  loadReservas();
                }}
              >
                Salvar e Enviar Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para atualizar status com resposta ao cliente */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Status da Reserva</DialogTitle>
            <DialogDescription>
              Atualize o status da reserva e adicione uma resposta ao cliente (opcional).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reservaParaAtualizarStatus && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{reservaParaAtualizarStatus.nome} {reservaParaAtualizarStatus.apelido}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(reservaParaAtualizarStatus.data_reserva).toLocaleDateString("pt-PT")} às {reservaParaAtualizarStatus.hora_reserva}
                </p>
                <p className="text-xs text-muted-foreground">
                  Novo status: <strong>{novoEstado.charAt(0).toUpperCase() + novoEstado.slice(1)}</strong>
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="resposta-cliente-status">Resposta ao Cliente (opcional)</Label>
              <Textarea
                id="resposta-cliente-status"
                value={respostaClienteStatus}
                onChange={(e) => setRespostaClienteStatus(e.target.value)}
                placeholder="Ex: Obrigado por escolher nosso restaurante! Estamos ansiosos para recebê-lo..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {respostaClienteStatus.length}/500 caracteres
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta mensagem será enviada ao cliente junto com o status da reserva.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusDialogOpen(false);
                  setReservaParaAtualizarStatus(null);
                  setRespostaClienteStatus("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarAtualizacaoStatus}
              >
                Atualizar Status e Enviar Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar observações internas do restaurante */}
      <Dialog open={observacoesDialogOpen} onOpenChange={(open) => {
        setObservacoesDialogOpen(open);
        if (!open) {
          setMostrarCampoObservacoes(false);
          setReservaParaObservacoes(null);
          setObservacoesInternas("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Observações do Restaurante (Uso Interno)</DialogTitle>
            <DialogDescription>
              {mostrarCampoObservacoes 
                ? "Adicione observações sobre esta reserva. Estas observações ficarão registradas apenas no sistema e não serão enviadas ao cliente."
                : "Deseja adicionar observações internas sobre esta reserva?"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reservaParaObservacoes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{reservaParaObservacoes.nome} {reservaParaObservacoes.apelido}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(reservaParaObservacoes.data_reserva).toLocaleDateString("pt-PT")} às {reservaParaObservacoes.hora_reserva}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: <strong>{reservaParaObservacoes.estado.charAt(0).toUpperCase() + reservaParaObservacoes.estado.slice(1)}</strong>
                </p>
              </div>
            )}

            {mostrarCampoObservacoes ? (
              <>
                <div>
                  <Label htmlFor="observacoes-internas">Observações do Restaurante (opcional)</Label>
                  <Textarea
                    id="observacoes-internas"
                    value={observacoesInternas}
                    onChange={(e) => setObservacoesInternas(e.target.value)}
                    placeholder="Ex: Cliente vem em 2, mesa perto da janela, preferência por área silenciosa..."
                    rows={5}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {observacoesInternas.length}/500 caracteres
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 text-amber-600 dark:text-amber-400">
                    ⚠️ Estas observações são apenas para uso interno e não serão enviadas ao cliente.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setObservacoesDialogOpen(false);
                      setMostrarCampoObservacoes(false);
                      setReservaParaObservacoes(null);
                      setObservacoesInternas("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSalvarObservacoesInternas}
                  >
                    Salvar Observações
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setObservacoesDialogOpen(false);
                    setMostrarCampoObservacoes(false);
                    setReservaParaObservacoes(null);
                    setObservacoesInternas("");
                  }}
                >
                  Não
                </Button>
                <Button
                  onClick={() => {
                    setMostrarCampoObservacoes(true);
                  }}
                >
                  Sim
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Overlay de carregamento durante envio de email */}
      {enviandoEmail && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-background rounded-lg p-6 shadow-lg max-w-sm w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Enviando email...</p>
              <p className="text-xs text-muted-foreground text-center">
                Aguarde enquanto enviamos o email ao cliente
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
