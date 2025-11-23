import express from 'express';
import { query } from '../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/reservas - Obter todas as reservas
router.get('/', async (req, res) => {
  try {
    console.log('[API RESERVAS] Buscando reservas no banco...');
    const reservas = await query('SELECT * FROM reservas ORDER BY data_reserva ASC, hora_reserva ASC');
    console.log(`[API RESERVAS] Encontradas ${reservas.length} reservas no banco`);
    
    // Se não houver reservas, retornar array vazio
    if (!reservas || reservas.length === 0) {
      console.log('[API RESERVAS] Nenhuma reserva encontrada, retornando array vazio');
      return res.json([]);
    }
    
    // Buscar observações para cada reserva
    const reservasComObservacoes = await Promise.all(
      reservas.map(async (reserva) => {
        const observacoes = await query(
          'SELECT * FROM reserva_observacoes WHERE reserva_id = ? ORDER BY created_at ASC',
          [reserva.id]
        );
        return {
          ...reserva,
          confirmado_pelo_cliente: reserva.confirmado_pelo_cliente !== null && reserva.confirmado_pelo_cliente !== undefined ? reserva.confirmado_pelo_cliente : 0, // Garantir que sempre retorna um valor
          observacoes: observacoes.map(obs => ({
            id: obs.id,
            mensagem: obs.mensagem,
            autor: obs.autor,
            autor_nome: obs.autor_nome,
            created_at: obs.created_at
          }))
        };
      })
    );
    
    console.log(`[API RESERVAS] Retornando ${reservasComObservacoes.length} reservas com observações`);
    
    // Log para debug do campo confirmado_pelo_cliente
    reservasComObservacoes.forEach(r => {
      if (r.estado === 'confirmado_cliente' || r.estado === 'aguardando_cliente' || r.estado === 'cliente_na_mesa') {
        console.log(`[API RESERVAS] Reserva ${r.id} (${r.nome}): estado = ${r.estado}, confirmado_pelo_cliente = ${r.confirmado_pelo_cliente}, tipo: ${typeof r.confirmado_pelo_cliente}`);
      }
    });
    
    res.json(reservasComObservacoes);
  } catch (error) {
    console.error('[API RESERVAS] Erro ao obter reservas:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter reservas' });
  }
});

// GET /api/reservas/:id - Obter reserva por ID
router.get('/:id', async (req, res) => {
  try {
    const reservas = await query('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (reservas.length === 0) {
      return res.status(404).json({ success: false, error: 'Reserva não encontrada' });
    }
    
    const reserva = reservas[0];
    const observacoes = await query(
      'SELECT * FROM reserva_observacoes WHERE reserva_id = ? ORDER BY created_at ASC',
      [reserva.id]
    );
    
    // Garantir que confirmado_pelo_cliente está presente na resposta
    const reservaCompleta = {
      ...reserva,
      confirmado_pelo_cliente: reserva.confirmado_pelo_cliente || 0,
      observacoes: observacoes.map(obs => ({
        id: obs.id,
        mensagem: obs.mensagem,
        autor: obs.autor,
        autor_nome: obs.autor_nome,
        created_at: obs.created_at
      }))
    };
    
    console.log(`[API RESERVAS] GET /:id - confirmado_pelo_cliente:`, reservaCompleta.confirmado_pelo_cliente, typeof reservaCompleta.confirmado_pelo_cliente);
    
    res.json(reservaCompleta);
  } catch (error) {
    console.error('Erro ao obter reserva:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter reserva' });
  }
});

