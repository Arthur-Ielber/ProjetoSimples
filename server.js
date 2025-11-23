import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import imaps from 'imap-simple';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConnection, testConnection, query } from './src/lib/database.js';
import { v4 as uuidv4 } from 'uuid';
import configuracoesRouter from './src/routes/configuracoes.js';
import ementaRouter from './src/routes/ementa.js';
import menuSecoesRouter from './src/routes/menu-secoes.js';
import reservasRouter from './src/routes/reservas.js';
import pedidosRouter from './src/routes/pedidos.js';
import mesasRouter from './src/routes/mesas.js';
import authRouter from './src/routes/auth.js';
import uploadRouter from './src/routes/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// Limite aumentado para 30MB para suportar imagens de até 15MB em base64 (~20MB após codificação)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Servir arquivos estáticos (imagens)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Função para finalizar todas as atividades pendentes na inicialização
async function finalizarAtividadesPendentes() {
  try {
    console.log('[INICIALIZAÇÃO] 🧹 Finalizando atividades pendentes...');
    
    // 1. Finalizar todas as comandas abertas ou pendentes
    const comandasPendentes = await query(
      `SELECT id, nome_cliente, status FROM pedidos 
       WHERE status IN ('aberta', 'pendente')`
    );
    
    if (comandasPendentes.length > 0) {
      console.log(`[INICIALIZAÇÃO]   Encontradas ${comandasPendentes.length} comanda(s) pendente(s)`);
      
      for (const comanda of comandasPendentes) {
        await query(
          `UPDATE pedidos 
           SET status = 'finalizada',
               observacoes_finalizacao = CONCAT(COALESCE(observacoes_finalizacao, ''), 
                 CASE WHEN observacoes_finalizacao IS NOT NULL THEN ' | ' ELSE '' END,
                 'Finalizada automaticamente na inicialização do servidor')
           WHERE id = ?`,
          [comanda.id]
        );
        console.log(`[INICIALIZAÇÃO]   ✓ Comanda ${comanda.id} (${comanda.nome_cliente}) finalizada`);
      }
    } else {
      console.log('[INICIALIZAÇÃO]   ✓ Nenhuma comanda pendente encontrada');
    }
    
    // 2. Finalizar reservas em estados intermediários
    const reservasPendentes = await query(
      `SELECT id, nome, estado FROM reservas 
       WHERE estado IN ('aguardando_cliente', 'confirmado_cliente')`
    );
    
    if (reservasPendentes.length > 0) {
      console.log(`[INICIALIZAÇÃO]   Encontradas ${reservasPendentes.length} reserva(s) pendente(s)`);
      
      for (const reserva of reservasPendentes) {
        // Finalizar reservas confirmadas pelo cliente ou aguardando confirmação
        await query(
          `UPDATE reservas 
           SET estado = 'finalizado'
           WHERE id = ?`,
          [reserva.id]
        );
        
        // Adicionar observação automática
        const obsId = uuidv4();
        await query(
          `INSERT INTO reserva_observacoes (id, reserva_id, mensagem, autor) 
           VALUES (?, ?, ?, ?)`,
          [
            obsId,
            reserva.id,
            'Reserva finalizada automaticamente na inicialização do servidor',
            'admin'
          ]
        );
        
        console.log(`[INICIALIZAÇÃO]   ✓ Reserva ${reserva.id} (${reserva.nome}) finalizada`);
      }
    } else {
      console.log('[INICIALIZAÇÃO]   ✓ Nenhuma reserva pendente encontrada');
    }
    
    console.log('[INICIALIZAÇÃO] ✅ Limpeza concluída - sistema pronto para uso');
  } catch (error) {
    console.error('[INICIALIZAÇÃO] ❌ Erro ao finalizar atividades pendentes:', error);
    // Não bloquear a inicialização do servidor se houver erro
    console.warn('[INICIALIZAÇÃO] ⚠️ Servidor continuará iniciando mesmo com erro na limpeza');
  }
}

