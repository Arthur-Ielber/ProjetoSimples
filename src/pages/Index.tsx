import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MenuModal } from "@/components/MenuModal";
import { ReservaModal } from "@/components/ReservaModal";
import { localConfig, localMenu } from "@/lib/localStorage";
import { Phone, Mail, Clock, MapPin, Home, UtensilsCrossed, Calendar, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
}

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reservaOpen, setReservaOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [pratosDestaque, setPratosDestaque] = useState<PratoDestaque[]>([]);
  const [allDestaquesOpen, setAllDestaquesOpen] = useState(false);
  const [totalDestaques, setTotalDestaques] = useState(0);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    loadConfig();
    loadPratosDestaque();
    
    // Atualizar pratos em destaque quando houver mudanças (outras abas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'table_menu_ementa') {
        loadPratosDestaque();
      }
    };
    
    // Atualizar pratos em destaque quando houver mudanças (mesma aba)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail?.key === 'table_menu_ementa') {
        loadPratosDestaque();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, []);

  const loadConfig = () => {
    const data = localConfig.get();
    setConfig(data);
  };

  const loadPratosDestaque = () => {
    const items = localMenu.getByDestaque();
    setTotalDestaques(items.length);
    // Pegar apenas os 3 primeiros para exibição
    const pratos = items.slice(0, 3).map(item => ({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      preco: item.preco,
      imagem_url: item.imagem_url,
    }));
    setPratosDestaque(pratos);
  };
  
  const getAllPratosDestaque = (): PratoDestaque[] => {
    const items = localMenu.getByDestaque();
    return items.map(item => ({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      preco: item.preco,
      imagem_url: item.imagem_url,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={scrollToTop} className="text-2xl font-serif font-bold text-primary hover:text-primary/90 transition-colors">
              Sabores de Alfama
            </button>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={scrollToTop} className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">
                <Home size={18} />
                <span>Início</span>
              </button>
              <button 
                onClick={() => setMenuOpen(true)}
                className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                <UtensilsCrossed size={18} />
                <span>Ementa</span>
              </button>
              <button 
                onClick={() => setReservaOpen(true)}
                className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                <Calendar size={18} />
                <span>Reservas</span>
              </button>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  <span>{config?.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span>Lisboa</span>
                </div>
              </div>
              <Button onClick={() => setReservaOpen(true)} className="shadow-elegant">
                Reservar Mesa
              </Button>
            </div>

            {/* Mobile Menu */}
            <div className="flex md:hidden items-center gap-2">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu size={24} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col gap-6 mt-8">
                    <button 
                      onClick={() => {
                        scrollToTop();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <Home size={20} />
                      <span>Início</span>
                    </button>
                    <button 
                      onClick={() => {
                        setMenuOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <UtensilsCrossed size={20} />
                      <span>Ementa</span>
                    </button>
                    <button 
                      onClick={() => {
                        setReservaOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <Calendar size={20} />
                      <span>Reservas</span>
                    </button>
                    <div className="border-t pt-6 space-y-4">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Phone size={16} className="text-primary" />
                        <span>{config?.telefone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <MapPin size={16} className="text-primary" />
                        <span>Lisboa</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setReservaOpen(true);
                        setMobileMenuOpen(false);
                      }} 
                      className="w-full shadow-elegant mt-4"
                    >
                      Reservar Mesa
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative text-primary-foreground py-32 px-6 overflow-hidden min-h-[600px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop')",
          }}
        ></div>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Sabores Tradicionais
          </h1>
          <p className="text-2xl md:text-3xl mb-3 font-serif text-accent animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            de Lisboa
          </p>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            Experiência gastronómica única no coração de Alfama
          </p>
          <div className="flex flex-wrap gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <Button
              size="lg"
              onClick={() => setReservaOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant"
            >
              Reservar Mesa
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setMenuOpen(true)}
              className="shadow-elegant"
            >
              Ver Menu
            </Button>
          </div>
        </div>
      </section>

      {/* História Section */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-8 text-foreground">
                A Nossa História
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
                {config?.historia || "Carregando..."}
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/5">
                  <div className="p-3 rounded-full bg-accent/10">
                    <MapPin className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-foreground">Morada</h3>
                    <p className="text-muted-foreground text-sm">Rua das Flores, 123, 1200-195 Lisboa</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/5">
                  <div className="p-3 rounded-full bg-accent/10">
                    <Clock className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-foreground">Horário</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-line">{config?.horario}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/5">
                  <div className="p-3 rounded-full bg-accent/10">
                    <Phone className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-foreground">Contacto</h3>
                    <p className="text-muted-foreground text-sm">{config?.telefone}</p>
                    <p className="text-muted-foreground text-sm">{config?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-elegant h-[600px]">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop"
                alt="Interior do Restaurante"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes */}
      <section className="py-20 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
              Os Nossos Pratos Mais Populares
            </h2>
            <p className="text-muted-foreground text-lg">
              Experiências culinárias que definem a nossa cozinha
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pratosDestaque.map((prato) => (
              <div
                key={prato.id}
                className="gradient-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {prato.imagem_url ? (
                    <img
                      src={prato.imagem_url}
                      alt={prato.nome}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">
                    {prato.nome}
                  </h3>
                  {prato.descricao && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {prato.descricao}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      €{prato.preco.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {totalDestaques > 3 && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setAllDestaquesOpen(true)}
                className="shadow-soft"
              >
                Ver Todos os Pratos em Destaque ({totalDestaques})
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Map Section */}
      {config?.mapa_url && (
        <section className="py-20 px-6 bg-background">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
                Visite-nos
              </h2>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-elegant">
              <iframe
                src={config.mapa_url}
                width="100%"
                height="500"
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
      <footer className="bg-foreground text-background py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-serif font-bold mb-2">Sabor Autêntico</h3>
            <p className="text-background/70">
              © 2024 Sabor Autêntico. Todos os direitos reservados.
            </p>
          </div>
          <div className="text-center mt-4">
            <Link 
              to="/admin" 
              className="text-xs text-background/40 hover:text-background/60 transition-colors opacity-50 hover:opacity-70"
            >
              Área Administrativa
            </Link>
          </div>
        </div>
      </footer>

      <MenuModal open={menuOpen} onOpenChange={setMenuOpen} />
      <ReservaModal open={reservaOpen} onOpenChange={setReservaOpen} />
      
      {/* Modal de Todos os Pratos Destaques */}
      <Dialog open={allDestaquesOpen} onOpenChange={setAllDestaquesOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-serif text-primary">
              Todos os Pratos em Destaque
            </DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
            {getAllPratosDestaque().map((prato) => (
              <div
                key={prato.id}
                className="gradient-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {prato.imagem_url ? (
                    <img
                      src={prato.imagem_url}
                      alt={prato.nome}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-semibold mb-2 text-foreground">
                    {prato.nome}
                  </h3>
                  {prato.descricao && (
                    <p className="text-muted-foreground text-sm mb-4">
                      {prato.descricao}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      €{prato.preco.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
