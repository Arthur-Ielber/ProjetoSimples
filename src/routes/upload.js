import express from 'express';
import upload from '../middleware/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { query } from '../lib/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// POST /api/upload/ementa - Upload de imagem para ementa e salvar como BLOB
router.post('/ementa', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    // Ler o arquivo como buffer
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Salvar no banco como BLOB (temporário - será associado ao item da ementa)
    // Por enquanto, retornamos o buffer em base64 para o frontend
    // O frontend enviará isso junto com os dados do item
    
    // Deletar arquivo temporário (já temos o buffer)
    fs.unlinkSync(req.file.path);
    
    // Converter buffer para base64 para enviar ao frontend
    const base64Image = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    res.json({
      success: true,
      blob: base64Image, // Buffer em base64
      mimeType: mimeType,
      dataUrl: dataUrl, // Para preview
      size: fileBuffer.length
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    // Tentar deletar arquivo se ainda existir
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Erro ao deletar arquivo temporário:', e);
      }
    }
    res.status(500).json({ success: false, error: 'Erro ao fazer upload da imagem' });
  }
});

// GET /api/upload/ementa/:id - Obter imagem BLOB do banco
router.get('/ementa/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const items = await query('SELECT imagem_blob FROM ementa WHERE id = ?', [itemId]);
    
    if (items.length === 0 || !items[0].imagem_blob) {
      return res.status(404).json({ success: false, error: 'Imagem não encontrada' });
    }
    
    const imageBuffer = items[0].imagem_blob;
    
    // Tentar detectar o tipo MIME (assumir JPEG por padrão)
    // Em produção, você pode salvar o mimeType junto com o BLOB
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    res.send(imageBuffer);
  } catch (error) {
    console.error('Erro ao obter imagem:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter imagem' });
  }
});

export default router;

