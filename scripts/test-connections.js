// Script para testar conexões com banco de dados e email
import { testConnection } from '../src/lib/database.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testarConexaoBanco() {
  try {
    console.log('[TESTE] 🔍 Testando conexão com banco de dados...');
    const result = await testConnection();
    
    if (result.success) {
      console.log('[TESTE] ✅ Conexão com banco de dados: OK');
      console.log('[TESTE]    Mensagem:', result.message);
      return true;
    } else {
      console.log('[TESTE] ❌ Conexão com banco de dados: FALHOU');
      console.log('[TESTE]    Erro:', result.error);
      return false;
    }
  } catch (error) {
    console.log('[TESTE] ❌ Erro ao testar conexão com banco de dados:', error.message);
    return false;
  }
}

async function testarConexaoEmail() {
  try {
    console.log('[TESTE] 🔍 Testando conexão com serviço de email...');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('[TESTE] ⚠️  Serviço de email: NÃO CONFIGURADO');
      console.log('[TESTE]    EMAIL_USER:', process.env.EMAIL_USER ? '✓ configurado' : '✗ não configurado');
      console.log('[TESTE]    EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ configurado' : '✗ não configurado');
      console.log('[TESTE]    Para configurar, adicione no arquivo .env:');
      console.log('[TESTE]    EMAIL_USER=seu_email@gmail.com');
      console.log('[TESTE]    EMAIL_PASS=sua_senha_de_app');
      return false;
    }
    
    console.log('[TESTE]    Email configurado:', process.env.EMAIL_USER);
    
    // Criar transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Testar conexão
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          reject(error);
        } else {
          resolve(success);
        }
      });
    });
    
    console.log('[TESTE] ✅ Conexão com serviço de email: OK');
    console.log('[TESTE]    Email verificado com sucesso');
    return true;
  } catch (error) {
    console.log('[TESTE] ❌ Conexão com serviço de email: FALHOU');
    console.log('[TESTE]    Erro:', error.message);
    
    if (error.code) {
      console.log('[TESTE]    Código do erro:', error.code);
    }
    if (error.command) {
      console.log('[TESTE]    Comando que falhou:', error.command);
    }
    if (error.response) {
      console.log('[TESTE]    Resposta do servidor:', error.response);
    }
    
    console.log('[TESTE]    Dicas para resolver:');
    console.log('[TESTE]    1. Verifique se EMAIL_USER e EMAIL_PASS estão corretos no .env');
    console.log('[TESTE]    2. Verifique se a senha de app do Gmail está correta');
    console.log('[TESTE]    3. Verifique se a verificação em duas etapas está ativada');
    console.log('[TESTE]    4. Gere uma nova senha de app em: https://myaccount.google.com/apppasswords');
    
    return false;
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTE DE CONEXÕES DO SISTEMA');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  const resultados = {
    banco: false,
    email: false
  };
  
  // Testar banco de dados
  resultados.banco = await testarConexaoBanco();
  console.log('');
  
  // Testar email
  resultados.email = await testarConexaoEmail();
  console.log('');
  
  // Resumo
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMO DOS TESTES');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Banco de Dados:', resultados.banco ? '✅ OK' : '❌ FALHOU');
  console.log('Serviço de Email:', resultados.email ? '✅ OK' : resultados.email === false && !process.env.EMAIL_USER ? '⚠️  NÃO CONFIGURADO' : '❌ FALHOU');
  console.log('');
  
  if (resultados.banco && resultados.email) {
    console.log('✅ Todos os testes passaram! Sistema pronto para uso.');
    console.log('');
    process.exit(0);
  } else if (resultados.banco) {
    console.log('⚠️  Banco de dados OK, mas email não está configurado ou falhou.');
    console.log('⚠️  O sistema funcionará, mas funcionalidades de email estarão desabilitadas.');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ Alguns testes falharam. Verifique os erros acima.');
    console.log('⚠️  O sistema continuará iniciando, mas algumas funcionalidades podem não funcionar.');
    console.log('');
    process.exit(0); // Não bloquear a inicialização
  }
}

main().catch((error) => {
  console.error('[TESTE] ❌ Erro fatal durante os testes:', error);
  process.exit(0); // Não bloquear a inicialização mesmo com erro
});

