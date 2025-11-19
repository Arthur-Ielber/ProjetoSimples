import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { localReservas } from "@/lib/localStorage";
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
    if (!token) {
      setStatus('error');
      setMessage("Token inválido");
      setLoading(false);
      return;
    }

    // Buscar reserva pelo token
    const reservas = localReservas.getAll();
    const reserva = reservas.find(r => r.tokenConfirmacao === token);

    if (!reserva) {
      setStatus('notfound');
      setMessage("Reserva não encontrada ou token inválido");
      setLoading(false);
      return;
    }

    if (reserva.estado !== 'confirmado') {
      setStatus('error');
      setMessage("Esta reserva não está aguardando confirmação");
      setLoading(false);
      return;
    }

    // Marcar que o cliente confirmou a reserva
    const result = localReservas.update(reserva.id, { 
      confirmadoPeloCliente: true 
    });

    if (!result.success) {
      setStatus('error');
      setMessage("Erro ao confirmar reserva");
      setLoading(false);
      return;
    }
    
    setStatus('success');
    setMessage("Reserva confirmada com sucesso! Aguardamos a sua visita.");
    setLoading(false);

    // Redirecionar após 3 segundos
    setTimeout(() => {
      navigate("/");
    }, 3000);
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

