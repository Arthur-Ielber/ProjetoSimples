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
  secao: string; // Agora aceita qualquer string
  destaque: boolean;
  ativo: boolean;
  imagem_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuSection {
  id: string;
  nome: string;
  ordem: number;
  created_at: string;
  updated_at: string;
}

const MENU_STORAGE_KEY = 'table_menu_ementa';
const SECTIONS_STORAGE_KEY = 'table_menu_secoes';

const defaultSections: MenuSection[] = [
  { id: '1', nome: 'Entradas', ordem: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', nome: 'Pratos Principais', ordem: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', nome: 'Sobremesas', ordem: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', nome: 'Bebidas', ordem: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

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
      
      // Disparar evento customizado para atualizar outras partes da aplicação
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: MENU_STORAGE_KEY, action: 'delete' } 
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao deletar item' };
    }
  },
};

// ========== SEÇÕES DA EMENTA ==========
export const localSections = {
  getAll: (): MenuSection[] => {
    try {
      const stored = localStorage.getItem(SECTIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Inicializar com seções padrão
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(defaultSections));
      return defaultSections;
    } catch {
      return defaultSections;
    }
  },

  getById: (id: string): MenuSection | null => {
    const sections = localSections.getAll();
    return sections.find(section => section.id === id) || null;
  },

  getByNome: (nome: string): MenuSection | null => {
    const sections = localSections.getAll();
    return sections.find(section => section.nome === nome) || null;
  },

  create: (nome: string): { success: boolean; data?: MenuSection; error?: string } => {
    try {
      const sections = localSections.getAll();
      
      // Verificar se já existe uma seção com o mesmo nome
      if (sections.some(s => s.nome.toLowerCase() === nome.toLowerCase().trim())) {
        return { success: false, error: 'Já existe uma seção com este nome' };
      }

      const maxOrdem = sections.length > 0 ? Math.max(...sections.map(s => s.ordem)) : 0;
      const newSection: MenuSection = {
        id: crypto.randomUUID(),
        nome: nome.trim(),
        ordem: maxOrdem + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      sections.push(newSection);
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: SECTIONS_STORAGE_KEY, action: 'create' } 
      }));
      
      return { success: true, data: newSection };
    } catch (error) {
      console.error('Erro ao criar seção:', error);
      return { success: false, error: 'Erro ao criar seção' };
    }
  },

  update: (id: string, updates: Partial<MenuSection>): { success: boolean; data?: MenuSection; error?: string } => {
    try {
      const sections = localSections.getAll();
      const index = sections.findIndex(s => s.id === id);
      
      if (index === -1) {
        return { success: false, error: 'Seção não encontrada' };
      }

      // Se estiver atualizando o nome, verificar se não existe outra seção com o mesmo nome
      if (updates.nome) {
        const nomeTrimmed = updates.nome.trim();
        if (sections.some(s => s.id !== id && s.nome.toLowerCase() === nomeTrimmed.toLowerCase())) {
          return { success: false, error: 'Já existe uma seção com este nome' };
        }
      }

      const updatedSection: MenuSection = {
        ...sections[index],
        ...updates,
        nome: updates.nome ? updates.nome.trim() : sections[index].nome,
        updated_at: new Date().toISOString(),
      };
      
      sections[index] = updatedSection;
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
      
      // Se o nome foi alterado, atualizar todos os itens que usam essa seção
      if (updates.nome && updates.nome !== sections[index].nome) {
        const items = localMenu.getAll();
        const updatedItems = items.map(item => {
          if (item.secao === sections[index].nome) {
            return { ...item, secao: updatedSection.nome, updated_at: new Date().toISOString() };
          }
          return item;
        });
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(updatedItems));
        
        // Disparar evento para atualizar itens também
        window.dispatchEvent(new CustomEvent('localStorageChange', { 
          detail: { key: MENU_STORAGE_KEY, action: 'update' } 
        }));
      }
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: SECTIONS_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: updatedSection };
    } catch (error) {
      console.error('Erro ao atualizar seção:', error);
      return { success: false, error: 'Erro ao atualizar seção' };
    }
  },

  delete: (id: string): { success: boolean; error?: string } => {
    try {
      const sections = localSections.getAll();
      const section = sections.find(s => s.id === id);
      
      if (!section) {
        return { success: false, error: 'Seção não encontrada' };
      }

      // Verificar se há itens usando esta seção
      const items = localMenu.getAll();
      const itemsNaSecao = items.filter(item => item.secao === section.nome);
      
      if (itemsNaSecao.length > 0) {
        return { 
          success: false, 
          error: `Não é possível excluir a seção. Existem ${itemsNaSecao.length} item(ns) associado(s) a ela.` 
        };
      }

      const filtered = sections.filter(s => s.id !== id);
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(filtered));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: SECTIONS_STORAGE_KEY, action: 'delete' } 
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar seção:', error);
      return { success: false, error: 'Erro ao deletar seção' };
    }
  },

  reorder: (sectionIds: string[]): { success: boolean; error?: string } => {
    try {
      const sections = localSections.getAll();
      const reordered = sectionIds.map((id, index) => {
        const section = sections.find(s => s.id === id);
        if (!section) return null;
        return { ...section, ordem: index + 1, updated_at: new Date().toISOString() };
      }).filter((s): s is MenuSection => s !== null);
      
      // Adicionar seções que não foram incluídas no final
      const remaining = sections.filter(s => !sectionIds.includes(s.id));
      reordered.push(...remaining.map((s, index) => ({
        ...s,
        ordem: reordered.length + index + 1,
        updated_at: new Date().toISOString(),
      })));
      
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(reordered));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: SECTIONS_STORAGE_KEY, action: 'reorder' } 
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao reordenar seções:', error);
      return { success: false, error: 'Erro ao reordenar seções' };
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
  mesaId?: string | null;
  estado: 'pendente' | 'confirmado' | 'cancelado' | 'finalizado';
  observacoes: Observacao[];
  observacoesRestaurante?: string; // Observações do restaurante sobre a reserva
  tokenConfirmacao?: string; // Token para confirmação pelo cliente
  confirmadoPeloCliente?: boolean; // Flag para saber se o cliente confirmou via token
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

  getReservaConfirmadaParaMesa: (mesaId: string, data: string, hora: string): Reserva | null => {
    try {
      const reservas = localReservas.getAll();
      const reserva = reservas.find(r => 
        r.mesaId === mesaId &&
        r.estado === 'confirmado' &&
        r.data_reserva === data &&
        r.hora_reserva === hora
      );
      return reserva || null;
    } catch (error) {
      console.error('Erro ao buscar reserva confirmada:', error);
      return null;
    }
  },

  getReservasConfirmadasParaMesa: (mesaId: string, data: string): Reserva[] => {
    try {
      const reservas = localReservas.getAll();
      return reservas.filter(r => 
        r.mesaId === mesaId &&
        r.estado === 'confirmado' &&
        r.data_reserva === data
      );
    } catch (error) {
      console.error('Erro ao buscar reservas confirmadas:', error);
      return [];
    }
  },

  getMesasDisponiveisParaReserva: (data: string, hora: string): Mesa[] => {
    try {
      const todasMesas = localMesas.getAll().filter(m => m.ativa);
      const mesasDisponiveis: Mesa[] = [];

      for (const mesa of todasMesas) {
        // Verificar se a mesa tem comandas ativas
        const pedidosAtivos = localMesas.getPedidosAtivos(mesa.id);
        if (pedidosAtivos.length > 0) {
          continue; // Mesa ocupada
        }

        // Verificar se há reserva confirmada para esta mesa no mesmo horário
        const reservasConfirmadas = localReservas.getReservasConfirmadasParaMesa(mesa.id, data);
        const temReservaNoHorario = reservasConfirmadas.some(r => {
          const [horaReserva, minutoReserva] = r.hora_reserva.split(':').map(Number);
          const [horaAtual, minutoAtual] = hora.split(':').map(Number);
          
          const horaReservaMinutos = horaReserva * 60 + minutoReserva;
          const horaAtualMinutos = horaAtual * 60 + minutoAtual;
          
          // Considerar conflito se estiver dentro de 2 horas de diferença
          return Math.abs(horaReservaMinutos - horaAtualMinutos) < 120;
        });

        if (!temReservaNoHorario) {
          mesasDisponiveis.push(mesa);
        }
      }

      return mesasDisponiveis;
    } catch (error) {
      console.error('Erro ao buscar mesas disponíveis:', error);
      return [];
    }
  },
};

