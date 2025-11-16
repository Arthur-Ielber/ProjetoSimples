import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { localMenu } from "@/lib/localStorage";
import { Loader2 } from "lucide-react";

interface MenuItem {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  secao: string;
}

interface MenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MenuModal = ({ open, onOpenChange }: MenuModalProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadMenu();
    }
  }, [open]);

  const loadMenu = () => {
    setLoading(true);
    const items = localMenu.getAll();
    // Ordenar por seção e nome
    const sorted = items.sort((a, b) => {
      if (a.secao !== b.secao) {
        return a.secao.localeCompare(b.secao);
      }
      return a.nome.localeCompare(b.nome);
    });
    setMenuItems(sorted);
    setLoading(false);
  };

  const sections = ["Entradas", "Pratos Principais", "Sobremesas", "Bebidas"];

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
              const items = menuItems.filter((item) => item.secao === section);
              if (items.length === 0) return null;

              return (
                <div key={section}>
                  <h3 className="text-2xl font-serif text-primary mb-4 border-b pb-2">
                    {section}
                  </h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-4">
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
