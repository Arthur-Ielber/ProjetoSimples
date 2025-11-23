import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MenuSection } from "@/lib/localStorage";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface MenuItem {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  secao: string;
  imagem_url: string | null;
}

interface MenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MenuModal = ({ open, onOpenChange }: MenuModalProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar apenas pratos ativos da API
      const items = await api.getEmentaAtivos();
      
      // Processar e ordenar itens
      const processedItems = items.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        preco: typeof item.preco === 'string' ? parseFloat(item.preco) : item.preco,
        secao: item.secao,
        imagem_url: item.imagem_url,
      }));
      
      // Ordenar por seção e nome
      const sorted = [...processedItems].sort((a, b) => {
        if (a.secao !== b.secao) {
          return a.secao.localeCompare(b.secao);
        }
        return a.nome.localeCompare(b.nome);
      });
      setMenuItems(sorted);
      
      // Carregar seções da API
      const sectionsData = await api.getMenuSecoes();
      const sortedSections = [...sectionsData].sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
      setSections(sortedSections);
    } catch (error) {
      console.error('Erro ao carregar menu:', error);
      setMenuItems([]);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadMenu();
    }
    
    // Atualizar menu a cada 30 segundos quando aberto
    const interval = setInterval(() => {
      if (open) {
        loadMenu();
      }
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [open, loadMenu]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif text-primary">
            Nossa Ementa
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8 py-4">
            {sections.map((section) => {
              const items = menuItems.filter((item) => item.secao === section.nome);
              if (items.length === 0) return null;

              return (
                <div key={section.id}>
                  <h3 className="text-2xl font-serif text-primary mb-4 border-b pb-2">
                    {section.nome}
                  </h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-start">
                        {/* Imagem do prato */}
                        {item.imagem_url && (
                          <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={item.imagem_url}
                              alt={item.nome}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback se a imagem não carregar
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{item.nome}</h4>
                            {item.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.descricao}
                              </p>
                            )}
                          </div>
                          <span className="font-semibold text-primary whitespace-nowrap">
                            €{item.preco.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
