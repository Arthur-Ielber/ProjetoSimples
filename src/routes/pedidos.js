import express from 'express';
import { query } from '../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/pedidos - Obter todos os pedidos
router.get('/', async (req, res) => {
  try {
    const { data } = req.query;
    let pedidos;
    
    if (data) {
      pedidos = await query('SELECT * FROM pedidos WHERE data = ? ORDER BY hora DESC, created_at DESC', [data]);
    } else {
      const hoje = new Date().toISOString().split('T')[0];
      pedidos = await query('SELECT * FROM pedidos WHERE data = ? ORDER BY hora DESC, created_at DESC', [hoje]);
    }
    
    // Buscar itens para cada pedido
    const pedidosComItens = await Promise.all(
      pedidos.map(async (pedido) => {
        const itens = await query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [pedido.id]);
        return {
          id: pedido.id,
          nomeCliente: pedido.nome_cliente,
          mesaId: pedido.mesa_id,
          reservaId: pedido.reserva_id,
          subtotal: parseFloat(pedido.subtotal),
          taxa: parseFloat(pedido.taxa),
          total: parseFloat(pedido.total),
          formaPagamento: pedido.forma_pagamento,
          observacoes: pedido.observacoes,
          observacoesFinalizacao: pedido.observacoes_finalizacao,
          status: pedido.status,
          data: pedido.data,
          hora: pedido.hora,
          created_at: pedido.created_at,
          updated_at: pedido.updated_at,
          itens: itens.map(item => ({
            menuItemId: item.menu_item_id,
            nome: item.nome,
            preco: parseFloat(item.preco),
            quantidade: item.quantidade,
            observacoes: item.observacoes
          }))
        };
      })
    );
    
    res.json(pedidosComItens);
  } catch (error) {
    console.error('Erro ao obter pedidos:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter pedidos' });
  }
});

// GET /api/pedidos/historico - Obter todos os pedidos (histórico completo)
router.get('/historico', async (req, res) => {
  try {
    console.log('[PEDIDOS] Rota /historico chamada');
    const pedidos = await query('SELECT * FROM pedidos ORDER BY data DESC, hora DESC, created_at DESC');
    
    // Buscar itens para cada pedido
    const pedidosComItens = await Promise.all(
      pedidos.map(async (pedido) => {
        const itens = await query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [pedido.id]);
        return {
          id: pedido.id,
          nomeCliente: pedido.nome_cliente,
          mesaId: pedido.mesa_id,
          reservaId: pedido.reserva_id,
          subtotal: parseFloat(pedido.subtotal),
          taxa: parseFloat(pedido.taxa),
          total: parseFloat(pedido.total),
          formaPagamento: pedido.forma_pagamento,
          observacoes: pedido.observacoes,
          observacoesFinalizacao: pedido.observacoes_finalizacao,
          status: pedido.status,
          data: pedido.data,
          hora: pedido.hora,
          created_at: pedido.created_at,
          updated_at: pedido.updated_at,
          itens: itens.map(item => ({
            menuItemId: item.menu_item_id,
            nome: item.nome,
            preco: parseFloat(item.preco),
            quantidade: item.quantidade,
            observacoes: item.observacoes
          }))
        };
      })
    );
    
    res.json(pedidosComItens);
  } catch (error) {
    console.error('Erro ao obter histórico de pedidos:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter histórico de pedidos' });
  }
});

// GET /api/pedidos/:id - Obter pedido por ID
router.get('/:id', async (req, res) => {
  try {
    const pedidos = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (pedidos.length === 0) {
      return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
    }
    
    const pedido = pedidos[0];
    const itens = await query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [pedido.id]);
    
    res.json({
      id: pedido.id,
      nomeCliente: pedido.nome_cliente,
      mesaId: pedido.mesa_id,
      reservaId: pedido.reserva_id,
      subtotal: parseFloat(pedido.subtotal),
      taxa: parseFloat(pedido.taxa),
      total: parseFloat(pedido.total),
      formaPagamento: pedido.forma_pagamento,
      observacoes: pedido.observacoes,
      observacoesFinalizacao: pedido.observacoes_finalizacao,
      status: pedido.status,
      data: pedido.data,
      hora: pedido.hora,
      created_at: pedido.created_at,
      updated_at: pedido.updated_at,
      itens: itens.map(item => ({
        menuItemId: item.menu_item_id,
        nome: item.nome,
        preco: parseFloat(item.preco),
        quantidade: item.quantidade,
        observacoes: item.observacoes
      }))
    });
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter pedido' });
  }
});

