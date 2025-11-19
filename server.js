import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import imaps from 'imap-simple';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar transporter do Gmail (opcional - só funciona se EMAIL_USER e EMAIL_PASS estiverem configurados)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('[BACKEND] Serviço de email configurado com sucesso');
} else {
  console.warn('[BACKEND] AVISO: EMAIL_USER e EMAIL_PASS não estão configurados. Funcionalidades de email estarão desabilitadas.');
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
    confirmado: 'A sua reserva foi <strong style="color: #4CAF50;">CONFIRMADA</strong>! Estamos ansiosos para recebê-lo.',
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
      numero_pessoas
    } = req.body;

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
      tokenConfirmacao
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
      observacoesRestaurante: observacoesRestaurante ? 'presente (' + observacoesRestaurante.substring(0, 50) + '...)' : 'ausente',
      mesaNumero,
      mostrarBotoes: estado === 'confirmado' && tokenConfirmacao ? 'SIM' : 'NÃO',
      estadoIgualConfirmado: estado === 'confirmado',
      temToken: !!tokenConfirmacao
    });
    
    // Construir HTML das observações
    let observacoesHTML = '';
    // Garantir que observacoesRestaurante seja tratado corretamente
    const observacoesParaEmail = (observacoesRestaurante && typeof observacoesRestaurante === 'string') 
      ? observacoesRestaurante.trim() 
      : '';
    const deveMostrarObservacoes = observacoesParaEmail.length > 0 || (estado === 'confirmado' && tokenConfirmacao);
    
    console.log('[EMAIL DEBUG] Processando observações:', {
      observacoesRestauranteRecebido: observacoesRestaurante,
      tipoObservacoes: typeof observacoesRestaurante,
      observacoesParaEmail,
      deveMostrarObservacoes
    });
    
    if (deveMostrarObservacoes) {
      observacoesHTML = `
            <div class="observacoes-box" style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #FF9800;">
              <h3 style="margin-top: 0; color: #333; font-size: 16px; font-weight: bold; margin-bottom: 10px;">Observações do Restaurante:</h3>
              ${observacoesParaEmail ? `
              <p style="color: #333; margin: 0; white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${observacoesParaEmail}</p>
              ` : `
              <p style="color: #666; margin: 0; font-style: italic; font-size: 14px;">Nenhuma observação adicional.</p>
              `}
            </div>
      `;
    }

    // Construir HTML dos botões
    let botoesHTML = '';
    // Verificar se deve mostrar botões - estado deve ser 'confirmado' e deve haver token
    const deveMostrarBotoes = estado === 'confirmado' && tokenConfirmacao && tokenConfirmacao.trim().length > 0;
    
    console.log('[EMAIL DEBUG] Verificando botões e observações:', {
      estado,
      tokenConfirmacao: tokenConfirmacao ? tokenConfirmacao.substring(0, 20) + '...' : 'null/undefined',
      observacoesParaEmail: observacoesParaEmail ? observacoesParaEmail.substring(0, 50) + '...' : 'vazio',
      deveMostrarBotoes,
      deveMostrarObservacoes,
      botoesHTMLLength: botoesHTML.length,
      observacoesHTMLLength: observacoesHTML.length
    });
    
    if (deveMostrarBotoes) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      botoesHTML = `
            <div class="button-container" style="margin: 30px 0; text-align: center; padding: 20px 0;">
              <p style="margin-bottom: 20px; color: #333; font-size: 16px; font-weight: bold;">
                Por favor, confirme ou cancele a sua reserva:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 10px;">
                    <a href="${frontendUrl}/confirmar-reserva/${tokenConfirmacao}" 
                       style="display: inline-block; padding: 15px 35px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; text-align: center;">
                      ✓ Confirmar Reserva
                    </a>
                  </td>
                  <td style="padding: 10px;">
                    <a href="${frontendUrl}/cancelar-reserva/${tokenConfirmacao}" 
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
      `;
    }
    
    // Log do HTML gerado (primeiros 200 caracteres)
    console.log('[EMAIL DEBUG] HTML gerado:', {
      botoesHTMLLength: botoesHTML.length,
      observacoesHTMLLength: observacoesHTML.length,
      botoesHTMLPreview: botoesHTML ? botoesHTML.substring(0, 200) + '...' : 'VAZIO',
      observacoesHTMLPreview: observacoesHTML ? observacoesHTML.substring(0, 200) + '...' : 'VAZIO'
    });

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
            .observacoes-box {
              background-color: #fff3e0;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #FF9800;
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
            
            ${observacoesHTML}
            
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
      console.warn('Email não enviado: serviço de email não configurado');
      return res.json({ 
        success: true, 
        message: 'Reserva atualizada com sucesso (email não enviado - serviço não configurado)' 
      });
    }

    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: 'Email enviado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao enviar email: ' + error.message 
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

// Endpoint de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor de email funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor de email rodando na porta ${PORT}`);
});