// Testar conexão MySQL ao iniciar e finalizar atividades pendentes
testConnection().then(async (result) => {
  if (result.success) {
    console.log('[BACKEND]', result.message);
    // Finalizar atividades pendentes após conectar ao banco
    await finalizarAtividadesPendentes();
  } else {
    console.error('[BACKEND] Erro ao conectar com MySQL:', result.error);
    console.warn('[BACKEND] O servidor continuará rodando, mas funcionalidades de banco de dados estarão desabilitadas.');
  }
});

// Configurar transporter do Gmail (opcional - só funciona se EMAIL_USER e EMAIL_PASS estiverem configurados)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('[BACKEND] Configurando serviço de email...');
  console.log('[BACKEND] EMAIL_USER:', process.env.EMAIL_USER);
  console.log('[BACKEND] EMAIL_PASS:', process.env.EMAIL_PASS ? '***configurado***' : 'NÃO CONFIGURADO');
  
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  // Testar conexão do transporter
  transporter.verify((error, success) => {
    if (error) {
      console.error('[BACKEND] ❌ Erro ao verificar conexão do email:', error);
      console.error('[BACKEND] Detalhes do erro:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
    } else {
      console.log('[BACKEND] ✅ Serviço de email configurado e verificado com sucesso');
    }
  });
} else {
  console.warn('[BACKEND] ⚠️ AVISO: EMAIL_USER e EMAIL_PASS não estão configurados. Funcionalidades de email estarão desabilitadas.');
  console.warn('[BACKEND] Para habilitar, adicione no arquivo .env:');
  console.warn('[BACKEND] EMAIL_USER=seu_email@gmail.com');
  console.warn('[BACKEND] EMAIL_PASS=sua_senha_de_app');
}

// Função para formatar o histórico de observações (apenas última mensagem)
function formatarObservacoes(observacoes) {
  if (!observacoes || observacoes.length === 0) {
    return '<p><em>Nenhuma observação ainda.</em></p>';
  }

  // Pegar apenas a última observação
  const ultimaObservacao = observacoes[observacoes.length - 1];
  
  const data = new Date(ultimaObservacao.created_at).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
  // Usar "Restaurante" ao invés de "Admin" ou "Administrador"
  const autorLabel = ultimaObservacao.autor === 'cliente' 
    ? 'Você' 
    : (ultimaObservacao.autor_nome === 'Administrador' || ultimaObservacao.autor_nome === 'Admin' 
      ? 'Restaurante' 
      : (ultimaObservacao.autor_nome || 'Restaurante'));
  
  const corFundo = ultimaObservacao.autor === 'cliente' ? '#e3f2fd' : '#fff3e0';
  
  let html = '<div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">';
  html += '<h3 style="margin-top: 0; color: #333;">Última Mensagem:</h3>';
    
    html += `
    <div style="margin-bottom: 15px; padding: 10px; background-color: ${corFundo}; border-left: 3px solid ${ultimaObservacao.autor === 'cliente' ? '#2196F3' : '#FF9800'}; border-radius: 3px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
          <strong>${autorLabel}</strong> - ${data}
        </div>
      <div style="color: #333; white-space: pre-wrap;">${ultimaObservacao.mensagem}</div>
      </div>
    `;
  
  html += '</div>';
  return html;
}

// Função para obter mensagem do status
function getMensagemStatus(estado) {
  const mensagens = {
    pendente: 'A sua reserva está pendente de confirmação.',
    aguardando_cliente: 'A sua reserva foi <strong style="color: #4CAF50;">CONFIRMADA PELO RESTAURANTE</strong>! Por favor, confirme ou cancele a sua reserva usando os botões abaixo.',
    confirmado_cliente: 'A sua reserva foi <strong style="color: #4CAF50;">CONFIRMADA</strong>! Estamos ansiosos para recebê-lo.',
    cliente_na_mesa: 'O cliente está na mesa e sendo atendido.',
    confirmado: 'A sua reserva foi <strong style="color: #4CAF50;">CONFIRMADA</strong>! Estamos ansiosos para recebê-lo.', // Mantido para compatibilidade
    cancelado: 'A sua reserva foi <strong style="color: #f44336;">CANCELADA</strong>.',
    finalizado: 'A sua reserva foi <strong style="color: #2196F3;">FINALIZADA</strong>. Obrigado pela sua visita!',
  };
  return mensagens[estado] || mensagens.pendente;
}

