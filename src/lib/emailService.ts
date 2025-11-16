const API_URL = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001';

export interface EmailReservaData {
  email: string;
  nome: string;
  apelido: string;
  data_reserva: string;
  hora_reserva: string;
  numero_pessoas: number;
  estado: 'pendente' | 'confirmado' | 'cancelado' | 'finalizado';
  observacoes?: Array<{
    id: string;
    mensagem: string;
    autor: 'cliente' | 'admin';
    autor_nome?: string;
    created_at: string;
  }>;
}

export interface EmailReply {
  from: string;
  subject: string;
  date: string;
  message: string;
  messageId: number;
}

export interface EmailConfirmacaoData {
  email: string;
  nome: string;
  apelido: string;
  data_reserva: string;
  hora_reserva: string;
  numero_pessoas: number;
}

export const emailService = {
  /**
   * Envia email de confirmação de recebimento da reserva
   */
  sendReservationConfirmation: async (data: EmailConfirmacaoData): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Chamando API de confirmação:', `${API_URL}/api/send-reservation-confirmation`);
      console.log('Dados enviados:', data);
      
      const response = await fetch(`${API_URL}/api/send-reservation-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Resposta da API:', response.status, response.statusText);

      // Verificar se a resposta é JSON antes de fazer parse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text.substring(0, 200));
        return { 
          success: false, 
          error: `Servidor retornou erro ${response.status}. Verifique se o servidor está rodando na porta 3001.` 
        };
      }

      const result = await response.json();
      console.log('Resultado:', result);

      if (!response.ok) {
        return { success: false, error: result.error || 'Erro ao enviar email de confirmação' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar email de confirmação:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar email de confirmação' 
      };
    }
  },

  /**
   * Envia email de atualização de reserva para o cliente
   */
  sendReservationEmail: async (data: EmailReservaData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/send-reservation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Erro ao enviar email' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar email' 
      };
    }
  },

  /**
   * Verifica emails recebidos e retorna respostas
   */
  checkEmailReplies: async (): Promise<{ success: boolean; replies?: EmailReply[]; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/api/check-email-replies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Verificar se a resposta é JSON antes de fazer parse
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text.substring(0, 200));
        return { 
          success: false, 
          error: `Servidor retornou erro ${response.status}. Verifique se o servidor está rodando na porta 3001.` 
        };
      }

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Erro ao verificar emails' };
      }

      return { success: true, replies: result.replies || [] };
    } catch (error) {
      console.error('Erro ao verificar emails:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar emails' 
      };
    }
  },
};

