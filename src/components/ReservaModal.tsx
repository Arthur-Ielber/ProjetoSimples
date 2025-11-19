import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { localReservas } from "@/lib/localStorage";
import { emailService } from "@/lib/emailService";
import { toast } from "sonner";
import { z } from "zod";

interface ReservaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reservaSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  apelido: z.string().trim().min(2, "Apelido deve ter pelo menos 2 caracteres").max(100),
  telefone: z.string().trim().min(9, "Telefone inválido").max(20),
  email: z.string().trim().email("Email inválido").max(255),
  data_reserva: z.string().min(1, "Data é obrigatória"),
  hora_reserva: z.string().min(1, "Hora é obrigatória"),
  numero_pessoas: z.number().min(1, "Mínimo 1 pessoa").max(20, "Máximo 20 pessoas"),
  mesaId: z.string().nullable().optional(),
});

export const ReservaModal = ({ open, onOpenChange }: ReservaModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    apelido: "",
    telefone: "",
    email: "",
    data_reserva: "",
    hora_reserva: "",
    numero_pessoas: 2,
    observacoes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = reservaSchema.parse(formData);

      const result = localReservas.create(
        {
          nome: validated.nome,
          apelido: validated.apelido,
          telefone: validated.telefone,
          email: validated.email,
          data_reserva: validated.data_reserva,
          hora_reserva: validated.hora_reserva,
          numero_pessoas: validated.numero_pessoas,
          mesaId: null, // Cliente não pode selecionar mesa - apenas o restaurante
        },
        formData.observacoes.trim() || undefined
      );

      if (!result.success) {
        throw new Error(result.error || "Erro ao criar reserva");
      }

      // Enviar email de confirmação de recebimento
      try {
        console.log('Enviando email de confirmação para:', validated.email);
        const emailResult = await emailService.sendReservationConfirmation({
          email: validated.email,
          nome: validated.nome,
          apelido: validated.apelido,
          data_reserva: validated.data_reserva,
          hora_reserva: validated.hora_reserva,
          numero_pessoas: validated.numero_pessoas,
        });

        if (emailResult.success) {
          console.log('Email de confirmação enviado com sucesso');
        } else {
          console.error('Erro ao enviar email de confirmação:', emailResult.error);
          toast.warning("Reserva criada, mas não foi possível enviar o email de confirmação.");
        }
      } catch (error) {
        console.error('Erro ao enviar email de confirmação:', error);
        toast.warning("Reserva criada, mas houve um erro ao enviar o email de confirmação.");
        // Não bloquear a criação da reserva se o email falhar
      }

      toast.success("Pedido de reserva enviado com sucesso!", {
        description: "Receberá um email de confirmação em breve.",
      });

      onOpenChange(false);
      setFormData({
        nome: "",
        apelido: "",
        telefone: "",
        email: "",
        data_reserva: "",
        hora_reserva: "",
        numero_pessoas: 2,
        observacoes: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao enviar pedido de reserva");
      }
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-primary">
            Reservar Mesa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="apelido">Apelido</Label>
              <Input
                id="apelido"
                value={formData.apelido}
                onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                required
                maxLength={100}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
              maxLength={20}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              maxLength={255}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_reserva">Data</Label>
              <Input
                id="data_reserva"
                type="date"
                value={formData.data_reserva}
                onChange={(e) => setFormData({ ...formData, data_reserva: e.target.value })}
                min={minDate}
                required
              />
            </div>
            <div>
              <Label htmlFor="hora_reserva">Hora</Label>
              <Input
                id="hora_reserva"
                type="time"
                value={formData.hora_reserva}
                onChange={(e) => setFormData({ ...formData, hora_reserva: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="numero_pessoas">Número de Pessoas</Label>
            <Input
              id="numero_pessoas"
              type="number"
              value={formData.numero_pessoas}
              onChange={(e) =>
                setFormData({ ...formData, numero_pessoas: parseInt(e.target.value) || 1 })
              }
              min={1}
              max={20}
              required
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Mesa perto da janela, aniversário, restrições alimentares..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.observacoes.length}/500 caracteres
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A enviar..." : "Pedir Reserva"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