// Endpoint para enviar email de confirmação de recebimento da reserva
app.post('/api/send-reservation-confirmation', async (req, res) => {
  try {
    console.log('Recebida requisição de confirmação de reserva');
    console.log('Body recebido:', req.body);
    
    const { 
      email, 
      nome, 
      apelido, 
      data_reserva, 
      hora_reserva, 
      numero_pessoas,
      tokenConfirmacao
    } = req.body;
    
    console.log('[EMAIL CONFIRMAÇÃO] Token recebido:', {
      tokenConfirmacao: tokenConfirmacao ? String(tokenConfirmacao).substring(0, 30) + '...' : 'AUSENTE',
      tokenType: typeof tokenConfirmacao,
      tokenValido: tokenConfirmacao && String(tokenConfirmacao).trim().length > 0
    });

    if (!email || !nome || !data_reserva || !hora_reserva) {
      console.error('Dados incompletos:', { email, nome, data_reserva, hora_reserva });
      return res.status(400).json({ 
        success: false, 
        error: 'Dados incompletos' 
      });
    }

    console.log('Enviando email de confirmação para:', email);

    const dataFormatada = new Date(data_reserva).toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Confirmação de Recebimento da sua Reserva',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #C84B31;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #ffffff;
              padding: 20px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .info-box {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
            .info-row {
              margin: 8px 0;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .message-box {
              background-color: #e8f5e9;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
              border-left: 4px solid #4CAF50;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Restaurante</h1>
            <p style="margin: 5px 0 0 0;">Confirmação de Recebimento</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${nome} ${apelido}</strong>,</p>
            
            <div class="message-box">
              <p style="margin: 0; font-size: 16px;">
                👍 Sua solicitação de reserva foi recebida, logo em breve daremos uma resposta sobre a mesma.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 16px;">
                Obrigado por nos escolher! 😊
              </p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Detalhes da sua Reserva:</h3>
              <div class="info-row">
                <span class="info-label">Data:</span> ${dataFormatada}
              </div>
              <div class="info-row">
                <span class="info-label">Hora:</span> ${hora_reserva}
              </div>
              <div class="info-row">
                <span class="info-label">Número de Pessoas:</span> ${numero_pessoas}
              </div>
            </div>
            
            <p style="margin-top: 20px;">
              Receberá um email assim que analisarmos a sua solicitação e confirmarmos a sua reserva.
            </p>
            
            ${tokenConfirmacao ? `
            <div class="button-container" style="margin: 30px 0; text-align: center; padding: 20px 0;">
              <p style="margin-bottom: 20px; color: #333; font-size: 16px; font-weight: bold;">
                Por favor, confirme ou cancele a sua reserva:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 10px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/confirmar-reserva/${tokenConfirmacao}" 
                       style="display: inline-block; padding: 15px 35px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; text-align: center;">
                      ✓ Confirmar Reserva
                    </a>
                  </td>
                  <td style="padding: 10px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/cancelar-reserva/${tokenConfirmacao}" 
                       style="display: inline-block; padding: 15px 35px; background-color: #f44336; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; text-align: center;">
                      ✗ Desistir
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin-top: 15px; color: #666; font-size: 12px;">
                Clique em um dos botões acima para confirmar ou cancelar a sua reserva.
              </p>
            </div>
            ` : ''}
            
            <p>Atenciosamente,<br><strong>Equipa do Restaurante</strong></p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda a este email.</p>
          </div>
        </body>
        </html>
      `,
    };

    if (!transporter) {
      console.warn('Email não enviado: serviço de email não configurado');
      return res.json({ 
        success: true, 
        message: 'Reserva criada com sucesso (email não enviado - serviço não configurado)' 
      });
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email de confirmação enviado com sucesso:', info.messageId);

    res.json({ 
      success: true, 
      message: 'Email de confirmação enviado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao enviar email: ' + error.message 
    });
  }
});

// Endpoint para enviar email de atualização de reserva
app.post('/api/send-reservation-email', async (req, res) => {
  try {
    const { 
      email, 
      nome, 
      apelido, 
      data_reserva, 
      hora_reserva, 
      numero_pessoas,
      estado,
      mesaNumero,
      observacoesRestaurante,
      respostaCliente,
      tokenConfirmacao,
      tokenCancelamento
    } = req.body;

    if (!email || !nome || !estado) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados incompletos' 
      });
    }

    const dataFormatada = new Date(data_reserva).toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const mensagemStatus = getMensagemStatus(estado);
    
    // Log para debug
    console.log('[EMAIL DEBUG] Enviando email:', {
      email,
      estado,
      tokenConfirmacao: tokenConfirmacao ? 'presente (' + tokenConfirmacao.substring(0, 8) + '...)' : 'ausente',
      tokenCancelamento: tokenCancelamento ? 'presente (' + tokenCancelamento.substring(0, 8) + '...)' : 'ausente',
      respostaCliente: respostaCliente ? 'presente (' + respostaCliente.substring(0, 50) + '...)' : 'ausente',
      mesaNumero,
      mostrarBotoes: (tokenConfirmacao && tokenCancelamento) ? 'SIM (sempre que houver ambos os tokens)' : 'NÃO',
      temTokens: !!(tokenConfirmacao && tokenCancelamento)
    });
    
    // Observações do restaurante NÃO são enviadas no email (apenas para uso interno)
    // Apenas a resposta ao cliente será enviada

    // Construir HTML dos botões
    let botoesHTML = '';
    // Verificar se deve mostrar botões - deve haver ambos os tokens válidos
    const tokenConfirmacaoValido = tokenConfirmacao && 
      tokenConfirmacao !== null && 
      tokenConfirmacao !== undefined && 
      String(tokenConfirmacao).trim().length > 0;
    const tokenCancelamentoValido = tokenCancelamento && 
      tokenCancelamento !== null && 
      tokenCancelamento !== undefined && 
      String(tokenCancelamento).trim().length > 0;
    const deveMostrarBotoes = tokenConfirmacaoValido && tokenCancelamentoValido; // Mostrar botões sempre que houver ambos os tokens válidos
    
    console.log('[EMAIL DEBUG] 🔍 VALIDAÇÃO DO TOKEN:', {
      tokenConfirmacao: tokenConfirmacao ? String(tokenConfirmacao).substring(0, 30) + '...' : 'AUSENTE',
      tokenConfirmacaoType: typeof tokenConfirmacao,
      tokenConfirmacaoIsNull: tokenConfirmacao === null,
      tokenConfirmacaoIsUndefined: tokenConfirmacao === undefined,
      tokenConfirmacaoTrimmed: tokenConfirmacao ? String(tokenConfirmacao).trim() : 'N/A',
      tokenConfirmacaoLength: tokenConfirmacao ? String(tokenConfirmacao).trim().length : 0,
      tokenConfirmacaoValido: tokenConfirmacaoValido,
      tokenCancelamentoValido: tokenCancelamentoValido,
      deveMostrarBotoes
    });
    
    console.log('[EMAIL DEBUG] Verificando botões e resposta ao cliente:', {
      estado,
      tokenConfirmacao: tokenConfirmacao ? (typeof tokenConfirmacao === 'string' ? tokenConfirmacao.substring(0, 20) + '...' : String(tokenConfirmacao).substring(0, 20) + '...') : 'null/undefined',
      tokenConfirmacaoType: typeof tokenConfirmacao,
      tokenConfirmacaoValue: tokenConfirmacao,
      tokenConfirmacaoValido: tokenConfirmacaoValido,
      tokenCancelamentoValido: tokenCancelamentoValido,
      respostaCliente: respostaCliente ? respostaCliente.substring(0, 50) + '...' : 'vazio',
      deveMostrarBotoes,
      botoesHTMLLength: botoesHTML.length,
      respostaClienteLength: respostaCliente ? respostaCliente.length : 0
    });
    
    if (deveMostrarBotoes) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      // Garantir que ambos os tokens sejam strings
      const tokenConfirmacaoString = typeof tokenConfirmacao === 'string' ? tokenConfirmacao.trim() : String(tokenConfirmacao || '');
      const tokenCancelamentoString = typeof tokenCancelamento === 'string' ? tokenCancelamento.trim() : String(tokenCancelamento || '');
      
      console.log('[EMAIL DEBUG] ✅ GERANDO BOTÕES - Tokens válidos encontrados!');
      console.log('[EMAIL DEBUG] Gerando botões com tokens:', {
        tokenConfirmacaoString: tokenConfirmacaoString.substring(0, 20) + '...',
        tokenCancelamentoString: tokenCancelamentoString.substring(0, 20) + '...',
        frontendUrl,
        urlConfirmar: `${frontendUrl}/confirmar-reserva/${tokenConfirmacaoString}`,
        urlCancelar: `${frontendUrl}/cancelar-reserva/${tokenCancelamentoString}`
      });
      
      botoesHTML = `
            <div class="button-container" style="margin: 30px 0; text-align: center; padding: 20px 0;">
              <p style="margin-bottom: 20px; color: #333; font-size: 16px; font-weight: bold;">
                Por favor, confirme ou cancele a sua reserva:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 10px;">
                    <a href="${frontendUrl}/confirmar-reserva/${tokenConfirmacaoString}" 
                       style="display: inline-block; padding: 15px 35px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; text-align: center;">
                      ✓ Confirmar Reserva
                    </a>
                  </td>
                  <td style="padding: 10px;">
                    <a href="${frontendUrl}/cancelar-reserva/${tokenCancelamentoString}" 
                       style="display: inline-block; padding: 15px 35px; background-color: #f44336; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; text-align: center;">
                      ✗ Desistir
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin-top: 15px; color: #666; font-size: 12px;">
                Clique em um dos botões acima para confirmar ou cancelar a sua reserva. Cada botão só pode ser usado uma vez.
              </p>
            </div>
      `;
    } else {
      console.log('[EMAIL DEBUG] ❌ BOTÕES NÃO SERÃO MOSTRADOS:', {
        estado,
        tokenConfirmacao: tokenConfirmacao ? ('presente: ' + (typeof tokenConfirmacao === 'string' ? tokenConfirmacao.substring(0, 20) + '...' : String(tokenConfirmacao).substring(0, 20) + '...')) : 'AUSENTE',
        tokenConfirmacaoType: typeof tokenConfirmacao,
        tokenConfirmacaoValue: tokenConfirmacao,
        tokenConfirmacaoValido: tokenConfirmacaoValido,
        tokenCancelamentoValido: tokenCancelamentoValido,
        deveMostrarBotoes,
        motivo: !tokenConfirmacao ? 'Token de confirmação não fornecido' : (!tokenCancelamento ? 'Token de cancelamento não fornecido' : 'Tokens inválidos')
      });
    }
    
    // Log do HTML gerado (primeiros 200 caracteres)
    console.log('[EMAIL DEBUG] 📧 HTML FINAL DO EMAIL:', {
      botoesHTMLLength: botoesHTML.length,
      botoesHTMLPresente: botoesHTML.length > 0 ? 'SIM ✅' : 'NÃO ❌',
      respostaClienteLength: respostaCliente ? respostaCliente.length : 0,
      botoesHTMLPreview: botoesHTML ? botoesHTML.substring(0, 300) + '...' : 'VAZIO - BOTÕES NÃO SERÃO MOSTRADOS',
      respostaClientePreview: respostaCliente ? respostaCliente.substring(0, 200) + '...' : 'VAZIO',
      observacoesRestauranteRecebido: observacoesRestaurante ? 'PRESENTE (MAS NÃO SERÁ USADO NO EMAIL)' : 'AUSENTE',
      confirmacao: 'Observações do Restaurante NÃO aparecem no email - apenas Mensagem do Restaurante'
    });
    
    // GARANTIR que observacoesRestaurante NÃO é usado no email
    // Mesmo que venha no req.body, não será incluído no HTML
    const observacoesRestauranteParaEmail = null; // SEMPRE null - nunca usado

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Atualização da sua Reserva - ${estado.charAt(0).toUpperCase() + estado.slice(1)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #C84B31;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #ffffff;
              padding: 20px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .info-box {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
            .info-row {
              margin: 8px 0;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .button-container {
              margin: 30px 0;
              text-align: center;
              padding: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 15px 35px;
              margin: 10px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              font-size: 16px;
              border: none;
              cursor: pointer;
            }
            .button-confirm {
              background-color: #4CAF50 !important;
              color: white !important;
            }
            .button-cancel {
              background-color: #f44336 !important;
              color: white !important;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">Restaurante</h1>
            <p style="margin: 5px 0 0 0;">Atualização da sua Reserva</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${nome} ${apelido}</strong>,</p>
            
            <p>${mensagemStatus}</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Detalhes da Reserva:</h3>
              <div class="info-row">
                <span class="info-label">Data:</span> ${dataFormatada}
              </div>
              <div class="info-row">
                <span class="info-label">Hora:</span> ${hora_reserva}
              </div>
              <div class="info-row">
                <span class="info-label">Número de Pessoas:</span> ${numero_pessoas}
              </div>
              ${mesaNumero ? `
              <div class="info-row">
                <span class="info-label">Mesa:</span> Mesa ${mesaNumero}
              </div>
              ` : ''}
            </div>
            
            <!-- IMPORTANTE: Observações do Restaurante NÃO são enviadas no email - apenas para uso interno -->
            <!-- Apenas a Mensagem do Restaurante (respostaCliente) é enviada ao cliente -->
            
            ${respostaCliente ? `
            <div class="resposta-box" style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
              <h3 style="margin-top: 0; color: #333; font-size: 16px; font-weight: bold; margin-bottom: 10px;">Mensagem do Restaurante:</h3>
              <p style="color: #333; margin: 0; white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${respostaCliente}</p>
            </div>
            ` : ''}
            
            ${botoesHTML}
            
            <p style="margin-top: 20px;">
              Se tiver alguma dúvida ou precisar fazer alterações, não hesite em contactar-nos.
            </p>
            
            <p>Atenciosamente,<br><strong>Equipa do Restaurante</strong></p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda a este email.</p>
          </div>
        </body>
        </html>
      `,
    };

    if (!transporter) {
      console.warn('[EMAIL DEBUG] Email não enviado: serviço de email não configurado');
      console.warn('[EMAIL DEBUG] Verifique se EMAIL_USER e EMAIL_PASS estão configurados no .env');
      return res.status(500).json({ 
        success: false, 
        error: 'Serviço de email não configurado. Verifique EMAIL_USER e EMAIL_PASS no arquivo .env' 
      });
    }

    console.log('[EMAIL DEBUG] Enviando email via transporter...');
    console.log('[EMAIL DEBUG] MailOptions:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: mailOptions.html ? mailOptions.html.length : 0
    });
    
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL DEBUG] ✅ Email enviado com sucesso!');
    console.log('[EMAIL DEBUG] MessageId:', info.messageId);
    console.log('[EMAIL DEBUG] Email enviado para:', email);
    console.log('[EMAIL DEBUG] Resposta completa:', JSON.stringify(info, null, 2));

    res.json({ 
      success: true, 
      message: 'Email enviado com sucesso',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('[EMAIL DEBUG] ❌ Erro ao enviar email:', error);
    console.error('[EMAIL DEBUG] Tipo do erro:', error.constructor.name);
    console.error('[EMAIL DEBUG] Stack trace:', error.stack);
    
    // Log detalhado do erro do nodemailer
    if (error.code) {
      console.error('[EMAIL DEBUG] Código do erro:', error.code);
    }
    if (error.command) {
      console.error('[EMAIL DEBUG] Comando que falhou:', error.command);
    }
    if (error.response) {
      console.error('[EMAIL DEBUG] Resposta do servidor:', error.response);
    }
    if (error.responseCode) {
      console.error('[EMAIL DEBUG] Código de resposta:', error.responseCode);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao enviar email: ' + (error.message || 'Erro desconhecido'),
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      } : undefined
    });
  }
});

