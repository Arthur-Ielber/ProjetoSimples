import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MenuModal } from "@/components/MenuModal";
import { ReservaModal } from "@/components/ReservaModal";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface Config {
  telefone: string;
  email: string;
  horario: string;
  historia: string;
  mapa_url: string | null;
}

interface PratoDestaque {
  id: string;
  nome: string;
  imagem_url: string | null;
}

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reservaOpen, setReservaOpen] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [pratosDestaque, setPratosDestaque] = useState<PratoDestaque[]>([]);

  useEffect(() => {
    loadConfig();
    loadPratosDestaque();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase.from("configuracoes").select("*").single();
    if (data) setConfig(data);
  };

  const loadPratosDestaque = async () => {
    const { data } = await supabase
      .from("ementa")
      .select("id, nome, imagem_url")
      .eq("destaque", true)
      .limit(3);
    if (data) setPratosDestaque(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative gradient-hero text-primary-foreground py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Restaurante Português
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            {config?.historia || "Carregando..."}
          </p>
          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setMenuOpen(true)}
              className="shadow-elegant"
            >
              Ver Ementa
            </Button>
            <Button
              size="lg"
              onClick={() => setReservaOpen(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-elegant"
            >
              Reservar Mesa
            </Button>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-3">
              <Phone className="text-primary mt-1" size={20} />
              <div>
                <h3 className="font-semibold mb-1">Telefone</h3>
                <p className="text-muted-foreground">{config?.telefone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="text-primary mt-1" size={20} />
              <div>
                <h3 className="font-semibold mb-1">Email</h3>
                <p className="text-muted-foreground">{config?.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="text-primary mt-1" size={20} />
              <div>
                <h3 className="font-semibold mb-1">Horário</h3>
                <p className="text-muted-foreground whitespace-pre-line">{config?.horario}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="text-primary mt-1" size={20} />
              <div>
                <h3 className="font-semibold mb-1">Localização</h3>
                <p className="text-muted-foreground">Lisboa, Portugal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-serif font-bold text-center mb-12 text-primary">
            Os Nossos Pratos Mais Populares
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {pratosDestaque.map((prato) => (
              <div
                key={prato.id}
                className="gradient-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-muted">
                  {prato.imagem_url && (
                    <img
                      src={prato.imagem_url}
                      alt={prato.nome}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-semibold text-center">
                    {prato.nome}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      {config?.mapa_url && (
        <section className="py-16 px-6 bg-card">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-4xl font-serif font-bold text-center mb-12 text-primary">
              Encontre-nos
            </h2>
            <div className="rounded-2xl overflow-hidden shadow-elegant">
              <iframe
                src={config.mapa_url}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização do Restaurante"
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="mb-2">© 2024 Restaurante Português. Todos os direitos reservados.</p>
          <Link to="/admin" className="text-sm opacity-70 hover:opacity-100 transition-opacity">
            Admin
          </Link>
        </div>
      </footer>

      <MenuModal open={menuOpen} onOpenChange={setMenuOpen} />
      <ReservaModal open={reservaOpen} onOpenChange={setReservaOpen} />
    </div>
  );
};

export default Index;
