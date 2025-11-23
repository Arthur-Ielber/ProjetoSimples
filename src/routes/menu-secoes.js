import express from 'express';
import { query } from '../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/menu-secoes - Obter todas as seções
router.get('/', async (req, res) => {
  try {
    const sections = await query('SELECT * FROM menu_secoes ORDER BY ordem ASC, nome ASC');
    res.json(sections);
  } catch (error) {
    console.error('Erro ao obter seções:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter seções' });
  }
});

// POST /api/menu-secoes - Criar nova seção
router.post('/', async (req, res) => {
  try {
    const { nome } = req.body;
    
    if (!nome || !nome.trim()) {
      return res.status(400).json({ success: false, error: 'Nome da seção é obrigatório' });
    }
    
    // Verificar se já existe
    const existing = await query('SELECT * FROM menu_secoes WHERE nome = ?', [nome.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Já existe uma seção com este nome' });
    }
    
    // Obter maior ordem
    const maxOrder = await query('SELECT MAX(ordem) as max_ordem FROM menu_secoes');
    const newOrder = (maxOrder[0]?.max_ordem || 0) + 1;
    
    const id = uuidv4();
    await query(
      'INSERT INTO menu_secoes (id, nome, ordem) VALUES (?, ?, ?)',
      [id, nome.trim(), newOrder]
    );
    
    const newSection = await query('SELECT * FROM menu_secoes WHERE id = ?', [id]);
    res.json({ success: true, data: newSection[0] });
  } catch (error) {
    console.error('Erro ao criar seção:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar seção' });
  }
});

// PUT /api/menu-secoes/:id - Atualizar seção
router.put('/:id', async (req, res) => {
  try {
    const { nome } = req.body;
    
    if (!nome || !nome.trim()) {
      return res.status(400).json({ success: false, error: 'Nome da seção é obrigatório' });
    }
    
    // Verificar se existe
    const existing = await query('SELECT * FROM menu_secoes WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Seção não encontrada' });
    }
    
    // Verificar se outro nome já existe
    const duplicate = await query('SELECT * FROM menu_secoes WHERE nome = ? AND id != ?', [nome.trim(), req.params.id]);
    if (duplicate.length > 0) {
      return res.status(400).json({ success: false, error: 'Já existe uma seção com este nome' });
    }
    
    await query('UPDATE menu_secoes SET nome = ? WHERE id = ?', [nome.trim(), req.params.id]);
    
    const updated = await query('SELECT * FROM menu_secoes WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Erro ao atualizar seção:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar seção' });
  }
});

// DELETE /api/menu-secoes/:id - Deletar seção
router.delete('/:id', async (req, res) => {
  try {
    // Verificar se existe
    const existing = await query('SELECT * FROM menu_secoes WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Seção não encontrada' });
    }
    
    // Verificar se há itens usando esta seção
    const items = await query('SELECT COUNT(*) as count FROM ementa WHERE secao = ?', [existing[0].nome]);
    if (items[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Não é possível excluir a seção. Existem ${items[0].count} item(ns) associado(s) a ela.` 
      });
    }
    
    await query('DELETE FROM menu_secoes WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar seção:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar seção' });
  }
});

export default router;

