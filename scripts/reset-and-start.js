// Script para finalizar atividades pendentes e iniciar serviços
import { getConnection, testConnection, query } from '../src/lib/database.js';
import { v4 as uuidv4 } from 'uuid';

async function finalizarAtividadesPendentes() {
  try {
    console.log('[RESET] 🧹 Finalizando atividades pendentes...');
    
    // 1. Finalizar todas as comandas abertas ou pendentes
    const comandasPendentes = await query(
      `SELECT id, nome_cliente, status FROM pedidos 
       WHERE status IN ('aberta', 'pendente')`
    );
    
    if (comandasPendentes.length > 0) {
      console.log(`[RESET]   Encontradas ${comandasPendentes.length} comanda(s) pendente(s)`);
      
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
        console.log(`[RESET]   ✓ Comanda ${comanda.id} (${comanda.nome_cliente}) finalizada`);
      }
    } else {
      console.log('[RESET]   ✓ Nenhuma comanda pendente encontrada');
    }
    
    // 2. Finalizar reservas em estados intermediários
    const reservasPendentes = await query(
      `SELECT id, nome, estado FROM reservas 
       WHERE estado IN ('aguardando_cliente', 'confirmado_cliente')`
    );
    
    if (reservasPendentes.length > 0) {
      console.log(`[RESET]   Encontradas ${reservasPendentes.length} reserva(s) pendente(s)`);
      
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
        
        console.log(`[RESET]   ✓ Reserva ${reserva.id} (${reserva.nome}) finalizada`);
      }
    } else {
      console.log('[RESET]   ✓ Nenhuma reserva pendente encontrada');
    }
    
    console.log('[RESET] ✅ Limpeza concluída - sistema pronto para uso');
    return true;
  } catch (error) {
    console.error('[RESET] ❌ Erro ao finalizar atividades pendentes:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('[RESET] 🔄 Iniciando reset do sistema...');
    
    // Testar conexão MySQL
    const result = await testConnection();
    if (result.success) {
      console.log('[RESET]', result.message);
      // Finalizar atividades pendentes
      await finalizarAtividadesPendentes();
    } else {
      console.error('[RESET] Erro ao conectar com MySQL:', result.error);
      console.warn('[RESET] Continuando sem limpeza de atividades pendentes...');
    }
    
    console.log('[RESET] ✅ Reset concluído. Serviços podem ser iniciados.');
    process.exit(0);
  } catch (error) {
    console.error('[RESET] ❌ Erro durante o reset:', error);
    console.warn('[RESET] ⚠️ Continuando com a inicialização dos serviços mesmo com erro no reset...');
    // Não bloquear a inicialização dos serviços mesmo se o reset falhar
    process.exit(0);
  }
}

main();

