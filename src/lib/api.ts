// Serviço de API para comunicação com o backend MySQL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Função auxiliar para fazer requisições
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      const errorMessage = errorData.error || errorData.message || `Erro ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Erro na requisição ${endpoint}:`, error);
    // Se já é um Error com mensagem, apenas relançar
    if (error instanceof Error) {
      throw error;
    }
    // Caso contrário, criar um novo Error
    throw new Error(error.message || 'Erro desconhecido');
  }
}

export const api = {
  // Configurações
  getConfiguracoes: async () => {
    const result = await fetchAPI('/configuracoes');
    // A API GET retorna o objeto diretamente, não dentro de { data: ... }
    // Mas vamos garantir que sempre retornamos no formato esperado
    return result;
  },
  updateConfiguracoes: async (data: any) => {
    // Se tiver fotos em base64, enviar como string
    const payload = { ...data };
    if (payload.foto_inicial && typeof payload.foto_inicial === 'string') {
      payload.foto_inicial = payload.foto_inicial;
    }
    if (payload.foto_historia && typeof payload.foto_historia === 'string') {
      payload.foto_historia = payload.foto_historia;
    }
    return fetchAPI('/configuracoes', { method: 'PUT', body: JSON.stringify(payload) });
  },
  getFotoInicial: () => `${API_URL}/configuracoes/foto-inicial`,
  getFotoHistoria: () => `${API_URL}/configuracoes/foto-historia`,

  // Upload
  uploadEmentaImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_URL}/upload/ementa`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || `Erro ${response.status}`);
    }
    return await response.json();
  },
  getEmentaImage: (id: string) => `${API_URL}/upload/ementa/${id}`,
  deleteEmentaImage: (filename: string) => fetchAPI(`/upload/ementa/${filename}`, { method: 'DELETE' }),

  // Ementa
  getEmenta: () => fetchAPI('/ementa'),
  getEmentaAtivos: () => fetchAPI('/ementa/ativos'),
  getEmentaDestaque: () => fetchAPI('/ementa/destaque'),
  getEmentaById: (id: string) => fetchAPI(`/ementa/${id}`),
  createEmenta: async (data: any) => {
    // Se tiver imagem_blob (base64), enviar como string
    const payload = { ...data };
    if (payload.imagem_blob && typeof payload.imagem_blob === 'string') {
      // Já está em base64, apenas enviar
      payload.imagem_blob = payload.imagem_blob;
    }
    return fetchAPI('/ementa', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateEmenta: async (id: string, data: any) => {
    // Se tiver imagem_blob (base64), enviar como string
    const payload = { ...data };
    if (payload.imagem_blob && typeof payload.imagem_blob === 'string') {
      // Já está em base64, apenas enviar
      payload.imagem_blob = payload.imagem_blob;
    }
    return fetchAPI(`/ementa/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  toggleEmentaAtivo: (id: string) => fetchAPI(`/ementa/${id}/toggle-ativo`, { method: 'PATCH' }),
  deleteEmenta: (id: string) => fetchAPI(`/ementa/${id}`, { method: 'DELETE' }),

  // Seções do Menu
  getMenuSecoes: () => fetchAPI('/menu-secoes'),
  createMenuSecao: (data: any) => fetchAPI('/menu-secoes', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuSecao: (id: string, data: any) => fetchAPI(`/menu-secoes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuSecao: (id: string) => fetchAPI(`/menu-secoes/${id}`, { method: 'DELETE' }),

  // Reservas
  getReservas: () => fetchAPI('/reservas'),
  getReservaById: (id: string) => fetchAPI(`/reservas/${id}`),
  createReserva: (data: any) => fetchAPI('/reservas', { method: 'POST', body: JSON.stringify(data) }),
  updateReserva: (id: string, data: any) => fetchAPI(`/reservas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addReservaObservacao: (id: string, data: any) => fetchAPI(`/reservas/${id}/observacoes`, { method: 'POST', body: JSON.stringify(data) }),
  getReservasPorMesa: (mesaId: string, data: string) => fetchAPI(`/reservas/mesa/${mesaId}/data/${data}`),
  deleteReserva: (id: string) => fetchAPI(`/reservas/${id}`, { method: 'DELETE' }),
  finalizarReservasCanceladasAntigas: () => fetchAPI('/reservas/finalizar-canceladas-antigas', { method: 'POST' }),

  // Pedidos
  getPedidos: (data?: string) => fetchAPI(data ? `/pedidos?data=${data}` : '/pedidos'),
  getPedidosHistorico: () => fetchAPI('/pedidos/historico'),
  getPedidoById: (id: string) => fetchAPI(`/pedidos/${id}`),
  createPedido: (data: any) => fetchAPI('/pedidos', { method: 'POST', body: JSON.stringify(data) }),
  updatePedido: (id: string, data: any) => fetchAPI(`/pedidos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  marcarPedidoPendente: (id: string, data: any) => fetchAPI(`/pedidos/${id}/marcar-pendente`, { method: 'PATCH', body: JSON.stringify(data) }),
  finalizarPedido: (id: string) => fetchAPI(`/pedidos/${id}/finalizar`, { method: 'PATCH' }),
  reabrirPedido: (id: string) => fetchAPI(`/pedidos/${id}/reabrir`, { method: 'PATCH' }),
  cancelarComandasAntigas: () => fetchAPI('/pedidos/cancelar-comandas-antigas', { method: 'POST' }),
  deletePedido: (id: string) => fetchAPI(`/pedidos/${id}`, { method: 'DELETE' }),

  // Mesas
  getMesas: () => fetchAPI('/mesas'),
  getMesasAtivas: () => fetchAPI('/mesas/ativas'),
  getMesaById: (id: string) => fetchAPI(`/mesas/${id}`),
  getPedidosAtivosMesa: (id: string, data?: string) => fetchAPI(data ? `/mesas/${id}/pedidos-ativos?data=${data}` : `/mesas/${id}/pedidos-ativos`),
  createMesa: (data: any) => fetchAPI('/mesas', { method: 'POST', body: JSON.stringify(data) }),
  updateMesa: (id: string, data: any) => fetchAPI(`/mesas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMesa: (id: string) => fetchAPI(`/mesas/${id}`, { method: 'DELETE' }),

  // Autenticação
  login: (data: any) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getUsuarios: () => fetchAPI('/auth/usuarios'),
  createUsuario: (data: any) => fetchAPI('/auth/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  toggleUsuario: (id: string) => fetchAPI(`/auth/usuarios/${id}/toggle`, { method: 'PATCH' }),
  deleteUsuario: (id: string) => fetchAPI(`/auth/usuarios/${id}`, { method: 'DELETE' }),
};

