import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Config {
  id: string;
  telefone: string;
  email: string;
  horario: string;
  historia: string;
  mapa_url: string | null;
}

export const ConfigTab = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("configuracoes")
      .select("*")
      .single();

    if (!error && data) {
      setConfig(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    const { error } = await supabase
      .from("configuracoes")
      .update({
        telefone: config.telefone,
        email: config.email,
        horario: config.horario,
        historia: config.historia,
        mapa_url: config.mapa_url,
      })
      .eq("id", config.id);

    if (error) {
      toast.error("Erro ao atualizar configurações");
    } else {
      toast.success("Configurações atualizadas com sucesso!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Informações do Restaurante</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={config.telefone}
              onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="horario">Horário de Funcionamento</Label>
            <Textarea
              id="horario"
              value={config.horario}
              onChange={(e) => setConfig({ ...config, horario: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="historia">História do Restaurante</Label>
            <Textarea
              id="historia"
              value={config.historia}
              onChange={(e) => setConfig({ ...config, historia: e.target.value })}
              rows={5}
              required
            />
          </div>

          <div>
            <Label htmlFor="mapa_url">URL do Google Maps (iframe)</Label>
            <Input
              id="mapa_url"
              type="url"
              value={config.mapa_url || ""}
              onChange={(e) => setConfig({ ...config, mapa_url: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "A guardar..." : "Guardar Alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
