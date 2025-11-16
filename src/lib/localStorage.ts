// Serviços de armazenamento local para substituir Supabase temporariamente

// ========== CONFIGURAÇÕES ==========
export interface Config {
  id: string;
  telefone: string;
  email: string;
  horario: string;
  historia: string;
  mapa_url: string | null;
  created_at: string;
  updated_at: string;
}

const CONFIG_STORAGE_KEY = 'table_menu_config';

const defaultConfig: Config = {
  id: 'config-1',
  telefone: '+351 21 123 4567',
  email: 'contato@restaurante.pt',
  horario: 'Segunda a Sábado: 12:00 - 23:00 | Domingo: 12:00 - 22:00',
  historia: 'Desde 1985, o nosso restaurante tem servido a melhor gastronomia portuguesa com um toque contemporâneo. Combinamos tradição, qualidade e paixão em cada prato.',
  mapa_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.7269739394823!2d-9.142685!3d38.708163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDQyJzI5LjQiTiA5wrAwOCczMy43Ilc!5e0!3m2!1spt-PT!2spt!4v1234567890',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const localConfig = {
  get: (): Config => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Inicializar com valores padrão
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(defaultConfig));
      return defaultConfig;
    } catch {
      return defaultConfig;
    }
  },

  update: (config: Partial<Config>): { success: boolean; data?: Config; error?: string } => {
    try {
      const current = localConfig.get();
      const updated: Config = {
        ...current,
        ...config,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar configurações' };
    }
  },
};

// ========== EMENTA ==========
export interface MenuItem {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  secao: 'Entradas' | 'Pratos Principais' | 'Sobremesas' | 'Bebidas';
  destaque: boolean;
  imagem_url: string | null;
  created_at: string;
  updated_at: string;
}

const MENU_STORAGE_KEY = 'table_menu_ementa';

const defaultMenuItems: MenuItem[] = [
  {
    id: '1',
    nome: 'Bacalhau à Brás',
    descricao: 'Bacalhau desfiado com batata palha, cebola e ovos',
    preco: 16.50,
    secao: 'Pratos Principais',
    destaque: true,
    imagem_url: 'https://placehold.co/400x300/C84B31/FFF?text=Bacalhau',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    nome: 'Polvo à Lagareiro',
    descricao: 'Polvo assado com batatas a murro e azeite',
    preco: 22.00,
    secao: 'Pratos Principais',
    destaque: true,
    imagem_url: 'https://placehold.co/400x300/C84B31/FFF?text=Polvo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    nome: 'Bife à Portuguesa',
    descricao: 'Bife grelhado com molho especial e batata frita',
    preco: 18.50,
    secao: 'Pratos Principais',
    destaque: true,
    imagem_url: 'https://placehold.co/400x300/C84B31/FFF?text=Bife',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    nome: 'Caldo Verde',
    descricao: 'Sopa tradicional portuguesa',
    preco: 4.50,
    secao: 'Entradas',
    destaque: false,
    imagem_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    nome: 'Pastéis de Bacalhau',
    descricao: '4 unidades de pastéis crocantes',
    preco: 6.00,
    secao: 'Entradas',
    destaque: false,
    imagem_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    nome: 'Pastel de Nata',
    descricao: 'Pastel de nata tradicional',
    preco: 1.20,
    secao: 'Sobremesas',
    destaque: false,
    imagem_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    nome: 'Mousse de Chocolate',
    descricao: 'Mousse cremosa de chocolate negro',
    preco: 3.50,
    secao: 'Sobremesas',
    destaque: false,
    imagem_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const localMenu = {
  getAll: (): MenuItem[] => {
    try {
      const stored = localStorage.getItem(MENU_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Inicializar com itens padrão
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(defaultMenuItems));
      return defaultMenuItems;
    } catch {
      return defaultMenuItems;
    }
  },

  getById: (id: string): MenuItem | null => {
    const items = localMenu.getAll();
    return items.find(item => item.id === id) || null;
  },

  getByDestaque: (): MenuItem[] => {
    const items = localMenu.getAll();
    return items.filter(item => item.destaque);
  },

  create: (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): { success: boolean; data?: MenuItem; error?: string } => {
    try {
      const items = localMenu.getAll();
      const newItem: MenuItem = {
        ...item,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      items.push(newItem);
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
      return { success: true, data: newItem };
    } catch (error) {
      return { success: false, error: 'Erro ao criar item' };
    }
  },

  update: (id: string, updates: Partial<MenuItem>): { success: boolean; data?: MenuItem; error?: string } => {
    try {
      const items = localMenu.getAll();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) {
        return { success: false, error: 'Item não encontrado' };
      }
      items[index] = {
        ...items[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
      return { success: true, data: items[index] };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar item' };
    }
  },

  delete: (id: string): { success: boolean; error?: string } => {
    try {
      const items = localMenu.getAll();
      const filtered = items.filter(item => item.id !== id);
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(filtered));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao deletar item' };
    }
  },
};

// ========== RESERVAS ==========
export interface Reserva {
  id: string;
  nome: string;
  apelido: string;
  telefone: string;
  email: string;
  data_reserva: string;
  hora_reserva: string;
  numero_pessoas: number;
  estado: 'pendente' | 'confirmado' | 'rejeitado';
  created_at: string;
  updated_at: string;
}

const RESERVAS_STORAGE_KEY = 'table_menu_reservas';

export const localReservas = {
  getAll: (): Reserva[] => {
    try {
      const stored = localStorage.getItem(RESERVAS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch {
      return [];
    }
  },

  getById: (id: string): Reserva | null => {
    const reservas = localReservas.getAll();
    return reservas.find(reserva => reserva.id === id) || null;
  },

  create: (reserva: Omit<Reserva, 'id' | 'estado' | 'created_at' | 'updated_at'>): { success: boolean; data?: Reserva; error?: string } => {
    try {
      const reservas = localReservas.getAll();
      const newReserva: Reserva = {
        ...reserva,
        id: crypto.randomUUID(),
        estado: 'pendente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      reservas.push(newReserva);
      localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(reservas));
      return { success: true, data: newReserva };
    } catch (error) {
      return { success: false, error: 'Erro ao criar reserva' };
    }
  },

  update: (id: string, updates: Partial<Reserva>): { success: boolean; data?: Reserva; error?: string } => {
    try {
      const reservas = localReservas.getAll();
      const index = reservas.findIndex(reserva => reserva.id === id);
      if (index === -1) {
        return { success: false, error: 'Reserva não encontrada' };
      }
      reservas[index] = {
        ...reservas[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(reservas));
      return { success: true, data: reservas[index] };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar reserva' };
    }
  },

  delete: (id: string): { success: boolean; error?: string } => {
    try {
      const reservas = localReservas.getAll();
      const filtered = reservas.filter(reserva => reserva.id !== id);
      localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(filtered));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao deletar reserva' };
    }
  },
};

