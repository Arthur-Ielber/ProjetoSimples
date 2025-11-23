import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export const ConfirmarReserva = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'notfound'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmarReserva = async () => {
      if (!token) {
        setStatus('error');
        setMessage("Token inválido");
        setLoading(false);
        return;
      }

      try {
        // Buscar reserva pelo token de confirmação na API
        const reservas = await api.getReservas();
        const reserva = reservas.find((r: any) => r.token_confirmacao === token);

        if (!reserva) {
          setStatus('notfound');
          setMessage("Reserva não encontrada ou token inválido. Este token pode ter sido usado anteriormente.");
          setLoading(false);
          return;
        }
        
        // Verificar se o token já foi usado (se confirmado_pelo_cliente já é true)
        if (reserva.confirmado_pelo_cliente === 1 || reserva.confirmado_pelo_cliente === true) {
          setStatus('error');
          setMessage("Esta reserva já foi confirmada anteriormente. O token não pode ser usado novamente.");
          setLoading(false);
          return;
        }

        // Verificar se a reserva já foi cancelada ou finalizada
        if (reserva.estado === 'cancelado' || reserva.estado === 'finalizado') {
          setStatus('error');
          setMessage("Esta reserva já foi cancelada ou finalizada e não pode ser confirmada.");
          setLoading(false);
          return;
        }
        
        // Verificar se a reserva já foi cancelada pelo cliente (mesmo que o estado ainda não seja 'cancelado')
        if (reserva.estado === 'cancelado') {
          setStatus('error');
          setMessage("Esta reserva já foi cancelada e não pode ser confirmada.");
          setLoading(false);
          return;
        }

        // Sempre atualizar o campo confirmado_pelo_cliente quando o cliente confirmar pelo token
        console.log('[CONFIRMAR RESERVA] Atualizando reserva com confirmado_pelo_cliente = 1');
        console.log('[CONFIRMAR RESERVA] Reserva atual:', {
          id: reserva.id,
          estado: reserva.estado,
          confirmado_pelo_cliente: reserva.confirmado_pelo_cliente
        });
        
        // Se a reserva estiver aguardando_cliente, atualizar para confirmado_cliente
        // IMPORTANTE: Invalidar ambos os tokens após a confirmação para evitar uso múltiplo
        // IMPORTANTE: Preservar a mesa_id ao atualizar
        if (reserva.estado === 'aguardando_cliente') {
          try {
            const result = await api.updateReserva(reserva.id, {
              estado: 'confirmado_cliente',
              confirmado_pelo_cliente: 1,
              mesa_id: reserva.mesa_id, // Preservar a mesa atribuída
              token_confirmacao: null, // Invalidar token de confirmação após uso
              token_cancelamento: null  // Invalidar token de cancelamento quando confirmar
            });
            console.log('[CONFIRMAR RESERVA] Reserva atualizada (aguardando_cliente -> confirmado_cliente) e tokens invalidados:', result);
            console.log('[CONFIRMAR RESERVA] Mesa preservada:', reserva.mesa_id);
          } catch (updateError) {
            console.error('[CONFIRMAR RESERVA] Erro ao atualizar estado da reserva:', updateError);
            // Continuar mesmo se falhar
          }
        } else if (reserva.estado === 'pendente') {
          // Se estiver pendente, mudar para confirmado_cliente diretamente (caso especial)
          try {
            const result = await api.updateReserva(reserva.id, {
              estado: 'confirmado_cliente',
              confirmado_pelo_cliente: 1,
              mesa_id: reserva.mesa_id, // Preservar a mesa se houver
              token_confirmacao: null,
              token_cancelamento: null
            });
            console.log('[CONFIRMAR RESERVA] Reserva atualizada (pendente -> confirmado_cliente) e tokens invalidados:', result);
            console.log('[CONFIRMAR RESERVA] Mesa preservada:', reserva.mesa_id);
          } catch (updateError) {
            console.error('[CONFIRMAR RESERVA] Erro ao atualizar estado da reserva:', updateError);
          }
        } else {
          // Se já estiver confirmado_cliente, apenas invalidar tokens e preservar mesa
          try {
            const result = await api.updateReserva(reserva.id, {
              mesa_id: reserva.mesa_id, // Preservar a mesa
              token_confirmacao: null, // Invalidar token de confirmação após uso
              token_cancelamento: null // Invalidar token de cancelamento quando confirmar
            });
            console.log('[CONFIRMAR RESERVA] Tokens invalidados (já estava confirmado_cliente):', result);
            console.log('[CONFIRMAR RESERVA] Mesa preservada:', reserva.mesa_id);
          } catch (updateError) {
            console.error('[CONFIRMAR RESERVA] Erro ao invalidar tokens:', updateError);
            // Continuar mesmo se falhar
          }
        }
        
        // Verificar se foi atualizado corretamente
        try {
          const reservaAtualizada = await api.getReservaById(reserva.id);
          console.log('[CONFIRMAR RESERVA] Reserva após atualização:', {
            id: reservaAtualizada.id,
            estado: reservaAtualizada.estado,
            confirmado_pelo_cliente: reservaAtualizada.confirmado_pelo_cliente,
            tipo: typeof reservaAtualizada.confirmado_pelo_cliente
          });
        } catch (error) {
          console.error('[CONFIRMAR RESERVA] Erro ao verificar reserva atualizada:', error);
        }

        // Adicionar observação indicando que o cliente confirmou
        try {
          await api.addReservaObservacao(reserva.id, {
            mensagem: "Cliente confirmou a reserva através do link do email.",
            autor: 'cliente',
            autor_nome: `${reserva.nome} ${reserva.apelido}`
          });
        } catch (obsError) {
          console.error('Erro ao adicionar observação:', obsError);
          // Continuar mesmo se falhar
        }
        
        setStatus('success');
        setMessage("Reserva confirmada com sucesso! Aguardamos a sua visita.");
        setLoading(false);

        // Redirecionar após 3 segundos
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } catch (error) {
        console.error('Erro ao confirmar reserva:', error);
        setStatus('error');
        setMessage("Erro ao processar confirmação da reserva");
        setLoading(false);
      }
    };

    confirmarReserva();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Confirmação de Reserva</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {loading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p>Processando confirmação...</p>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-semibold text-green-600">{message}</p>
              <p className="text-sm text-muted-foreground">
                Redirecionando para a página inicial...
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-lg font-semibold text-red-600">{message}</p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Voltar ao Início
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