// POST /api/reservas - Criar nova reserva
router.post('/', async (req, res) => {
  try {
    const { id, nome, apelido, telefone, email, data_reserva, hora_reserva, numero_pessoas, mesa_id, mesaId, observacoes, estado, token_confirmacao, token_cancelamento, resposta_cliente, observacoes_restaurante } = req.body;
    
    if (!nome || !apelido || !telefone || !email || !data_reserva || !hora_reserva || !numero_pessoas) {
      return res.status(400).json({ success: false, error: 'Campos obrigatórios faltando' });
    }
    
    // Usar ID fornecido ou gerar novo
    const reservaId = id || uuidv4();
    const tokenConfirmacao = token_confirmacao || uuidv4();
    const tokenCancelamento = token_cancelamento || uuidv4();
    const reservaEstado = estado || 'pendente';
    
    await query(
      `INSERT INTO reservas (id, nome, apelido, telefone, email, data_reserva, hora_reserva, numero_pessoas, mesa_id, token_confirmacao, token_cancelamento, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reservaId, nome, apelido, telefone, email, data_reserva, hora_reserva, numero_pessoas, (mesa_id || mesaId) || null, tokenConfirmacao, tokenCancelamento, reservaEstado]
    );

    
    // Adicionar observação inicial se fornecida
    if (observacoes && observacoes.trim()) {
      const obsId = uuidv4();
      await query(
        'INSERT INTO reserva_observacoes (id, reserva_id, mensagem, autor) VALUES (?, ?, ?, ?)',
        [obsId, reservaId, observacoes.trim(), 'cliente']
      );
    }
    
    const newReserva = await query('SELECT * FROM reservas WHERE id = ?', [reservaId]);
    const observacoesList = await query(
      'SELECT * FROM reserva_observacoes WHERE reserva_id = ? ORDER BY created_at ASC',
      [reservaId]
    );
    
    res.json({
      success: true,
      data: {
        ...newReserva[0],
        observacoes: observacoesList.map(obs => ({
          id: obs.id,
          mensagem: obs.mensagem,
          autor: obs.autor,
          autor_nome: obs.autor_nome,
          created_at: obs.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar reserva' });
  }
});

// PUT /api/reservas/:id - Atualizar reserva
router.put('/:id', async (req, res) => {
  try {
    console.log(`[API RESERVAS] Atualizando reserva ${req.params.id}`, req.body);
    const { nome, apelido, telefone, email, data_reserva, hora_reserva, numero_pessoas, estado, mesa_id, token_confirmacao, token_cancelamento, confirmado_pelo_cliente, resposta_cliente, observacoes_restaurante } = req.body;
    
    const existing = await query('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      console.log(`[API RESERVAS] Reserva ${req.params.id} não encontrada`);
      return res.status(404).json({ success: false, error: 'Reserva não encontrada' });
    }
    
    // Não permitir atualização de reservas finalizadas
    if (existing[0].estado === 'finalizado') {
      console.log(`[API RESERVAS] Tentativa de atualizar reserva ${req.params.id} que está finalizada`);
      return res.status(400).json({ success: false, error: 'Não é possível atualizar uma reserva finalizada' });
    }
    
    // Preparar valores para atualização (usar valores fornecidos ou manter existentes)
    const updateValues = {
      nome: nome !== undefined ? nome : existing[0].nome,
      apelido: apelido !== undefined ? apelido : existing[0].apelido,
      telefone: telefone !== undefined ? telefone : existing[0].telefone,
      email: email !== undefined ? email : existing[0].email,
      data_reserva: data_reserva !== undefined ? data_reserva : existing[0].data_reserva,
      hora_reserva: hora_reserva !== undefined ? hora_reserva : existing[0].hora_reserva,
      numero_pessoas: numero_pessoas !== undefined ? numero_pessoas : existing[0].numero_pessoas,
      estado: estado !== undefined ? estado : existing[0].estado,
      mesa_id: mesa_id !== undefined ? mesa_id : existing[0].mesa_id,
    };
    
    // Tratar token_confirmacao separadamente para evitar problemas com UNIQUE
    let finalTokenConfirmacao = existing[0].token_confirmacao;
    if (token_confirmacao !== undefined) {
      if (token_confirmacao && token_confirmacao.trim()) {
        // Verificar se o token já existe em outra reserva
        const tokenExists = await query(
          'SELECT id FROM reservas WHERE token_confirmacao = ? AND id != ?',
          [token_confirmacao.trim(), req.params.id]
        );
        if (tokenExists.length > 0) {
          console.log(`[API RESERVAS] Token ${token_confirmacao.substring(0, 20)}... já existe em outra reserva, gerando novo token`);
          finalTokenConfirmacao = uuidv4();
        } else {
          finalTokenConfirmacao = token_confirmacao.trim();
        }
      } else {
        // Se token_confirmacao for null ou vazio, limpar o token (invalidar)
        // Se explicitamente passado como null, limpar o token
        if (token_confirmacao === null || token_confirmacao === '') {
          finalTokenConfirmacao = null;
          console.log(`[API RESERVAS] Token de confirmação invalidado (limpo) para reserva ${req.params.id}`);
        }
        // Caso contrário, manter o token existente
      }
    } else if (estado === 'aguardando_cliente' && !finalTokenConfirmacao) {
      // Se o estado for 'aguardando_cliente' e não houver token, gerar um novo
      console.log(`[API RESERVAS] Estado é 'aguardando_cliente' mas não há token, gerando novo token`);
      finalTokenConfirmacao = uuidv4();
    }
    updateValues.token_confirmacao = finalTokenConfirmacao;
    
    // Tratar token_cancelamento separadamente para evitar problemas com UNIQUE
    let finalTokenCancelamento = existing[0].token_cancelamento;
    if (token_cancelamento !== undefined) {
      if (token_cancelamento && token_cancelamento.trim()) {
        // Verificar se o token já existe em outra reserva
        const tokenExists = await query(
          'SELECT id FROM reservas WHERE token_cancelamento = ? AND id != ?',
          [token_cancelamento.trim(), req.params.id]
        );
        if (tokenExists.length > 0) {
          console.log(`[API RESERVAS] Token de cancelamento ${token_cancelamento.substring(0, 20)}... já existe em outra reserva, gerando novo token`);
          finalTokenCancelamento = uuidv4();
        } else {
          finalTokenCancelamento = token_cancelamento.trim();
        }
      } else {
        // Se token_cancelamento for null ou vazio, limpar o token (invalidar)
        if (token_cancelamento === null || token_cancelamento === '') {
          finalTokenCancelamento = null;
          console.log(`[API RESERVAS] Token de cancelamento invalidado (limpo) para reserva ${req.params.id}`);
        }
        // Caso contrário, manter o token existente
      }
    } else if (estado === 'pendente' && !finalTokenCancelamento) {
      // Se o estado for 'pendente' e não houver token de cancelamento, gerar um novo
      console.log(`[API RESERVAS] Estado é 'pendente' mas não há token de cancelamento, gerando novo token`);
      finalTokenCancelamento = uuidv4();
    }
    updateValues.token_cancelamento = finalTokenCancelamento;
    
    console.log(`[API RESERVAS] Valores para atualização:`, {
      ...updateValues,
      token_confirmacao: finalTokenConfirmacao ? finalTokenConfirmacao.substring(0, 20) + '...' : 'null'
    });
    
    try {
      await query(
        `UPDATE reservas 
         SET nome = ?, apelido = ?, telefone = ?, email = ?, data_reserva = ?, hora_reserva = ?, 
             numero_pessoas = ?, estado = ?, mesa_id = ?, token_confirmacao = ?, token_cancelamento = ?,
             confirmado_pelo_cliente = ?, resposta_cliente = ?, observacoes_restaurante = ?
         WHERE id = ?`,
        [
          updateValues.nome,
          updateValues.apelido,
          updateValues.telefone,
          updateValues.email,
          updateValues.data_reserva,
          updateValues.hora_reserva,
          updateValues.numero_pessoas,
          updateValues.estado,
          updateValues.mesa_id,
          updateValues.token_confirmacao,
          updateValues.token_cancelamento,
          confirmado_pelo_cliente !== undefined ? (confirmado_pelo_cliente === true || confirmado_pelo_cliente === 1 || confirmado_pelo_cliente === '1' ? 1 : 0) : (existing[0].confirmado_pelo_cliente || 0),
          resposta_cliente !== undefined ? resposta_cliente : existing[0].resposta_cliente,
          observacoes_restaurante !== undefined ? observacoes_restaurante : existing[0].observacoes_restaurante,
          req.params.id
        ]
      );
    } catch (dbError) {
      console.error(`[API RESERVAS] Erro no banco ao atualizar reserva ${req.params.id}:`, dbError);
      console.error(`[API RESERVAS] Detalhes do erro:`, dbError.message, dbError.code);
      throw dbError;
    }
    
    console.log(`[API RESERVAS] Reserva ${req.params.id} atualizada com sucesso`);
    console.log(`[API RESERVAS] Valor de confirmado_pelo_cliente recebido:`, confirmado_pelo_cliente, typeof confirmado_pelo_cliente);
    
    const updated = await query('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    console.log(`[API RESERVAS] Valor de confirmado_pelo_cliente no banco após update:`, updated[0]?.confirmado_pelo_cliente, typeof updated[0]?.confirmado_pelo_cliente);
    
    const observacoes = await query(
      'SELECT * FROM reserva_observacoes WHERE reserva_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    
    // Garantir que confirmado_pelo_cliente está presente na resposta
    const reservaAtualizada = {
      ...updated[0],
      confirmado_pelo_cliente: updated[0].confirmado_pelo_cliente || 0,
      observacoes: observacoes.map(obs => ({
        id: obs.id,
        mensagem: obs.mensagem,
        autor: obs.autor,
        autor_nome: obs.autor_nome,
        created_at: obs.created_at
      }))
    };
    
    console.log(`[API RESERVAS] Retornando reserva atualizada com confirmado_pelo_cliente:`, reservaAtualizada.confirmado_pelo_cliente);
    
    res.json({
      success: true,
      data: reservaAtualizada
    });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar reserva' });
  }
});

// POST /api/reservas/finalizar-canceladas-antigas - Finalizar reservas canceladas com mais de 5 minutos sem interação e excluir comandas
router.post('/finalizar-canceladas-antigas', async (req, res) => {
  try {
    // Buscar reservas canceladas com mais de 5 minutos sem interação
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const reservasCanceladas = await query(
      `SELECT id, updated_at FROM reservas 
       WHERE estado = 'cancelado' 
       AND updated_at < ?`,
      [cincoMinutosAtras]
    );
    
    let finalizadas = 0;
    for (const reserva of reservasCanceladas) {
      // Verificar se houve interação (observações) após o cancelamento
      const observacoesAposCancelamento = await query(
        `SELECT COUNT(*) as count FROM reserva_observacoes 
         WHERE reserva_id = ? AND created_at > ?`,
        [reserva.id, reserva.updated_at]
      );
      
      // Se não houver observações após o cancelamento, finalizar
      if (observacoesAposCancelamento[0].count === 0) {
        // PRIMEIRO: Buscar e excluir comandas associadas a esta reserva
        const comandas = await query(
          `SELECT id FROM pedidos WHERE reserva_id = ?`,
          [reserva.id]
        );
        
        for (const comanda of comandas) {
          // Excluir itens da comanda primeiro (CASCADE pode fazer isso automaticamente, mas vamos garantir)
          await query('DELETE FROM pedido_itens WHERE pedido_id = ?', [comanda.id]);
          // Excluir a comanda
          await query('DELETE FROM pedidos WHERE id = ?', [comanda.id]);
          console.log(`[AUTO] Comanda ${comanda.id} excluída automaticamente junto com reserva ${reserva.id}`);
        }
        
        // SEGUNDO: Finalizar a reserva
        await query(
          `UPDATE reservas SET estado = 'finalizado' WHERE id = ?`,
          [reserva.id]
        );
        
        // TERCEIRO: Adicionar observação automática com o motivo
        const obsId = uuidv4();
        await query(
          'INSERT INTO reserva_observacoes (id, reserva_id, mensagem, autor) VALUES (?, ?, ?, ?)',
          [obsId, reserva.id, 'Cliente não apareceu, reserva cancelada automaticamente.', 'admin']
        );
        
        finalizadas++;
        console.log(`[AUTO] Reserva ${reserva.id} cancelada há mais de 5 minutos foi finalizada automaticamente: cliente não apareceu. ${comandas.length} comanda(s) excluída(s).`);
      }
    }
    
    res.json({ success: true, finalizadas });
  } catch (error) {
    console.error('[API RESERVAS] Erro ao finalizar reservas canceladas antigas:', error);
    res.status(500).json({ success: false, error: 'Erro ao finalizar reservas canceladas antigas' });
  }
});

// POST /api/reservas/:id/observacoes - Adicionar observação
router.post('/:id/observacoes', async (req, res) => {
  try {
    const { mensagem, autor, autor_nome } = req.body;
    
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ success: false, error: 'Mensagem é obrigatória' });
    }
    
    const reserva = await query('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (reserva.length === 0) {
      return res.status(404).json({ success: false, error: 'Reserva não encontrada' });
    }
    
    const obsId = uuidv4();
    await query(
      'INSERT INTO reserva_observacoes (id, reserva_id, mensagem, autor, autor_nome) VALUES (?, ?, ?, ?, ?)',
      [obsId, req.params.id, mensagem.trim(), autor || 'admin', autor_nome || null]
    );
    
    const newObs = await query('SELECT * FROM reserva_observacoes WHERE id = ?', [obsId]);
    res.json({ success: true, data: newObs[0] });
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    res.status(500).json({ success: false, error: 'Erro ao adicionar observação' });
  }
});

// GET /api/reservas/mesa/:mesaId/data/:data - Obter reservas confirmadas para mesa e data
router.get('/mesa/:mesaId/data/:data', async (req, res) => {
  try {
    const { mesaId, data } = req.params;
    const reservas = await query(
      'SELECT * FROM reservas WHERE mesa_id = ? AND data_reserva = ? AND (estado = "aguardando_cliente" OR estado = "confirmado_cliente" OR estado = "cliente_na_mesa")',
      [mesaId, data]
    );
    res.json(reservas);
  } catch (error) {
    console.error('Erro ao obter reservas da mesa:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter reservas da mesa' });
  }
});

// DELETE /api/reservas/:id - Deletar reserva
router.delete('/:id', async (req, res) => {
  try {
    const existing = await query('SELECT * FROM reservas WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Reserva não encontrada' });
    }
    
    // Observações serão deletadas automaticamente por CASCADE
    await query('DELETE FROM reservas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar reserva:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar reserva' });
  }
});

export default router;

