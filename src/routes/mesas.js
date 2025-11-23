import express from 'express';
import { query } from '../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/mesas - Obter todas as mesas
router.get('/', async (req, res) => {
  try {
    // Ordenar numericamente quando possível, caso contrário alfabeticamente
    const mesas = await query(`
      SELECT id, numero, capacidade, ativa, created_at, updated_at 
      FROM mesas 
      ORDER BY 
        CASE 
          WHEN numero REGEXP '^[0-9]+$' THEN CAST(numero AS UNSIGNED)
          ELSE 999999
        END,
        numero ASC
    `);
    const formatted = mesas.map(mesa => {
      // Garantir que capacidade é um número inteiro
      const capacidade = typeof mesa.capacidade === 'number' 
        ? parseInt(mesa.capacidade) 
        : parseInt(mesa.capacidade) || 1;
      
      console.log('[MESAS API] Mesa formatada:', {
        id: mesa.id,
        numero: mesa.numero,
        capacidadeOriginal: mesa.capacidade,
        capacidadeFormatada: capacidade,
        tipo: typeof mesa.capacidade
      });
      
      return {
        id: mesa.id,
        numero: mesa.numero,
        capacidade: capacidade,
        ativa: mesa.ativa === 1
      };
    });
    res.json(formatted);
  } catch (error) {
    console.error('Erro ao obter mesas:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter mesas' });
  }
});

// GET /api/mesas/ativas - Obter apenas mesas ativas
router.get('/ativas', async (req, res) => {
  try {
    const mesas = await query(`
      SELECT * FROM mesas 
      WHERE ativa = 1 
      ORDER BY 
        CASE 
          WHEN numero REGEXP '^[0-9]+$' THEN CAST(numero AS UNSIGNED)
          ELSE 999999
        END,
        numero ASC
    `);
    const formatted = mesas.map(mesa => ({
      ...mesa,
      ativa: true
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Erro ao obter mesas ativas:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter mesas ativas' });
  }
});

// GET /api/mesas/:id/pedidos-ativos - Obter pedidos ativos de uma mesa (deve vir antes de /:id)
router.get('/:id/pedidos-ativos', async (req, res) => {
  try {
    const pedidos = await query(
      'SELECT * FROM pedidos WHERE mesa_id = ? AND status IN ("aberta", "pendente")',
      [req.params.id]
    );
    
    const pedidosComItens = await Promise.all(
      pedidos.map(async (pedido) => {
        const itens = await query('SELECT * FROM pedido_itens WHERE pedido_id = ?', [pedido.id]);
        return {
          id: pedido.id,
          nomeCliente: pedido.nome_cliente,
          mesaId: pedido.mesa_id,
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
    console.error('Erro ao obter pedidos ativos:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter pedidos ativos' });
  }
});

// GET /api/mesas/:id - Obter mesa por ID
router.get('/:id', async (req, res) => {
  try {
    const mesas = await query('SELECT * FROM mesas WHERE id = ?', [req.params.id]);
    if (mesas.length === 0) {
      return res.status(404).json({ success: false, error: 'Mesa não encontrada' });
    }
    const mesa = mesas[0];
    res.json({
      ...mesa,
      ativa: mesa.ativa === 1
    });
  } catch (error) {
    console.error('Erro ao obter mesa:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter mesa' });
  }
});

// POST /api/mesas - Criar nova mesa
router.post('/', async (req, res) => {
  try {
    const { numero, capacidade, ativa } = req.body;
    
    if (!numero || !capacidade) {
      return res.status(400).json({ success: false, error: 'Número e capacidade são obrigatórios' });
    }
    
    // Verificar se já existe mesa com este número
    const existing = await query('SELECT * FROM mesas WHERE numero = ?', [numero.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Já existe uma mesa com este número' });
    }
    
    const id = uuidv4();
    await query(
      'INSERT INTO mesas (id, numero, capacidade, ativa) VALUES (?, ?, ?, ?)',
      [id, numero.trim(), capacidade, ativa !== undefined ? (ativa ? 1 : 0) : 1]
    );
    
    const newMesa = await query('SELECT * FROM mesas WHERE id = ?', [id]);
    res.json({
      success: true,
      data: {
        ...newMesa[0],
        ativa: newMesa[0].ativa === 1
      }
    });
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar mesa' });
  }
});

// PUT /api/mesas/:id - Atualizar mesa
router.put('/:id', async (req, res) => {
  try {
    const { numero, capacidade, ativa } = req.body;
    
    const existing = await query('SELECT * FROM mesas WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Mesa não encontrada' });
    }
    
    // Verificar se outro número já existe
    if (numero && numero.trim() !== existing[0].numero) {
      const duplicate = await query('SELECT * FROM mesas WHERE numero = ? AND id != ?', [numero.trim(), req.params.id]);
      if (duplicate.length > 0) {
        return res.status(400).json({ success: false, error: 'Já existe uma mesa com este número' });
      }
    }
    
    await query(
      'UPDATE mesas SET numero = ?, capacidade = ?, ativa = ? WHERE id = ?',
      [
        numero || existing[0].numero,
        capacidade || existing[0].capacidade,
        ativa !== undefined ? (ativa ? 1 : 0) : existing[0].ativa,
        req.params.id
      ]
    );
    
    const updated = await query('SELECT * FROM mesas WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      data: {
        ...updated[0],
        ativa: updated[0].ativa === 1
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar mesa' });
  }
});

// DELETE /api/mesas/:id - Deletar mesa
router.delete('/:id', async (req, res) => {
  try {
    const mesaId = req.params.id;
    console.log('[DELETE MESA] Tentando excluir mesa com ID:', mesaId);
    
    const existing = await query('SELECT * FROM mesas WHERE id = ?', [mesaId]);
    console.log('[DELETE MESA] Mesas encontradas:', existing.length);
    
    if (existing.length === 0) {
      console.log('[DELETE MESA] Mesa não encontrada no banco');
      return res.status(404).json({ success: false, error: 'Mesa não encontrada' });
    }
    
    // Verificar se há pedidos ou reservas usando esta mesa
    const pedidos = await query('SELECT COUNT(*) as count FROM pedidos WHERE mesa_id = ?', [mesaId]);
    const reservas = await query('SELECT COUNT(*) as count FROM reservas WHERE mesa_id = ?', [mesaId]);
    
    const pedidosCount = pedidos[0]?.count || 0;
    const reservasCount = reservas[0]?.count || 0;
    
    if (pedidosCount > 0 || reservasCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Não é possível excluir a mesa. Existem pedidos ou reservas associados a ela.' 
      });
    }
    
    await query('DELETE FROM mesas WHERE id = ?', [mesaId]);
    console.log('[DELETE MESA] Mesa excluída com sucesso');
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar mesa:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar mesa' });
  }
});

export default router;