// ========== PEDIDOS/COMANDAS ==========
export interface ItemPedido {
  menuItemId: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacoes?: string | null; // Observações específicas do item
}

export type StatusPedido = 'aberta' | 'pendente' | 'finalizada';

export interface Pedido {
  id: string;
  nomeCliente: string;
  mesaId?: string | null; // ID da mesa (opcional para compatibilidade)
  itens: ItemPedido[];
  subtotal: number; // Soma dos pratos
  taxa: number; // Taxa (atualmente 0)
  total: number; // subtotal + taxa
  formaPagamento?: string | null; // Forma de pagamento (Dinheiro, Cartão, etc.)
  observacoes?: string | null; // Observações gerais da comanda
  observacoesFinalizacao?: string | null; // Observações ao finalizar
  status: StatusPedido; // Status da comanda: aberta, pendente, finalizada
  data: string; // Data do pedido (YYYY-MM-DD)
  hora: string; // Hora do pedido (HH:MM)
  created_at: string;
  updated_at: string;
}

const PEDIDOS_STORAGE_KEY = 'table_menu_pedidos';

export const localPedidos = {
  getAll: (): Pedido[] => {
    try {
      const stored = localStorage.getItem(PEDIDOS_STORAGE_KEY);
      if (!stored) return [];
      const pedidos = JSON.parse(stored);
      
      // Migração: converter comandas antigas que usam finalizado para status
      let needsMigration = false;
      const migratedPedidos = pedidos.map((pedido: any) => {
        if (!pedido.status && typeof pedido.finalizado === 'boolean') {
          needsMigration = true;
          return {
            ...pedido,
            status: pedido.finalizado ? 'finalizada' : 'aberta',
            observacoesFinalizacao: pedido.observacoesFinalizacao || null,
          };
        }
        // Garantir que status existe
        if (!pedido.status) {
          needsMigration = true;
          return {
            ...pedido,
            status: 'aberta',
            observacoesFinalizacao: pedido.observacoesFinalizacao || null,
          };
        }
        return pedido;
      });
      
      if (needsMigration) {
        localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(migratedPedidos));
      }
      
      return migratedPedidos;
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      return [];
    }
  },

  getById: (id: string): Pedido | null => {
    const pedidos = localPedidos.getAll();
    return pedidos.find(pedido => pedido.id === id) || null;
  },

  // Obter pedidos do dia atual
  getDoDia: (): Pedido[] => {
    const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const pedidos = localPedidos.getAll();
    return pedidos.filter(pedido => pedido.data === hoje);
  },

  // Obter pedidos de uma data específica
  getPorData: (data: string): Pedido[] => {
    const pedidos = localPedidos.getAll();
    return pedidos.filter(pedido => pedido.data === data);
  },

  create: (pedido: Omit<Pedido, 'id' | 'created_at' | 'updated_at' | 'subtotal' | 'taxa' | 'total' | 'status'>): { success: boolean; data?: Pedido; error?: string } => {
    try {
      const pedidos = localPedidos.getAll();
      
      // Calcular subtotal (soma dos pratos)
      const subtotal = pedido.itens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
      
      // Taxa removida
      const taxa = 0;
      
      // Calcular total (sem taxa)
      const total = subtotal;
      
      // Data e hora atual
      const agora = new Date();
      const data = agora.toISOString().split('T')[0];
      const hora = agora.toTimeString().split(' ')[0].substring(0, 5);
      
      const newPedido: Pedido = {
        ...pedido,
        subtotal,
        taxa,
        total,
        formaPagamento: null, // Só será preenchido na finalização
        observacoes: pedido.observacoes || null,
        observacoesFinalizacao: null,
        status: 'aberta',
        data,
        hora,
        id: crypto.randomUUID(),
        created_at: agora.toISOString(),
        updated_at: agora.toISOString(),
      };
      
      pedidos.push(newPedido);
      localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidos));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: PEDIDOS_STORAGE_KEY, action: 'create' } 
      }));
      
      return { success: true, data: newPedido };
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      return { success: false, error: 'Erro ao criar pedido' };
    }
  },

  update: (id: string, updates: Partial<Pedido>): { success: boolean; data?: Pedido; error?: string } => {
    try {
      const pedidos = localPedidos.getAll();
      const index = pedidos.findIndex(pedido => pedido.id === id);
      if (index === -1) {
        return { success: false, error: 'Pedido não encontrado' };
      }
      
      const updatedPedido = { ...pedidos[index], ...updates };
      
      // Recalcular se os itens mudaram
      if (updates.itens) {
        updatedPedido.subtotal = updates.itens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        updatedPedido.taxa = 0;
        updatedPedido.total = updatedPedido.subtotal;
      }
      
      updatedPedido.updated_at = new Date().toISOString();
      
      pedidos[index] = updatedPedido;
      localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidos));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: PEDIDOS_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: updatedPedido };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar pedido' };
    }
  },

  delete: (id: string): { success: boolean; error?: string } => {
    try {
      const pedidos = localPedidos.getAll();
      const pedido = pedidos.find(p => p.id === id);
      
      if (!pedido) {
        return { success: false, error: 'Pedido não encontrado' };
      }
      
      // Não permitir deletar comandas finalizadas
      if (pedido.status === 'finalizada') {
        return { success: false, error: 'Não é possível excluir uma comanda finalizada' };
      }
      
      const filtered = pedidos.filter(pedido => pedido.id !== id);
      localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(filtered));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: PEDIDOS_STORAGE_KEY, action: 'delete' } 
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao deletar pedido' };
    }
  },

  marcarPendente: (id: string, formaPagamento: string | null, observacoesFinalizacao: string | null): { success: boolean; data?: Pedido; error?: string } => {
    try {
      const pedidos = localPedidos.getAll();
      const index = pedidos.findIndex(pedido => pedido.id === id);
      if (index === -1) {
        return { success: false, error: 'Pedido não encontrado' };
      }
      
      pedidos[index].status = 'pendente';
      pedidos[index].formaPagamento = formaPagamento;
      pedidos[index].observacoesFinalizacao = observacoesFinalizacao;
      pedidos[index].updated_at = new Date().toISOString();
      
      localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidos));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: PEDIDOS_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: pedidos[index] };
    } catch (error) {
      console.error('Erro ao marcar pedido como pendente:', error);
      return { success: false, error: 'Erro ao marcar pedido como pendente' };
    }
  },

  finalizar: (id: string): { success: boolean; data?: Pedido; error?: string } => {
    try {
      const pedidos = localPedidos.getAll();
      const index = pedidos.findIndex(pedido => pedido.id === id);
      if (index === -1) {
        return { success: false, error: 'Pedido não encontrado' };
      }
      
      pedidos[index].status = 'finalizada';
      pedidos[index].updated_at = new Date().toISOString();
      
      localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidos));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: PEDIDOS_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: pedidos[index] };
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      return { success: false, error: 'Erro ao finalizar pedido' };
    }
  },

  reabrir: (id: string): { success: boolean; data?: Pedido; error?: string } => {
    try {
      const pedidos = localPedidos.getAll();
      const index = pedidos.findIndex(pedido => pedido.id === id);
      if (index === -1) {
        return { success: false, error: 'Pedido não encontrado' };
      }
      
      // Só permite reabrir comandas pendentes
      if (pedidos[index].status !== 'pendente') {
        return { success: false, error: 'Apenas comandas pendentes podem ser reabertas' };
      }
      
      pedidos[index].status = 'aberta';
      pedidos[index].updated_at = new Date().toISOString();
      
      localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidos));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: PEDIDOS_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: pedidos[index] };
    } catch (error) {
      console.error('Erro ao reabrir pedido:', error);
      return { success: false, error: 'Erro ao reabrir pedido' };
    }
  },
};

