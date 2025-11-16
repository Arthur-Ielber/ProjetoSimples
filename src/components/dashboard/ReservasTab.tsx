import { useEffect, useState, useRef } from "react";
import { localReservas, Reserva as LocalReserva, Observacao } from "@/lib/localStorage";
import { localAuth } from "@/lib/localAuth";
import { emailService, EmailReply } from "@/lib/emailService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send } from "lucide-react";

type Reserva = LocalReserva;

type EstadoReserva = 'pendente' | 'confirmado' | 'cancelado' | 'finalizado';
type FiltroReserva = 'todas' | EstadoReserva;

export const ReservasTab = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtro, setFiltro] = useState<FiltroReserva>("pendente");
  const [loading, setLoading] = useState(true);
  const [observacoesAbertas, setObservacoesAbertas] = useState<Set<string>>(new Set());
  const [novaObservacao, setNovaObservacao] = useState<Record<string, string>>({});
  const processedEmailsRef = useRef<Set<number>>(new Set()); // IDs de emails já processados

  // Função para verificar emails recebidos e adicionar como observações
  const checkForEmailReplies = async () => {
    try {
      const result = await emailService.checkEmailReplies();
      
      if (!result.success || !result.replies || result.replies.length === 0) {
        return;
      }

      // Obter todas as reservas para associar emails
      const todasReservas = localReservas.getAll();

      for (const reply of result.replies) {
        // Pular se já processamos este email
        if (processedEmailsRef.current.has(reply.messageId)) {
          continue;
        }

        // Extrair email do remetente (formato: "Nome <email@exemplo.com>" ou "email@exemplo.com")
        const emailMatch = reply.from.match(/<(.+)>/) || reply.from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const clienteEmail = emailMatch ? emailMatch[1] || emailMatch[0] : null;

        if (!clienteEmail) continue;

        // Encontrar reserva pelo email do cliente
        const reserva = todasReservas.find(r => 
          r.email.toLowerCase() === clienteEmail.toLowerCase()
        );

        if (reserva && reply.message && reply.message.trim().length > 10) {
          // Adicionar resposta como observação do cliente
          const nomeCliente = reserva.nome || clienteEmail.split('@')[0];
          
          const resultAdd = localReservas.addObservacao(
            reserva.id,
            reply.message.trim(),
            'cliente',
            nomeCliente
          );

          if (resultAdd.success) {
            processedEmailsRef.current.add(reply.messageId);
            loadReservas(); // Recarregar para mostrar a nova observação
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar emails recebidos:', error);
    }
  };

  useEffect(() => {
    loadReservas();
    
    // Listener para mudanças no localStorage
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'table_menu_reservas') {
        loadReservas();
      }
    };
    
    window.addEventListener('localStorageChange', handleStorageChange);
    
    // Atualizar a cada 2 segundos para simular tempo real (opcional)
    const interval = setInterval(loadReservas, 2000);
    
    // Verificar emails recebidos a cada 30 segundos
    const emailCheckInterval = setInterval(checkForEmailReplies, 30000);
    
    // Verificar imediatamente ao carregar
    checkForEmailReplies();
    
    return () => {
      clearInterval(interval);
      clearInterval(emailCheckInterval);
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

  const updateStatus = async (id: string, estado: EstadoReserva) => {
    const result = localReservas.update(id, { estado });

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
    toast.success(mensagens[estado]);

    // Recarregar reservas para obter dados atualizados
    loadReservas();

    // Enviar email ao cliente (apenas se não for pendente, pois pendente é o estado inicial)
    if (estado !== 'pendente') {
      const reservaAtualizada = localReservas.getById(id);
      if (reservaAtualizada) {
        try {
          const emailResult = await emailService.sendReservationEmail({
            email: reservaAtualizada.email,
            nome: reservaAtualizada.nome,
            apelido: reservaAtualizada.apelido,
            data_reserva: reservaAtualizada.data_reserva,
            hora_reserva: reservaAtualizada.hora_reserva,
            numero_pessoas: reservaAtualizada.numero_pessoas,
            estado: reservaAtualizada.estado,
            observacoes: reservaAtualizada.observacoes || [],
          });

          if (emailResult.success) {
            toast.success("Email enviado ao cliente com sucesso!");
          } else {
            toast.warning(`Status atualizado, mas email não foi enviado: ${emailResult.error}`);
          }
        } catch (error) {
          console.error('Erro ao enviar email:', error);
          toast.warning("Status atualizado, mas houve um erro ao enviar o email.");
        }
      }
    }
  };

  const toggleObservacoes = (reservaId: string) => {
    const novas = new Set(observacoesAbertas);
    if (novas.has(reservaId)) {
      novas.delete(reservaId);
    } else {
      novas.add(reservaId);
    }
    setObservacoesAbertas(novas);
  };

  const adicionarObservacao = async (reservaId: string) => {
    const mensagem = novaObservacao[reservaId]?.trim();
    if (!mensagem) {
      toast.error("Por favor, escreva uma observação");
      return;
    }

    const user = localAuth.getCurrentUser();
    // Extrair nome do email (parte antes do @) ou usar email completo
    const autorNome = user?.email 
      ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)
      : "Usuário do Restaurante";

    const result = localReservas.addObservacao(reservaId, mensagem, "admin", autorNome);

    if (!result.success) {
      toast.error(result.error || "Erro ao adicionar observação");
      return;
    }

    toast.success("Observação adicionada com sucesso!");
    setNovaObservacao({ ...novaObservacao, [reservaId]: "" });
    
    // Recarregar reservas para obter dados atualizados
    loadReservas();

    // Enviar email ao cliente com a nova observação
    const reservaAtualizada = localReservas.getById(reservaId);
    if (reservaAtualizada) {
      try {
        const emailResult = await emailService.sendReservationEmail({
          email: reservaAtualizada.email,
          nome: reservaAtualizada.nome,
          apelido: reservaAtualizada.apelido,
          data_reserva: reservaAtualizada.data_reserva,
          hora_reserva: reservaAtualizada.hora_reserva,
          numero_pessoas: reservaAtualizada.numero_pessoas,
          estado: reservaAtualizada.estado,
          observacoes: reservaAtualizada.observacoes || [],
        });

        if (emailResult.success) {
          toast.success("Email com observação enviado ao cliente!");
        } else {
          toast.warning(`Observação adicionada, mas email não foi enviado: ${emailResult.error}`);
        }
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        toast.warning("Observação adicionada, mas houve um erro ao enviar o email.");
      }
    }
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
                </div>

                {/* Seção de Observações */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Observações ({reserva.observacoes?.length || 0})
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleObservacoes(reserva.id)}
                    >
                      {observacoesAbertas.has(reserva.id) ? "Ocultar" : "Ver"}
                    </Button>
                  </div>

                  {observacoesAbertas.has(reserva.id) && (
                    <div className="space-y-3">
                      {/* Histórico de Observações */}
                      {reserva.observacoes && reserva.observacoes.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {reserva.observacoes.map((obs: Observacao) => (
                            <div
                              key={obs.id}
                              className={`p-3 rounded-lg text-sm ${
                                obs.autor === "cliente"
                                  ? "bg-accent/30 border border-accent/50"
                                  : "bg-primary/5 border border-primary/20"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={obs.autor === "cliente" ? "secondary" : "default"}
                                    className="text-xs"
                                  >
                                    {obs.autor === "cliente" ? "Cliente" : "Restaurante"}
                                  </Badge>
                                  {obs.autor_nome && (
                                    <span className="text-xs text-muted-foreground">
                                      {obs.autor === "cliente" 
                                        ? obs.autor_nome 
                                        : obs.autor_nome}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(obs.created_at).toLocaleDateString("pt-PT", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-foreground whitespace-pre-wrap">{obs.mensagem}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma observação ainda
                        </p>
                      )}

                      {/* Campo para adicionar nova observação (apenas para admins) */}
                      <div className="space-y-2 pt-2 border-t">
                        <Label htmlFor={`obs-${reserva.id}`} className="text-sm">
                          Adicionar Observação
                        </Label>
                        <div className="flex gap-2">
                          <Textarea
                            id={`obs-${reserva.id}`}
                            value={novaObservacao[reserva.id] || ""}
                            onChange={(e) =>
                              setNovaObservacao({
                                ...novaObservacao,
                                [reserva.id]: e.target.value,
                              })
                            }
                            placeholder="Escreva uma observação para o cliente..."
                            rows={2}
                            maxLength={500}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => adicionarObservacao(reserva.id)}
                            disabled={!novaObservacao[reserva.id]?.trim()}
                            className="self-end"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(novaObservacao[reserva.id]?.length || 0)}/500 caracteres
                        </p>
                      </div>
                    </div>
                  )}
                </div>

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
    </div>
  );
};
