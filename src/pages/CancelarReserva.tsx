import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export const CancelarReserva = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'notfound'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    const cancelarReserva = async () => {
      if (!token) {
        setStatus('error');
        setMessage("Token inválido");
        setLoading(false);
        return;
      }

      try {
        // Buscar reserva pelo token de cancelamento na API
        const reservas = await api.getReservas();
        const reserva = reservas.find((r: any) => r.token_cancelamento === token);

        if (!reserva) {
          setStatus('notfound');
          setMessage("Reserva não encontrada ou token inválido. Este token pode ter sido usado anteriormente.");
          setLoading(false);
          return;
        }

        // Verificar se a reserva já foi cancelada ou finalizada
        if (reserva.estado === 'cancelado' || reserva.estado === 'finalizado') {
          setStatus('error');
          setMessage("Esta reserva já foi cancelada ou finalizada");
          setLoading(false);
          return;
        }
        
        // Verificar se a reserva já foi confirmada pelo cliente
        if (reserva.confirmado_pelo_cliente === 1 || reserva.confirmado_pelo_cliente === true) {
          setStatus('error');
          setMessage("Esta reserva já foi confirmada pelo cliente e não pode ser cancelada.");
          setLoading(false);
          return;
        }
        
        // Verificar se a reserva já está confirmada pelo cliente
        if (reserva.estado === 'confirmado_cliente') {
          setStatus('error');
          setMessage("Esta reserva já está confirmada pelo cliente e não pode ser cancelada.");
          setLoading(false);
          return;
        }

        // Cancelar a reserva na API e invalidar ambos os tokens
        await api.updateReserva(reserva.id, { 
          estado: 'cancelado',
          token_confirmacao: null, // Invalidar token de confirmação quando cancelar
          token_cancelamento: null  // Invalidar token de cancelamento após uso
        });

        // Adicionar observação indicando que o cliente cancelou
        try {
          await api.addReservaObservacao(reserva.id, {
            mensagem: "Cliente cancelou a reserva através do link do email.",
            autor: 'cliente',
            autor_nome: `${reserva.nome} ${reserva.apelido}`
          });
        } catch (obsError) {
          console.error('Erro ao adicionar observação:', obsError);
          // Continuar mesmo se falhar
        }

        setStatus('success');
        setMessage("Reserva cancelada com sucesso. Sentimos muito que não possa comparecer.");
        setLoading(false);

        // Redirecionar após 3 segundos
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        setStatus('error');
        setMessage("Erro ao processar cancelamento da reserva");
        setLoading(false);
      }
    };

    cancelarReserva();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Cancelamento de Reserva</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {loading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p>Processando cancelamento...</p>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-orange-500 mx-auto" />
              <p className="text-lg font-semibold text-orange-600">{message}</p>
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

