import { useEffect, useState } from "react";
import { localReservas, Reserva as LocalReserva, localMesas, Mesa, localPedidos } from "@/lib/localStorage";
import { emailService } from "@/lib/emailService";
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
import { Loader2 } from "lucide-react";

type Reserva = LocalReserva;

type EstadoReserva = 'pendente' | 'confirmado' | 'cancelado' | 'finalizado';
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
    
    // Listener para mudanças no localStorage
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'table_menu_reservas') {
        loadReservas();
      }
      if (customEvent.detail?.key === 'table_menu_mesas') {
        loadMesas();
      }
      if (customEvent.detail?.key === 'table_menu_pedidos') {
        verificarEAbrirComandas();
      }
    };
    
    window.addEventListener('localStorageChange', handleStorageChange);
    
    // Atualizar a cada 2 segundos para simular tempo real (opcional)
    const interval = setInterval(loadReservas, 2000);
    
    // Verificar e abrir comandas automaticamente a cada minuto
    const comandaCheckInterval = setInterval(verificarEAbrirComandas, 60000);
    
    // Verificar comandas ao carregar
    verificarEAbrirComandas();
    
    return () => {
      clearInterval(interval);
      clearInterval(comandaCheckInterval);
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReservas = () => {
    setLoading(true);
    const data = localReservas.getAll();
    // Ordenar por data e hora
    const sorted = data.sort((a, b) => {
      if (a.data_reserva !== b.data_reserva) {
        return a.data_reserva.localeCompare(b.data_reserva);
      }
      return a.hora_reserva.localeCompare(b.hora_reserva);
    });
    setReservas(sorted);
    setLoading(false);
  };

  const loadMesas = () => {
    const data = localMesas.getAll();
    setMesas(data);
  };

  // Função para verificar e abrir comandas automaticamente
  const verificarEAbrirComandas = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
    
    const reservasConfirmadas = localReservas.getAll().filter(r => 
      r.estado === 'confirmado' && 
      r.mesaId && 
      r.data_reserva === hoje
    );

    for (const reserva of reservasConfirmadas) {
      if (!reserva.mesaId) continue;

      // Verificar se já existe comanda para esta reserva
      const pedidos = localPedidos.getAll();
      const jaTemComanda = pedidos.some(p => 
        p.mesaId === reserva.mesaId && 
        (p.status === 'aberta' || p.status === 'pendente') &&
        p.nomeCliente === `${reserva.nome} ${reserva.apelido}`
      );

      if (jaTemComanda) continue;

      // Verificar se está no horário (com tolerância de 30 minutos antes)
      const [horaReserva, minutoReserva] = reserva.hora_reserva.split(':').map(Number);
      const [horaAtualNum, minutoAtualNum] = horaAtual.split(':').map(Number);
      
      const horaReservaMinutos = horaReserva * 60 + minutoReserva;
      const horaAtualMinutos = horaAtualNum * 60 + minutoAtualNum;
      
      // Abrir comanda se estiver no horário ou até 30 minutos antes
      if (horaAtualMinutos >= horaReservaMinutos - 30 && horaAtualMinutos <= horaReservaMinutos + 120) {
        // Verificar se a mesa não está ocupada
        const pedidosAtivosNaMesa = localMesas.getPedidosAtivos(reserva.mesaId);
        if (pedidosAtivosNaMesa.length === 0) {
          // Criar comanda automaticamente
          const result = localPedidos.create({
            nomeCliente: `${reserva.nome} ${reserva.apelido}`,
            mesaId: reserva.mesaId,
            itens: [],
            observacoes: `Comanda aberta automaticamente para reserva confirmada (${reserva.data_reserva} às ${reserva.hora_reserva})`,
          });

          if (result.success) {
            console.log(`Comanda aberta automaticamente para reserva ${reserva.id}`);
          }
        }
      }
    }
  };

  const handleConfirmarComMesa = async () => {
    if (!reservaParaConfirmar) return;

    if (!mesaSelecionada || mesaSelecionada === "none") {
      toast.error("Por favor, selecione uma mesa");
      return;
    }

    // Gerar token único para confirmação
    const tokenConfirmacao = crypto.randomUUID();
    
    // Guardar a resposta antes de atualizar
    const respostaParaEmail = respostaCliente.trim() || '';

    const result = localReservas.update(reservaParaConfirmar.id, { 
      estado: 'confirmado',
      mesaId: mesaSelecionada,
      respostaCliente: respostaParaEmail || undefined,
      tokenConfirmacao: tokenConfirmacao,
    });

    if (!result.success) {
      toast.error(result.error || "Erro ao confirmar reserva");
      return;
    }

    toast.success("Reserva confirmada com mesa selecionada!");
    setMesaDialogOpen(false);
    
    // Mostrar loading imediatamente
    setEnviandoEmail(true);
    
    // Preparar dados da reserva antes de enviar email
    const reservaAtualizada = localReservas.getById(reservaParaConfirmar.id);
    const reservaId = reservaParaConfirmar.id;
    
    // Função para abrir o pop-up de observações
    const abrirPopUpObservacoes = () => {
      const reservaFinal = localReservas.getById(reservaId);
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
          tokenConfirmacao: tokenConfirmacao || undefined,
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

    const result = localReservas.update(reservaParaAtualizarStatus.id, { 
      estado: novoEstado,
      respostaCliente: respostaClienteStatus.trim() || undefined,
    });

    if (!result.success) {
      toast.error(result.error || "Erro ao atualizar reserva");
      return;
    }

    const mensagens: Record<EstadoReserva, string> = {
      pendente: "Reserva marcada como pendente!",
      confirmado: "Reserva confirmada!",
      cancelado: "Reserva cancelada!",
      finalizado: "Reserva finalizada!",
    };
    toast.success(mensagens[novoEstado]);

    // Recarregar reservas para obter dados atualizados
    loadReservas();

    setStatusDialogOpen(false);
    
    // Preparar dados antes de enviar email
    const reservaId = reservaParaAtualizarStatus.id;
    
    // Função para abrir o pop-up de observações
    const abrirPopUpObservacoes = () => {
      const reservaAtualizada = localReservas.getById(reservaId);
      if (reservaAtualizada) {
        setReservaParaObservacoes(reservaAtualizada);
        setObservacoesInternas(reservaAtualizada.observacoesRestaurante || "");
        setMostrarCampoObservacoes(false);
        setEnviandoEmail(false);
        setObservacoesDialogOpen(true);
      } else {
        setEnviandoEmail(false);
      }
    };

    // Enviar email ao cliente (apenas se não for pendente, pois pendente é o estado inicial)
    if (novoEstado !== 'pendente') {
      const reservaAtualizada = localReservas.getById(reservaId);
      if (reservaAtualizada) {
        // Mostrar loading imediatamente
        setEnviandoEmail(true);
        
        try {
          const mesaNumero = mesas.find(m => m.id === reservaAtualizada.mesaId)?.numero || null;
          
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
            respostaCliente: reservaAtualizada.respostaCliente,
            tokenConfirmacao: reservaAtualizada.tokenConfirmacao,
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
              toast.warning(`Status atualizado, mas email não foi enviado: ${emailResult.error}`);
            }
          }).catch((error) => {
            console.error('Erro ao enviar email:', error);
            toast.warning("Status atualizado, mas houve um erro ao enviar o email.");
          });

          // Abrir pop-up imediatamente após o timeout ou quando o email completar
          abrirPopUpObservacoes();
        } catch (error) {
          console.error('Erro ao enviar email:', error);
          toast.warning("Status atualizado, mas houve um erro ao enviar o email.");
          abrirPopUpObservacoes();
        }
      }
    } else {
      // Se for pendente, não enviar email, mas ainda perguntar sobre observações
      const reservaAtualizada = localReservas.getById(reservaId);
      if (reservaAtualizada) {
        setReservaParaObservacoes(reservaAtualizada);
        setObservacoesInternas(reservaAtualizada.observacoesRestaurante || "");
        setMostrarCampoObservacoes(false);
        setObservacoesDialogOpen(true);
      }
    }
    
    setReservaParaAtualizarStatus(null);
    setRespostaClienteStatus("");
  };

  const handleSalvarObservacoesInternas = () => {
    if (!reservaParaObservacoes) return;

    const result = localReservas.update(reservaParaObservacoes.id, {
      observacoesRestaurante: observacoesInternas.trim() || undefined,
    });

    if (!result.success) {
      toast.error(result.error || "Erro ao salvar observações");
      return;
    }

    toast.success("Observações salvas com sucesso!");
    setObservacoesDialogOpen(false);
    setMostrarCampoObservacoes(false);
    setReservaParaObservacoes(null);
    setObservacoesInternas("");
    loadReservas();
  };

  const updateStatus = async (id: string, estado: EstadoReserva) => {
    const reserva = localReservas.getById(id);
    if (!reserva) {
      toast.error("Reserva não encontrada");
      return;
    }

    // Se for confirmar, mostrar diálogo de seleção de mesa
    if (estado === 'confirmado') {
      const mesasDisponiveisList = localReservas.getMesasDisponiveisParaReserva(
        reserva.data_reserva,
        reserva.hora_reserva
      );
      
      if (mesasDisponiveisList.length === 0) {
        toast.error("Não há mesas disponíveis para este horário. Por favor, verifique as mesas ocupadas.");
        return;
      }

      setMesasDisponiveis(mesasDisponiveisList);
      setReservaParaConfirmar(reserva);
      setMesaSelecionada(reserva.mesaId || null);
      setRespostaCliente(reserva.respostaCliente || "");
      setMesaDialogOpen(true);
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
      confirmado: "default",
      cancelado: "destructive",
      finalizado: "outline",
    };

    const labels: Record<EstadoReserva, string> = {
      pendente: "Pendente",
      confirmado: "Confirmado",
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
      <div className="flex gap-2 flex-wrap">
        {(["pendente", "confirmado", "cancelado", "finalizado", "todas"] as const).map((f) => (
          <Button
            key={f}
            variant={filtro === f ? "default" : "outline"}
            onClick={() => setFiltro(f)}
          >
            {f === "todas" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
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
                  <CardTitle className="text-lg">
                    {reserva.nome} {reserva.apelido}
                  </CardTitle>
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
                  {reserva.estado === 'confirmado' && reserva.confirmadoPeloCliente && (
                    <div className="md:col-span-2">
                      <p className="text-muted-foreground">Status do Cliente</p>
                      <p className="font-medium text-green-600">✓ Confirmado pelo cliente</p>
                    </div>
                  )}
                </div>

                {reserva.estado === 'confirmado' && (
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
                        <SelectItem value="confirmado">Confirmado</SelectItem>
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
      <Dialog open={mesaDialogOpen} onOpenChange={setMesaDialogOpen}>
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
                value={mesaSelecionada || undefined}
                onValueChange={(value) => {
                  if (value === "none") {
                    setMesaSelecionada(null);
                  } else {
                    setMesaSelecionada(value || null);
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

                  // Gerar novo token
                  const novoToken = crypto.randomUUID();

                  // Atualizar reserva com novas observações e novo token
                  const result = localReservas.update(reservaParaEditar.id, {
                    observacoesRestaurante: observacoesEditadas.trim() || undefined,
                    respostaCliente: respostaClienteEditada.trim() || reservaParaEditar.respostaCliente || undefined,
                    tokenConfirmacao: novoToken,
                    confirmadoPeloCliente: false, // Resetar confirmação do cliente
                  });

                  if (!result.success) {
                    toast.error(result.error || "Erro ao atualizar observações");
                    return;
                  }

                  toast.success("Observações atualizadas!");

                  // Enviar novo email ao cliente
                  const reservaAtualizada = localReservas.getById(reservaParaEditar.id);
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
                        tokenConfirmacao: novoToken,
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