// POST /api/pedidos - Criar novo pedido
router.post('/', async (req, res) => {
  try {
    const { nomeCliente, mesaId, reservaId, itens, observacoes } = req.body;
    
    if (!nomeCliente || !itens || !Array.isArray(itens)) {
      return res.status(400).json({ success: false, error: 'Nome do cliente e itens são obrigatórios' });
    }
    
    // Calcular totais
    const subtotal = itens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const taxa = 0;
    const total = subtotal;
    
    // Data e hora atual
    const agora = new Date();
    const data = agora.toISOString().split('T')[0];
    const hora = agora.toTimeString().split(' ')[0].substring(0, 5);
    
    const id = uuidv4();
    
    // Criar pedido
    await query(
      `INSERT INTO pedidos (id, nome_cliente, mesa_id, reserva_id, subtotal, taxa, total, observacoes, status, data, hora) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aberta', ?, ?)`,
      [id, nomeCliente, mesaId || null, reservaId || null, subtotal, taxa, total, observacoes || null, data, hora]
    );
    
    // Criar itens do pedido
    for (const item of itens) {
      const itemId = uuidv4();
      await query(
        `INSERT INTO pedido_itens (id, pedido_id, menu_item_id, nome, preco, quantidade, observacoes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, id, item.menuItemId, item.nome, item.preco, item.quantidade, item.observacoes || null]
      );
    }
    
    const newPedido = await query('SELECT * FROM pedidos WHERE id = ?', [id]);
    const itensList = await query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [id]);
    
    res.json({
      success: true,
      data: {
        id: newPedido[0].id,
        nomeCliente: newPedido[0].nome_cliente,
        mesaId: newPedido[0].mesa_id,
        reservaId: newPedido[0].reserva_id,
        subtotal: parseFloat(newPedido[0].subtotal),
        taxa: parseFloat(newPedido[0].taxa),
        total: parseFloat(newPedido[0].total),
        formaPagamento: newPedido[0].forma_pagamento,
        observacoes: newPedido[0].observacoes,
        observacoesFinalizacao: newPedido[0].observacoes_finalizacao,
        status: newPedido[0].status,
        data: newPedido[0].data,
        hora: newPedido[0].hora,
        created_at: newPedido[0].created_at,
        updated_at: newPedido[0].updated_at,
        itens: itensList.map(item => ({
          menuItemId: item.menu_item_id,
          nome: item.nome,
          preco: parseFloat(item.preco),
          quantidade: item.quantidade,
          observacoes: item.observacoes
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar pedido' });
  }
});

// PUT /api/pedidos/:id - Atualizar pedido
router.put('/:id', async (req, res) => {
  try {
    const { nomeCliente, mesaId, reservaId, itens, observacoes } = req.body;
    
    const existing = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
    }
    
    // Recalcular totais se itens mudaram
    let subtotal = existing[0].subtotal;
    let total = existing[0].total;
    
    if (itens && Array.isArray(itens)) {
      subtotal = itens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
      total = subtotal;
      
      // Deletar itens antigos e criar novos
      await query('DELETE FROM pedido_itens WHERE pedido_id = ?', [req.params.id]);
      
      for (const item of itens) {
        const itemId = uuidv4();
        await query(
          `INSERT INTO pedido_itens (id, pedido_id, menu_item_id, nome, preco, quantidade, observacoes) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [itemId, req.params.id, item.menuItemId, item.nome, item.preco, item.quantidade, item.observacoes || null]
        );
      }
    }
    
    await query(
      `UPDATE pedidos 
       SET nome_cliente = ?, mesa_id = ?, reserva_id = ?, subtotal = ?, total = ?, observacoes = ? 
       WHERE id = ?`,
      [
        nomeCliente || existing[0].nome_cliente,
        mesaId !== undefined ? mesaId : existing[0].mesa_id,
        reservaId !== undefined ? reservaId : existing[0].reserva_id,
        subtotal,
        total,
        observacoes !== undefined ? observacoes : existing[0].observacoes,
        req.params.id
      ]
    );
    
    const updated = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    const itensList = await query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [req.params.id]);
    
    res.json({
      success: true,
      data: {
        id: updated[0].id,
        nomeCliente: updated[0].nome_cliente,
        mesaId: updated[0].mesa_id,
        reservaId: updated[0].reserva_id,
        subtotal: parseFloat(updated[0].subtotal),
        taxa: parseFloat(updated[0].taxa),
        total: parseFloat(updated[0].total),
        formaPagamento: updated[0].forma_pagamento,
        observacoes: updated[0].observacoes,
        observacoesFinalizacao: updated[0].observacoes_finalizacao,
        status: updated[0].status,
        data: updated[0].data,
        hora: updated[0].hora,
        created_at: updated[0].created_at,
        updated_at: updated[0].updated_at,
        itens: itensList.map(item => ({
          menuItemId: item.menu_item_id,
          nome: item.nome,
          preco: parseFloat(item.preco),
          quantidade: item.quantidade,
          observacoes: item.observacoes
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar pedido' });
  }
});

// PATCH /api/pedidos/:id/marcar-pendente - Marcar como pendente
router.patch('/:id/marcar-pendente', async (req, res) => {
  try {
    const { formaPagamento, observacoesFinalizacao } = req.body;
    
    const existing = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
    }
    
    await query(
      'UPDATE pedidos SET status = ?, forma_pagamento = ?, observacoes_finalizacao = ? WHERE id = ?',
      ['pendente', formaPagamento || null, observacoesFinalizacao || null, req.params.id]
    );
    
    const updated = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    const itens = await query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [req.params.id]);
    
    res.json({
      success: true,
      data: {
        ...updated[0],
        itens: itens.map(item => ({
          menuItemId: item.menu_item_id,
          nome: item.nome,
          preco: parseFloat(item.preco),
          quantidade: item.quantidade,
          observacoes: item.observacoes
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao marcar pedido como pendente:', error);
    res.status(500).json({ success: false, error: 'Erro ao marcar pedido como pendente' });
  }
});

// PATCH /api/pedidos/:id/finalizar - Finalizar pedido
router.patch('/:id/finalizar', async (req, res) => {
  try {
    const existing = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
    }
    
    await query('UPDATE pedidos SET status = ? WHERE id = ?', ['finalizada', req.params.id]);
    
    const updated = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    const itens = await query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [req.params.id]);
    
    res.json({
      success: true,
      data: {
        ...updated[0],
        itens: itens.map(item => ({
          menuItemId: item.menu_item_id,
          nome: item.nome,
          preco: parseFloat(item.preco),
          quantidade: item.quantidade,
          observacoes: item.observacoes
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error);
    res.status(500).json({ success: false, error: 'Erro ao finalizar pedido' });
  }
});

// PATCH /api/pedidos/:id/reabrir - Reabrir pedido pendente
router.patch('/:id/reabrir', async (req, res) => {
  try {
    const existing = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
    }
    
    if (existing[0].status !== 'pendente') {
      return res.status(400).json({ success: false, error: 'Apenas comandas pendentes podem ser reabertas' });
    }
    
    await query('UPDATE pedidos SET status = ? WHERE id = ?', ['aberta', req.params.id]);
    
    const updated = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    const itens = await query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [req.params.id]);
    
    res.json({
      success: true,
      data: {
        ...updated[0],
        itens: itens.map(item => ({
          menuItemId: item.menu_item_id,
          nome: item.nome,
          preco: parseFloat(item.preco),
          quantidade: item.quantidade,
          observacoes: item.observacoes
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao reabrir pedido:', error);
    res.status(500).json({ success: false, error: 'Erro ao reabrir pedido' });
  }
});

// POST /api/pedidos/cancelar-comandas-antigas - Cancelar comandas de reserva antigas sem itens (5 minutos)
router.post('/cancelar-comandas-antigas', async (req, res) => {
  try {
    // Buscar comandas de reserva sem itens com mais de 5 minutos
    const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const comandas = await query(
      `SELECT p.* FROM pedidos p 
       WHERE p.observacoes LIKE '%Comanda aberta automaticamente para reserva confirmada%'
       AND p.status IN ('aberta', 'pendente')
       AND p.created_at < ?
       AND NOT EXISTS (
         SELECT 1 FROM pedido_itens pi WHERE pi.pedido_id = p.id
       )`,
      [cincoMinutosAtras]
    );
    
    let canceladas = 0;
    for (const comanda of comandas) {
      // Cancelar comanda
      await query(
        `UPDATE pedidos 
         SET status = 'cancelada', 
             observacoes_finalizacao = 'Cancelada automaticamente por inatividade (sem itens em 5 minutos)'
         WHERE id = ?`,
        [comanda.id]
      );
      
      // Se a comanda tiver uma reserva associada, cancelar a reserva também
      if (comanda.reserva_id) {
        // Verificar se a reserva está em "cliente_na_mesa" (estado após abertura da comanda)
        const reserva = await query('SELECT * FROM reservas WHERE id = ?', [comanda.reserva_id]);
        if (reserva.length > 0 && reserva[0].estado === 'cliente_na_mesa') {
          await query(
            `UPDATE reservas SET estado = 'cancelado' WHERE id = ?`,
            [comanda.reserva_id]
          );
          
          // Adicionar observação automática
          const obsId = uuidv4();
          await query(
            'INSERT INTO reserva_observacoes (id, reserva_id, mensagem, autor) VALUES (?, ?, ?, ?)',
            [obsId, comanda.reserva_id, 'Reserva cancelada automaticamente: comanda sem interação em 5 minutos', 'admin']
          );
          
          console.log(`[AUTO] Reserva ${comanda.reserva_id} cancelada automaticamente devido à comanda sem itens por 5 minutos`);
        }
      }
      
      canceladas++;
    }
    
    res.json({ success: true, canceladas });
  } catch (error) {
    console.error('Erro ao cancelar comandas antigas:', error);
    res.status(500).json({ success: false, error: 'Erro ao cancelar comandas antigas' });
  }
});

// DELETE /api/pedidos/:id - Deletar pedido
router.delete('/:id', async (req, res) => {
  try {
    const existing = await query('SELECT * FROM pedidos WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Pedido não encontrado' });
    }
    
    if (existing[0].status === 'finalizada') {
      return res.status(400).json({ success: false, error: 'Não é possível excluir uma comanda finalizada' });
    }
    
    // Itens serão deletados automaticamente por CASCADE
    await query('DELETE FROM pedidos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar pedido' });
  }
});

export default router;

