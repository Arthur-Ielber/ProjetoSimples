// Sistema de autenticação local temporário
// Armazena credenciais do admin no localStorage

export type UserRole = 'admin' | 'atualizador';

export interface User {
  id: string;
  email: string;
  password: string; // Em produção, isso deve ser hash
  role: UserRole;
  active: boolean;
  createdAt: string;
}

const ADMIN_STORAGE_KEY = 'table_menu_admin';
const UPDATERS_STORAGE_KEY = 'table_menu_atualizadores';
const SESSION_STORAGE_KEY = 'table_menu_session';

// Inicializar admin padrão se não existir
const initializeDefaultAdmin = () => {
  if (!localStorage.getItem(ADMIN_STORAGE_KEY)) {
    const defaultAdmin: User = {
      id: 'admin-default',
      email: 'admin@admin.com',
      password: 'Admin@123!',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(defaultAdmin));
  }
};

// Inicializar ao carregar
if (typeof window !== 'undefined') {
  initializeDefaultAdmin();
}

export const localAuth = {
  // Inicializar admin padrão
  initializeDefaultAdmin,

  // Obter admin padrão
  getDefaultAdmin: (): User | null => {
    try {
      const adminData = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!adminData) {
        initializeDefaultAdmin();
        return localAuth.getDefaultAdmin();
      }
      return JSON.parse(adminData);
    } catch {
      return null;
    }
  },

  // Fazer login
  login: (email: string, password: string): { success: boolean; message: string; user?: User } => {
    try {
      initializeDefaultAdmin();
      
      // Verificar admin
      const adminData = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (adminData) {
        const admin: User = JSON.parse(adminData);
        if (admin.email.toLowerCase().trim() === email.toLowerCase().trim() && 
            admin.password === password && 
            admin.active) {
          const session = {
            userId: admin.id,
            email: admin.email,
            role: admin.role,
            loggedInAt: new Date().toISOString(),
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          return { success: true, message: 'Login realizado com sucesso!', user: admin };
        }
      }
      
      // Verificar atualizadores
      const updatersData = localStorage.getItem(UPDATERS_STORAGE_KEY);
      if (updatersData) {
        const updaters: User[] = JSON.parse(updatersData);
        const updater = updaters.find(
          u => u.email.toLowerCase().trim() === email.toLowerCase().trim() && 
               u.password === password && 
               u.active
        );
        
        if (updater) {
          const session = {
            userId: updater.id,
            email: updater.email,
            role: updater.role,
            loggedInAt: new Date().toISOString(),
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          return { success: true, message: 'Login realizado com sucesso!', user: updater };
        }
      }
      
      return { success: false, message: 'Email ou senha incorretos' };
    } catch (error) {
      return { success: false, message: 'Erro ao fazer login' };
    }
  },

  // Verificar se está logado
  isAuthenticated: (): boolean => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!session) return false;

      const sessionData = JSON.parse(session);
      
      // Verificar admin
      const adminData = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (adminData) {
        const admin: User = JSON.parse(adminData);
        if (sessionData.userId === admin.id && admin.active) {
          return true;
        }
      }
      
      // Verificar atualizadores
      const updatersData = localStorage.getItem(UPDATERS_STORAGE_KEY);
      if (updatersData) {
        const updaters: User[] = JSON.parse(updatersData);
        const updater = updaters.find(u => u.id === sessionData.userId && u.active);
        if (updater) return true;
      }
      
      return false;
    } catch {
      return false;
    }
  },

  // Obter usuário atual
  getCurrentUser: (): User | null => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!session) return null;

      const sessionData = JSON.parse(session);
      
      // Verificar admin
      const adminData = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (adminData) {
        const admin: User = JSON.parse(adminData);
        if (sessionData.userId === admin.id && admin.active) {
          return admin;
        }
      }
      
      // Verificar atualizadores
      const updatersData = localStorage.getItem(UPDATERS_STORAGE_KEY);
      if (updatersData) {
        const updaters: User[] = JSON.parse(updatersData);
        const updater = updaters.find(u => u.id === sessionData.userId && u.active);
        if (updater) return updater;
      }
      
      return null;
    } catch {
      return null;
    }
  },

  // Fazer logout
  logout: (): void => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  // Verificar se admin já existe
  hasAdmin: (): boolean => {
    initializeDefaultAdmin();
    return localStorage.getItem(ADMIN_STORAGE_KEY) !== null;
  },

  // Verificar se é admin
  isAdmin: (): boolean => {
    const user = localAuth.getCurrentUser();
    return user?.role === 'admin';
  },

  // Verificar se é admin principal (não atualizador)
  isMainAdmin: (): boolean => {
    const user = localAuth.getCurrentUser();
    if (!user || user.role !== 'admin') return false;
    
    // Verificar se é o admin padrão (admin principal)
    const adminData = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (adminData) {
      const admin: User = JSON.parse(adminData);
      return user.id === admin.id;
    }
    return false;
  },

  // Gerenciar atualizadores (apenas admin)
  getAtualizadores: (): User[] => {
    try {
      const updatersData = localStorage.getItem(UPDATERS_STORAGE_KEY);
      if (!updatersData) return [];
      return JSON.parse(updatersData);
    } catch {
      return [];
    }
  },

  // Criar atualizador (apenas admin)
  createAtualizador: (email: string, password: string): { success: boolean; message: string } => {
    if (!localAuth.isAdmin()) {
      return { success: false, message: 'Apenas administradores podem criar atualizadores' };
    }

    try {
      const updaters = localAuth.getAtualizadores();
      
      // Verificar se email já existe
      if (updaters.some(u => u.email.toLowerCase().trim() === email.toLowerCase().trim())) {
        return { success: false, message: 'Este email já está cadastrado' };
      }

      const novoAtualizador: User = {
        id: crypto.randomUUID(),
        email: email.toLowerCase().trim(),
        password: password,
        role: 'atualizador',
        active: true,
        createdAt: new Date().toISOString(),
      };

      updaters.push(novoAtualizador);
      localStorage.setItem(UPDATERS_STORAGE_KEY, JSON.stringify(updaters));
      return { success: true, message: 'Atualizador criado com sucesso!' };
    } catch (error) {
      return { success: false, message: 'Erro ao criar atualizador' };
    }
  },

  // Ativar/Desativar atualizador (apenas admin)
  toggleAtualizador: (id: string): { success: boolean; message: string } => {
    if (!localAuth.isAdmin()) {
      return { success: false, message: 'Apenas administradores podem gerenciar atualizadores' };
    }

    try {
      const updaters = localAuth.getAtualizadores();
      const index = updaters.findIndex(u => u.id === id);
      
      if (index === -1) {
        return { success: false, message: 'Atualizador não encontrado' };
      }

      updaters[index].active = !updaters[index].active;
      localStorage.setItem(UPDATERS_STORAGE_KEY, JSON.stringify(updaters));
      
      const status = updaters[index].active ? 'ativado' : 'desativado';
      return { success: true, message: `Atualizador ${status} com sucesso!` };
    } catch (error) {
      return { success: false, message: 'Erro ao atualizar atualizador' };
    }
  },

  // Deletar atualizador (apenas admin)
  deleteAtualizador: (id: string): { success: boolean; message: string } => {
    if (!localAuth.isAdmin()) {
      return { success: false, message: 'Apenas administradores podem deletar atualizadores' };
    }

    try {
      const updaters = localAuth.getAtualizadores().filter(u => u.id !== id);
      localStorage.setItem(UPDATERS_STORAGE_KEY, JSON.stringify(updaters));
      return { success: true, message: 'Atualizador deletado com sucesso!' };
    } catch (error) {
      return { success: false, message: 'Erro ao deletar atualizador' };
    }
  },
};