// Função para decodificar quoted-printable
function decodeQuotedPrintable(text) {
  if (!text) return '';
  
  return text
    .replace(/=\r?\n/g, '') // Remover quebras de linha soft
    .replace(/=([0-9A-F]{2})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/=\n/g, '\n'); // Restaurar quebras de linha hard
}

// Função auxiliar para extrair texto limpo do email (APENAS última mensagem)
function extractTextFromEmail(body) {
  if (!body) return '';
  
  let text = typeof body === 'string' ? body : JSON.stringify(body);
  
  // ESTRATÉGIA ULTRA AGRESSIVA: Processar linha por linha desde o início
  // Ignorar COMPLETAMENTE qualquer linha que seja header MIME
  const allLines = text.split(/\r?\n/);
  const validContentLines = [];
  let foundFirstValidLine = false;
  
  // Processar linha por linha
  for (let i = 0; i < allLines.length; i++) {
    let line = allLines[i];
    const trimmed = line.trim();
    
    // IGNORAR COMPLETAMENTE qualquer linha que seja header MIME ou boundary
    if (trimmed.match(/^--[a-f0-9]+$/i) ||
        trimmed.match(/^Content-Type:/i) ||
        trimmed.match(/^Content-Transfer-Encoding:/i) ||
        trimmed.match(/^charset=/i) ||
        trimmed.match(/^boundary=/i) ||
        trimmed.match(/^[A-Za-z-]+:\s*[^\r\n]+$/)) {
      continue; // Pular completamente esta linha
    }
    
    // Verificar se é citação (parar aqui - já passamos do conteúdo válido)
    if (trimmed.match(/Em\s+.*?\s+escreveu:/i) ||
        trimmed.match(/On\s+.*?\s+wrote:/i) ||
        trimmed.match(/^De:\s*/i) ||
        trimmed.match(/^From:\s*/i) ||
        trimmed.startsWith('>')) {
      break; // Parar completamente
    }
    
    // Se a linha não está vazia e não é header MIME nem citação, é conteúdo válido
    if (trimmed && trimmed.length > 0) {
      // Verificar se não contém palavras suspeitas de header MIME
      const hasMimeKeywords = trimmed.match(/Content-Type|Content-Transfer|charset|boundary|--[a-f0-9]+/i);
      if (!hasMimeKeywords) {
        validContentLines.push(trimmed);
        foundFirstValidLine = true;
        // PARAR após encontrar a primeira linha válida - só queremos UMA mensagem
        break;
      }
    }
  }
  
  // Se não encontrou nenhuma linha válida, retornar vazio
  if (validContentLines.length === 0) {
    return '';
  }
  
  // Pegar apenas a primeira linha válida
  text = validContentLines[0];
  
  // Decodificar quoted-printable
  if (text.includes('=') && (text.includes('=C3') || text.includes('=20') || text.includes('=3D') || text.includes('=0A'))) {
    text = decodeQuotedPrintable(text);
  }
  
  // Limpeza final: remover qualquer coisa que possa ter sobrado
  text = text.replace(/--[a-f0-9]+/gi, '');
  text = text.replace(/Content-Type:.*?(\r?\n|$)/gi, '');
  text = text.replace(/Content-Transfer-Encoding:.*?(\r?\n|$)/gi, '');
  text = text.replace(/charset=.*?(\r?\n|$)/gi, '');
  text = text.replace(/boundary=.*?(\r?\n|$)/gi, '');
  text = text.replace(/^[A-Za-z-]+:\s*[^\r\n]+$/gim, '');
  text = text.trim();
  
  // Se ainda contiver palavras suspeitas de headers MIME, descartar
  if (text.match(/Content-Type|Content-Transfer|charset|boundary|--[a-f0-9]+/i)) {
  return '';
  }
  
  // Limitar tamanho máximo
  if (text.length > 200) {
    text = text.substring(0, 200).trim();
  }
  
  // Limpar espaços e quebras excessivas - converter tudo para uma linha
  text = text.replace(/[ \t\n\r]+/g, ' ').trim();
  
  // Remover qualquer caractere estranho no início/fim
  text = text.replace(/^[^a-zA-Z0-9áéíóúãõçÁÉÍÓÚÃÕÇ]+|[^a-zA-Z0-9áéíóúãõçÁÉÍÓÚÃÕÇ.,!?]+$/g, '').trim();
  
  return text || '';
}