// ========== MESAS ==========
export interface Mesa {
  id: string;
  numero: string; // Número ou nome da mesa (ex: "1", "A1", "Varanda 1")
  capacidade: number; // Capacidade de pessoas
  ativa: boolean; // Se a mesa está ativa/disponível
  created_at: string;
  updated_at: string;
}

const MESAS_STORAGE_KEY = 'table_menu_mesas';

const defaultMesas: Mesa[] = [
  { id: '1', numero: '1', capacidade: 4, ativa: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', numero: '2', capacidade: 4, ativa: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', numero: '3', capacidade: 2, ativa: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', numero: '4', capacidade: 6, ativa: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', numero: '5', capacidade: 4, ativa: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', numero: '6', capacidade: 8, ativa: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export const localMesas = {
  getAll: (): Mesa[] => {
    try {
      const stored = localStorage.getItem(MESAS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Inicializar com mesas padrão
      localStorage.setItem(MESAS_STORAGE_KEY, JSON.stringify(defaultMesas));
      return defaultMesas;
    } catch {
      return defaultMesas;
    }
  },

  getById: (id: string): Mesa | null => {
    const mesas = localMesas.getAll();
    return mesas.find(mesa => mesa.id === id) || null;
  },

  getAtivas: (): Mesa[] => {
    const mesas = localMesas.getAll();
    return mesas.filter(mesa => mesa.ativa);
  },

  create: (mesa: Omit<Mesa, 'id' | 'created_at' | 'updated_at'>): { success: boolean; data?: Mesa; error?: string } => {
    try {
      const mesas = localMesas.getAll();
      
      // Verificar se já existe uma mesa com o mesmo número
      if (mesas.some(m => m.numero.toLowerCase() === mesa.numero.toLowerCase().trim())) {
        return { success: false, error: 'Já existe uma mesa com este número' };
      }

      const newMesa: Mesa = {
        ...mesa,
        numero: mesa.numero.trim(),
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mesas.push(newMesa);
      localStorage.setItem(MESAS_STORAGE_KEY, JSON.stringify(mesas));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: MESAS_STORAGE_KEY, action: 'create' } 
      }));
      
      return { success: true, data: newMesa };
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      return { success: false, error: 'Erro ao criar mesa' };
    }
  },

  update: (id: string, updates: Partial<Mesa>): { success: boolean; data?: Mesa; error?: string } => {
    try {
      const mesas = localMesas.getAll();
      const index = mesas.findIndex(m => m.id === id);
      
      if (index === -1) {
        return { success: false, error: 'Mesa não encontrada' };
      }

      // Se estiver atualizando o número, verificar se não existe outra mesa com o mesmo número
      if (updates.numero) {
        const numeroTrimmed = updates.numero.trim();
        if (mesas.some(m => m.id !== id && m.numero.toLowerCase() === numeroTrimmed.toLowerCase())) {
          return { success: false, error: 'Já existe uma mesa com este número' };
        }
      }

      const updatedMesa: Mesa = {
        ...mesas[index],
        ...updates,
        numero: updates.numero ? updates.numero.trim() : mesas[index].numero,
        updated_at: new Date().toISOString(),
      };
      
      mesas[index] = updatedMesa;
      localStorage.setItem(MESAS_STORAGE_KEY, JSON.stringify(mesas));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: MESAS_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: updatedMesa };
    } catch (error) {
      console.error('Erro ao atualizar mesa:', error);
      return { success: false, error: 'Erro ao atualizar mesa' };
    }
  },

  delete: (id: string): { success: boolean; error?: string } => {
    try {
      const mesas = localMesas.getAll();
      const mesa = mesas.find(m => m.id === id);
      
      if (!mesa) {
        return { success: false, error: 'Mesa não encontrada' };
      }

      // Verificar se há pedidos ativos associados a esta mesa hoje
      const pedidos = localPedidos.getDoDia();
      const pedidosNaMesa = pedidos.filter(p => p.mesaId === id);
      
      if (pedidosNaMesa.length > 0) {
        return { 
          success: false, 
          error: `Não é possível excluir a mesa. Existem ${pedidosNaMesa.length} pedido(s) associado(s) a ela hoje.` 
        };
      }

      const filtered = mesas.filter(m => m.id !== id);
      localStorage.setItem(MESAS_STORAGE_KEY, JSON.stringify(filtered));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: MESAS_STORAGE_KEY, action: 'delete' } 
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar mesa:', error);
      return { success: false, error: 'Erro ao deletar mesa' };
    }
  },

  toggleAtiva: (id: string): { success: boolean; data?: Mesa; error?: string } => {
    try {
      const mesas = localMesas.getAll();
      const index = mesas.findIndex(m => m.id === id);
      if (index === -1) {
        return { success: false, error: 'Mesa não encontrada' };
      }
      
      const updatedMesa: Mesa = {
        ...mesas[index],
        ativa: !mesas[index].ativa,
        updated_at: new Date().toISOString(),
      };
      
      mesas[index] = updatedMesa;
      localStorage.setItem(MESAS_STORAGE_KEY, JSON.stringify(mesas));
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('localStorageChange', { 
        detail: { key: MESAS_STORAGE_KEY, action: 'update' } 
      }));
      
      return { success: true, data: updatedMesa };
    } catch (error) {
      console.error('Erro ao ativar/desativar mesa:', error);
      return { success: false, error: 'Erro ao ativar/desativar mesa' };
    }
  },

  getPedidosAtivos: (mesaId: string): Pedido[] => {
    const pedidos = localPedidos.getDoDia();
    return pedidos.filter(p => p.mesaId === mesaId && (p.status === 'aberta' || p.status === 'pendente'));
  },
};

