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
  ativo: boolean;
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
    ativo: true,
    imagem_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
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
    ativo: true,
    imagem_url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
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
    ativo: true,
    imagem_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
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
    ativo: true,
    imagem_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
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
    ativo: true,
    imagem_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
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
    ativo: true,
    imagem_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',
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
    ativo: true,
    imagem_url: 'https://images.unsplash.com/photo-1606312619070-d48d4eccf4c2?w=400&h=300&fit=crop',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Função auxiliar para gerar URL de imagem aleatória baseada na seção
const getRandomImageUrl = (secao: string): string => {
  const imagesBySection: Record<string, string[]> = {
    'Entradas': [
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop',
    ],
    'Pratos Principais': [
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1559339352-11d2aa30c8af?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
    ],
    'Sobremesas': [
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1606312619070-d48d4eccf4c2?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
    ],
    'Bebidas': [
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop',
    ],
  };
  
  const images = imagesBySection[secao] || imagesBySection['Pratos Principais'];
  return images[Math.floor(Math.random() * images.length)];
};

export const localMenu = {
  getAll: (): MenuItem[] => {
    try {
      const stored = localStorage.getItem(MENU_STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored);
        // Migração: adicionar campo 'ativo' e 'imagem_url' para itens antigos que não têm
        let needsSave = false;
        const migratedItems = items.map((item: MenuItem) => {
          const migrated: MenuItem = {
            ...item,
            ativo: item.ativo !== undefined ? item.ativo : true,
          };
          
          // Se não tiver imagem, gerar uma aleatória baseada na seção
          if (!migrated.imagem_url) {
            migrated.imagem_url = getRandomImageUrl(migrated.secao);
            needsSave = true;
          }
          
          if (item.ativo === undefined) {
            needsSave = true;
          }
          
          return migrated;
        });
        
        // Se houve migração, salvar de volta
        if (needsSave) {
          localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(migratedItems));
        }
        return migratedItems;
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
    // Filtrar pratos em destaque e ativos, ordenar por updated_at (mais recente primeiro)
    return items
      .filter(item => item.destaque && item.ativo)
      .sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return dateB - dateA; // Ordem decrescente (mais recente primeiro)
      });
  },

  getAtivos: (): MenuItem[] => {
    const items = localMenu.getAll();
    return items.filter(item => item.ativo !== false);
  },

  toggleAtivo: (id: string): { success: boolean; data?: MenuItem; error?: string } => {
    try {
      const items = localMenu.getAll();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) {
        return { success: false, error: 'Item não encontrado' };
      }
      
      const updatedItem = {
        ...items[index],
        ativo: !items[index].ativo,
        updated_at: new Date().toISOString(),
      };
      
      items[index] = updatedItem;
      const serialized = JSON.stringify(items);
      localStorage.setItem(MENU_STORAGE_KEY, serialized);
      
      // Disparar evento customizado para atualizar outras partes da aplicação
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: MENU_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: updatedItem };
    } catch (error) {
      console.error('Erro ao ativar/desativar item:', error);
      return { success: false, error: 'Erro ao ativar/desativar item' };
    }
  },

  // Gerar URL de imagem aleatória baseada na seção
  getRandomImageUrl: (secao: string): string => {
    return getRandomImageUrl(secao);
  },

  create: (item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): { success: boolean; data?: MenuItem; error?: string } => {
    try {
      const items = localMenu.getAll();
      const newItem: MenuItem = {
        ...item,
        ativo: item.ativo !== undefined ? item.ativo : true, // Por padrão, novos itens são ativos
        // Se não tiver imagem, gerar uma aleatória baseada na seção
        imagem_url: item.imagem_url || getRandomImageUrl(item.secao),
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      items.push(newItem);
      const serialized = JSON.stringify(items);
      localStorage.setItem(MENU_STORAGE_KEY, serialized);
      
      // Disparar evento customizado para atualizar outras partes da aplicação
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: MENU_STORAGE_KEY, action: 'create' } 
      }));
      
      return { success: true, data: newItem };
    } catch (error) {
      console.error('Erro ao criar item:', error);
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
      
      // Se estiver marcando como destaque, atualizar updated_at para que apareça primeiro
      const isMarkingAsDestaque = updates.destaque === true && !items[index].destaque;
      const updatedItem = {
        ...items[index],
        ...updates,
        updated_at: isMarkingAsDestaque ? new Date().toISOString() : new Date().toISOString(),
      };
      
      items[index] = updatedItem;
      const serialized = JSON.stringify(items);
      localStorage.setItem(MENU_STORAGE_KEY, serialized);
      
      // Disparar evento customizado para atualizar outras partes da aplicação
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: MENU_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: updatedItem };
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
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
export interface Observacao {
  id: string;
  mensagem: string;
  autor: 'cliente' | 'admin';
  autor_nome?: string; // Nome do admin que adicionou (opcional)
  created_at: string;
}

