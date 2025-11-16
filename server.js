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

// Configurar transporter do Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Validar variáveis de ambiente
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('ERRO: EMAIL_USER e EMAIL_PASS devem estar configurados no arquivo .env');
  process.exit(1);
}

// Função para formatar o histórico de observações
function formatarObservacoes(observacoes) {
  if (!observacoes || observacoes.length === 0) {
    return '<p><em>Nenhuma observação ainda.</em></p>';
  }

  let html = '<div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">';
  html += '<h3 style="margin-top: 0; color: #333;">Histórico de Interação:</h3>';
  
  observacoes.forEach((obs) => {
    const data = new Date(obs.created_at).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const autorLabel = obs.autor === 'cliente' ? 'Você' : (obs.autor_nome || 'Administrador');
    const corFundo = obs.autor === 'cliente' ? '#e3f2fd' : '#fff3e0';
    
    html += `
      <div style="margin-bottom: 15px; padding: 10px; background-color: ${corFundo}; border-left: 3px solid ${obs.autor === 'cliente' ? '#2196F3' : '#FF9800'}; border-radius: 3px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
          <strong>${autorLabel}</strong> - ${data}
        </div>
        <div style="color: #333; white-space: pre-wrap;">${obs.mensagem}</div>
      </div>
    `;
  });
  
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
      observacoes = []
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
    const historicoObservacoes = formatarObservacoes(observacoes);

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
            </div>
            
            ${historicoObservacoes}
            
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

// Função auxiliar para extrair texto do email
function extractTextFromEmail(body) {
  if (typeof body === 'string') {
    // Remover tags HTML e decodificar entidades
    return body
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
  return '';
}

// Função para processar emails recebidos e extrair respostas
async function checkForEmailReplies() {
  try {
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

    for (const message of messages) {
      try {
        const header = message.parts.find(part => part.which === 'HEADER');
        const text = message.parts.find(part => part.which === 'TEXT');
        
        if (!header || !text) continue;

        const from = (header.body.from && Array.isArray(header.body.from)) 
          ? header.body.from[0] 
          : (header.body.from || '');
        const subject = (header.body.subject && Array.isArray(header.body.subject))
          ? header.body.subject[0]
          : (header.body.subject || '');
        const date = (header.body.date && Array.isArray(header.body.date))
          ? header.body.date[0]
          : (header.body.date || new Date().toISOString());
        
        // Verificar se é uma resposta a um email nosso (contém "Re:" ou "RE:" no assunto)
        const isReply = subject.toLowerCase().includes('re:') || 
                       subject.toLowerCase().includes('reserva') ||
                       subject.toLowerCase().includes('atualização');

        if (isReply) {
          const bodyText = typeof text.body === 'string' 
            ? text.body 
            : (text.body ? JSON.stringify(text.body) : '');
          
          const extractedText = extractTextFromEmail(bodyText);
          
          // Extrair apenas a resposta do cliente (remover citações de emails anteriores)
          const replyText = extractedText
            .split(/On .* wrote:/i)[0]
            .split(/De:.*$/m)[0]
            .split(/From:.*$/m)[0]
            .split(/-----Original Message-----/i)[0]
            .split(/Em .* escreveu:/i)[0]
            .trim();

          if (replyText && replyText.length > 10) {
            replies.push({
              from: from,
              subject: subject,
              date: date,
              message: replyText,
              messageId: message.attributes.uid,
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

