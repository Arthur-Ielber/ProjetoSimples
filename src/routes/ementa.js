import express from 'express';
import { query } from '../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/ementa - Obter todos os itens
router.get('/', async (req, res) => {
  try {
    // Não retornar imagem_blob na listagem (muito pesado)
    const items = await query(`
      SELECT id, nome, descricao, preco, secao, destaque, ativo, imagem_url, created_at, updated_at,
             CASE WHEN imagem_blob IS NOT NULL THEN 1 ELSE 0 END as tem_imagem_blob
      FROM ementa 
      ORDER BY created_at DESC
    `);
    // Converter TINYINT para boolean
    const formatted = items.map(item => ({
      ...item,
      destaque: item.destaque === 1,
      ativo: item.ativo === 1,
      tem_imagem_blob: item.tem_imagem_blob === 1,
      // Se tiver imagem_blob, usar rota de imagem
      imagem_url: item.tem_imagem_blob === 1 
        ? `/api/upload/ementa/${item.id}` 
        : item.imagem_url
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Erro ao obter ementa:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter ementa' });
  }
});

// GET /api/ementa/ativos - Obter apenas itens ativos
router.get('/ativos', async (req, res) => {
  try {
    const items = await query('SELECT * FROM ementa WHERE ativo = 1 ORDER BY created_at DESC');
    const formatted = items.map(item => ({
      ...item,
      destaque: item.destaque === 1,
      ativo: true
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Erro ao obter ementa ativa:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter ementa ativa' });
  }
});

// GET /api/ementa/destaque - Obter itens em destaque
router.get('/destaque', async (req, res) => {
  try {
    const items = await query('SELECT * FROM ementa WHERE destaque = 1 AND ativo = 1 ORDER BY updated_at DESC');
    const formatted = items.map(item => ({
      ...item,
      destaque: true,
      ativo: item.ativo === 1
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Erro ao obter destaques:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter destaques' });
  }
});

// GET /api/ementa/:id - Obter item por ID
router.get('/:id', async (req, res) => {
  try {
    const items = await query('SELECT * FROM ementa WHERE id = ?', [req.params.id]);
    if (items.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    const item = items[0];
    res.json({
      ...item,
      destaque: item.destaque === 1,
      ativo: item.ativo === 1
    });
  } catch (error) {
    console.error('Erro ao obter item:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter item' });
  }
});

// POST /api/ementa - Criar novo item
router.post('/', async (req, res) => {
  try {
    const { nome, descricao, preco, secao, destaque, ativo, imagem_url, imagem_blob } = req.body;
    
    if (!nome || !preco || !secao) {
      return res.status(400).json({ success: false, error: 'Nome, preço e seção são obrigatórios' });
    }
    
    // Converter base64 para Buffer se imagem_blob for fornecido
    let imageBuffer = null;
    if (imagem_blob) {
      try {
        // Se vier como base64 string, converter para Buffer
        if (typeof imagem_blob === 'string') {
          // Remover data URL prefix se existir
          const base64Data = imagem_blob.includes(',') 
            ? imagem_blob.split(',')[1] 
            : imagem_blob;
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          imageBuffer = imagem_blob;
        }
      } catch (error) {
        console.error('Erro ao processar imagem_blob:', error);
        return res.status(400).json({ success: false, error: 'Erro ao processar imagem' });
      }
    }
    
    const id = uuidv4();
    await query(
      `INSERT INTO ementa (id, nome, descricao, preco, secao, destaque, ativo, imagem_url, imagem_blob) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        nome,
        descricao || null,
        preco,
        secao,
        destaque ? 1 : 0,
        ativo !== undefined ? (ativo ? 1 : 0) : 1,
        imagem_url || null,
        imageBuffer
      ]
    );
    
    const newItem = await query('SELECT * FROM ementa WHERE id = ?', [id]);
    const item = newItem[0];
    res.json({
      success: true,
      data: {
        ...item,
        destaque: item.destaque === 1,
        ativo: item.ativo === 1
      }
    });
  } catch (error) {
    console.error('Erro ao criar item:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar item' });
  }
});

// PUT /api/ementa/:id - Atualizar item
router.put('/:id', async (req, res) => {
  try {
    const { nome, descricao, preco, secao, destaque, ativo, imagem_url, imagem_blob } = req.body;
    
    // Verificar se existe
    const existing = await query('SELECT * FROM ementa WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    // Processar imagem_blob se fornecido
    let imageBuffer = null;
    if (imagem_blob !== undefined) {
      if (imagem_blob === null) {
        // Se for null explicitamente, remover a imagem
        imageBuffer = null;
      } else if (typeof imagem_blob === 'string' && imagem_blob.length > 0) {
        // Converter base64 para Buffer
        try {
          const base64Data = imagem_blob.includes(',') 
            ? imagem_blob.split(',')[1] 
            : imagem_blob;
          imageBuffer = Buffer.from(base64Data, 'base64');
        } catch (error) {
          console.error('Erro ao processar imagem_blob:', error);
          return res.status(400).json({ success: false, error: 'Erro ao processar imagem' });
        }
      }
    }
    
    // Se imagem_blob não foi fornecido, manter o valor existente
    const finalImageBlob = imagem_blob !== undefined ? imageBuffer : undefined;
    
    if (finalImageBlob !== undefined) {
      // Atualizar incluindo imagem_blob
      await query(
        `UPDATE ementa 
         SET nome = ?, descricao = ?, preco = ?, secao = ?, destaque = ?, ativo = ?, imagem_url = ?, imagem_blob = ?
         WHERE id = ?`,
        [
          nome,
          descricao || null,
          preco,
          secao,
          destaque ? 1 : 0,
          ativo !== undefined ? (ativo ? 1 : 0) : existing[0].ativo,
          imagem_url || null,
          finalImageBlob,
          req.params.id
        ]
      );
    } else {
      // Atualizar sem modificar imagem_blob
      await query(
        `UPDATE ementa 
         SET nome = ?, descricao = ?, preco = ?, secao = ?, destaque = ?, ativo = ?, imagem_url = ?
         WHERE id = ?`,
        [
          nome,
          descricao || null,
          preco,
          secao,
          destaque ? 1 : 0,
          ativo !== undefined ? (ativo ? 1 : 0) : existing[0].ativo,
          imagem_url || null,
          req.params.id
        ]
      );
    }
    
    const updated = await query('SELECT * FROM ementa WHERE id = ?', [req.params.id]);
    const item = updated[0];
    res.json({
      success: true,
      data: {
        ...item,
        destaque: item.destaque === 1,
        ativo: item.ativo === 1
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar item' });
  }
});

// PATCH /api/ementa/:id/toggle-ativo - Ativar/Desativar item
router.patch('/:id/toggle-ativo', async (req, res) => {
  try {
    const existing = await query('SELECT * FROM ementa WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    const newAtivo = existing[0].ativo === 1 ? 0 : 1;
    await query('UPDATE ementa SET ativo = ? WHERE id = ?', [newAtivo, req.params.id]);
    
    const updated = await query('SELECT * FROM ementa WHERE id = ?', [req.params.id]);
    const item = updated[0];
    res.json({
      success: true,
      data: {
        ...item,
        destaque: item.destaque === 1,
        ativo: item.ativo === 1
      }
    });
  } catch (error) {
    console.error('Erro ao ativar/desativar item:', error);
    res.status(500).json({ success: false, error: 'Erro ao ativar/desativar item' });
  }
});

// DELETE /api/ementa/:id - Deletar item
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await query('SELECT * FROM ementa WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }
    
    await query('DELETE FROM ementa WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar item:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar item' });
  }
});

export default router;