export interface Reserva {
  id: string;
  nome: string;
  apelido: string;
  telefone: string;
  email: string;
  data_reserva: string;
  hora_reserva: string;
  numero_pessoas: number;
  estado: 'pendente' | 'confirmado' | 'cancelado' | 'finalizado';
  observacoes: Observacao[];
  created_at: string;
  updated_at: string;
}

const RESERVAS_STORAGE_KEY = 'table_menu_reservas';

export const localReservas = {
  getAll: (): Reserva[] => {
    try {
      const stored = localStorage.getItem(RESERVAS_STORAGE_KEY);
      if (stored) {
        const reservas = JSON.parse(stored);
        // Migração: adicionar campo observacoes e atualizar estados antigos
        let needsSave = false;
        const migratedReservas = reservas.map((reserva: Reserva) => {
          const updated: Reserva = { ...reserva };
          
          if (!updated.observacoes) {
            updated.observacoes = [];
            needsSave = true;
          }
          
          // Migrar "rejeitado" para "cancelado"
          if (updated.estado === 'rejeitado') {
            updated.estado = 'cancelado';
            needsSave = true;
          }
          
          return updated;
        });
        
        if (needsSave) {
          localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(migratedReservas));
        }
        return migratedReservas;
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

  create: (reserva: Omit<Reserva, 'id' | 'estado' | 'observacoes' | 'created_at' | 'updated_at'>, observacaoInicial?: string): { success: boolean; data?: Reserva; error?: string } => {
    try {
      const reservas = localReservas.getAll();
      const observacoes: Observacao[] = [];
      
      // Se houver observação inicial do cliente, adicionar
      if (observacaoInicial && observacaoInicial.trim()) {
        observacoes.push({
          id: crypto.randomUUID(),
          mensagem: observacaoInicial.trim(),
          autor: 'cliente',
          created_at: new Date().toISOString(),
        });
      }
      
      const newReserva: Reserva = {
        ...reserva,
        observacoes: observacoes,
        id: crypto.randomUUID(),
        estado: 'pendente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      reservas.push(newReserva);
      localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(reservas));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: RESERVAS_STORAGE_KEY, action: 'create' } 
      }));
      
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
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: RESERVAS_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: reservas[index] };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar reserva' };
    }
  },

  // Adicionar observação a uma reserva
  addObservacao: (reservaId: string, mensagem: string, autor: 'cliente' | 'admin', autorNome?: string): { success: boolean; data?: Observacao; error?: string } => {
    try {
      const reservas = localReservas.getAll();
      const index = reservas.findIndex(reserva => reserva.id === reservaId);
      if (index === -1) {
        return { success: false, error: 'Reserva não encontrada' };
      }
      
      const novaObservacao: Observacao = {
        id: crypto.randomUUID(),
        mensagem: mensagem.trim(),
        autor,
        autor_nome: autorNome,
        created_at: new Date().toISOString(),
      };
      
      if (!reservas[index].observacoes) {
        reservas[index].observacoes = [];
      }
      
      reservas[index].observacoes.push(novaObservacao);
      reservas[index].updated_at = new Date().toISOString();
      
      localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(reservas));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: RESERVAS_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: novaObservacao };
    } catch (error) {
      return { success: false, error: 'Erro ao adicionar observação' };
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

