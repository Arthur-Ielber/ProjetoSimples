import { useEffect, useState } from "react";
import { localReservas, Reserva as LocalReserva } from "@/lib/localStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

type Reserva = LocalReserva;

export const ReservasTab = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtro, setFiltro] = useState<"todas" | "pendente" | "confirmado" | "rejeitado">("pendente");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservas();
    // Atualizar a cada 2 segundos para simular tempo real (opcional)
    const interval = setInterval(loadReservas, 2000);
    return () => clearInterval(interval);
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

  const updateStatus = (id: string, estado: "confirmado" | "rejeitado") => {
    const result = localReservas.update(id, { estado });

    if (!result.success) {
      toast.error(result.error || "Erro ao atualizar reserva");
    } else {
      toast.success(
        estado === "confirmado" ? "Reserva confirmada!" : "Reserva rejeitada!"
      );
      loadReservas();
    }
  };

  const reservasFiltradas =
    filtro === "todas"
      ? reservas
      : reservas.filter((r) => r.estado === filtro);

  const getStatusBadge = (estado: string) => {
    const variants = {
      pendente: "secondary",
      confirmado: "default",
      rejeitado: "destructive",
    } as const;

    return (
      <Badge variant={variants[estado as keyof typeof variants]}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {(["pendente", "confirmado", "rejeitado", "todas"] as const).map((f) => (
          <Button
            key={f}
            variant={filtro === f ? "default" : "outline"}
            onClick={() => setFiltro(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
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

                {reserva.estado === "pendente" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateStatus(reserva.id, "confirmado")}
                      className="flex-1"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(reserva.id, "rejeitado")}
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