// Função para processar emails recebidos e extrair respostas
async function checkForEmailReplies() {
  try {
    // Verificar se as credenciais de email estão configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[BACKEND] Verificação de emails desabilitada: EMAIL_USER e EMAIL_PASS não configurados');
      return [];
    }

    const config = {
      imap: {
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASS,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 3000,
      },
    };

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Buscar emails não lidos dos últimos 7 dias
    const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      struct: true,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    const replies = [];

    const adminEmail = process.env.EMAIL_USER?.toLowerCase() || '';

    for (const message of messages) {
      try {
        const header = message.parts.find(part => part.which === 'HEADER');
        const text = message.parts.find(part => part.which === 'TEXT');
        
        if (!header || !text) continue;

        const from = (header.body.from && Array.isArray(header.body.from)) 
          ? header.body.from[0] 
          : (header.body.from || '');
        const to = (header.body.to && Array.isArray(header.body.to))
          ? header.body.to[0]
          : (header.body.to || '');
        const replyTo = (header.body['reply-to'] && Array.isArray(header.body['reply-to']))
          ? header.body['reply-to'][0]
          : (header.body['reply-to'] || to);
        const subject = (header.body.subject && Array.isArray(header.body.subject))
          ? header.body.subject[0]
          : (header.body.subject || '');
        const date = (header.body.date && Array.isArray(header.body.date))
          ? header.body.date[0]
          : (header.body.date || new Date().toISOString());
        
        // Extrair email do remetente
        const fromEmailMatch = from.match(/<(.+)>/) || from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const fromEmail = fromEmailMatch ? (fromEmailMatch[1] || fromEmailMatch[0]).toLowerCase() : '';
        
        // Extrair email do destinatário (para identificar quando admin responde)
        const toEmailMatch = (replyTo || to).match(/<(.+)>/) || (replyTo || to).match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const toEmail = toEmailMatch ? (toEmailMatch[1] || toEmailMatch[0]).toLowerCase() : '';
        
        // Determinar se é do admin ou cliente
        const isFromAdmin = fromEmail === adminEmail;
        const targetEmail = isFromAdmin ? toEmail : fromEmail; // Email do cliente para buscar reserva
        
        // Verificar se é uma resposta relacionada a reserva
        const isReservationRelated = subject.toLowerCase().includes('re:') || 
                       subject.toLowerCase().includes('reserva') ||
                                     subject.toLowerCase().includes('atualização') ||
                                     subject.toLowerCase().includes('confirmação');

        if (isReservationRelated && targetEmail) {
          const bodyText = typeof text.body === 'string' 
            ? text.body 
            : (text.body ? JSON.stringify(text.body) : '');
          
          const replyText = extractTextFromEmail(bodyText);

          // Aceitar mensagens mais curtas (mínimo 3 caracteres para permitir "Ok", "Sim", etc)
          if (replyText && replyText.length >= 3 && replyText.length < 5000) {
            replies.push({
              from: from,
              to: to || replyTo,
              subject: subject,
              date: date,
              message: replyText,
              messageId: message.attributes.uid,
              isFromAdmin: isFromAdmin,
              targetEmail: targetEmail, // Email do cliente para buscar a reserva
            });
          }
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        continue;
      }
    }

    await connection.end();
    return replies;
  } catch (error) {
    console.error('Erro ao verificar emails:', error);
    return [];
  }
}

// Endpoint para verificar emails recebidos e retornar respostas
app.get('/api/check-email-replies', async (req, res) => {
  try {
    const replies = await checkForEmailReplies();
    res.json({ 
      success: true, 
      replies: replies,
      count: replies.length 
    });
  } catch (error) {
    console.error('Erro ao verificar respostas de email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao verificar emails: ' + error.message 
    });
  }
});

// Registrar rotas da API
app.use('/api/configuracoes', configuracoesRouter);
app.use('/api/ementa', ementaRouter);
app.use('/api/menu-secoes', menuSecoesRouter);
app.use('/api/reservas', reservasRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/mesas', mesasRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);

// Endpoint de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor de email funcionando' });
});

// Endpoint para testar conexão MySQL
app.get('/api/database/test', async (req, res) => {
  try {
    const result = await testConnection();
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor de email rodando na porta ${PORT}`);
});

