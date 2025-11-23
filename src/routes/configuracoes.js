import express from 'express';
import { query } from '../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/configuracoes - Obter configurações
router.get('/', async (req, res) => {
  try {
    // Não retornar BLOBs na listagem (muito pesado)
    const configs = await query(`
      SELECT id, telefone, email, horario, historia, mapa_url, created_at, updated_at,
             CASE WHEN foto_inicial IS NOT NULL THEN 1 ELSE 0 END as tem_foto_inicial,
             CASE WHEN foto_historia IS NOT NULL THEN 1 ELSE 0 END as tem_foto_historia
      FROM configuracoes 
      LIMIT 1
    `);
    
    if (configs.length === 0) {
      // Criar configuração padrão se não existir
      const id = uuidv4();
      await query(
        `INSERT INTO configuracoes (id, telefone, email, horario, historia, mapa_url) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          '+351 21 123 4567',
          'contato@restaurante.pt',
          'Segunda a Sábado: 12:00 - 23:00 | Domingo: 12:00 - 22:00',
          'Desde 1985, o nosso restaurante tem servido a melhor gastronomia portuguesa com um toque contemporâneo. Combinamos tradição, qualidade e paixão em cada prato.',
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.7269739394823!2d-9.142685!3d38.708163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDQyJzI5LjQiTiA5wrAwOCczMy43Ilc!5e0!3m2!1spt-PT!2spt!4v1234567890'
        ]
      );
      
      const newConfig = await query(`
        SELECT id, telefone, email, horario, historia, mapa_url, created_at, updated_at,
               CASE WHEN foto_inicial IS NOT NULL THEN 1 ELSE 0 END as tem_foto_inicial,
               CASE WHEN foto_historia IS NOT NULL THEN 1 ELSE 0 END as tem_foto_historia
        FROM configuracoes 
        WHERE id = ?
      `, [id]);
      const config = newConfig[0];
      if (config.tem_foto_inicial === 1) config.foto_inicial_url = '/api/configuracoes/foto-inicial';
      if (config.tem_foto_historia === 1) config.foto_historia_url = '/api/configuracoes/foto-historia';
      return res.json(config);
    }
    
    const config = configs[0];
    // Adicionar URLs para as fotos se existirem
    if (config.tem_foto_inicial === 1) {
      config.foto_inicial_url = '/api/configuracoes/foto-inicial';
    }
    if (config.tem_foto_historia === 1) {
      config.foto_historia_url = '/api/configuracoes/foto-historia';
    }
    
    res.json(config);
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter configurações' });
  }
});

// PUT /api/configuracoes - Atualizar configurações
router.put('/', async (req, res) => {
  try {
    const { telefone, email, horario, historia, mapa_url, foto_inicial, foto_historia } = req.body;
    
    // Verificar se existe configuração
    const configs = await query('SELECT * FROM configuracoes LIMIT 1');
    
    // Processar fotos se fornecidas
    let fotoInicialBuffer = null;
    let fotoHistoriaBuffer = null;
    
    if (foto_inicial !== undefined) {
      if (foto_inicial === null) {
        fotoInicialBuffer = null; // Remover foto
        console.log('[CONFIG] Removendo foto_inicial');
      } else if (typeof foto_inicial === 'string' && foto_inicial.length > 0) {
        try {
          const base64Data = foto_inicial.includes(',') 
            ? foto_inicial.split(',')[1] 
            : foto_inicial;
          fotoInicialBuffer = Buffer.from(base64Data, 'base64');
          console.log('[CONFIG] Foto inicial processada, tamanho:', fotoInicialBuffer.length, 'bytes');
        } catch (error) {
          console.error('Erro ao processar foto_inicial:', error);
          return res.status(400).json({ success: false, error: 'Erro ao processar foto inicial' });
        }
      }
    }
    
    if (foto_historia !== undefined) {
      if (foto_historia === null) {
        fotoHistoriaBuffer = null; // Remover foto
        console.log('[CONFIG] Removendo foto_historia');
      } else if (typeof foto_historia === 'string' && foto_historia.length > 0) {
        try {
          const base64Data = foto_historia.includes(',') 
            ? foto_historia.split(',')[1] 
            : foto_historia;
          fotoHistoriaBuffer = Buffer.from(base64Data, 'base64');
          console.log('[CONFIG] Foto história processada, tamanho:', fotoHistoriaBuffer.length, 'bytes');
        } catch (error) {
          console.error('Erro ao processar foto_historia:', error);
          return res.status(400).json({ success: false, error: 'Erro ao processar foto história' });
        }
      }
    }
    
    if (configs.length === 0) {
      // Criar se não existir
      const id = uuidv4();
      await query(
        `INSERT INTO configuracoes (id, telefone, email, horario, historia, mapa_url, foto_inicial, foto_historia) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, telefone, email, horario, historia, mapa_url || null, fotoInicialBuffer, fotoHistoriaBuffer]
      );
      
      const newConfig = await query(`
        SELECT id, telefone, email, horario, historia, mapa_url, created_at, updated_at,
               CASE WHEN foto_inicial IS NOT NULL THEN 1 ELSE 0 END as tem_foto_inicial,
               CASE WHEN foto_historia IS NOT NULL THEN 1 ELSE 0 END as tem_foto_historia
        FROM configuracoes 
        WHERE id = ?
      `, [id]);
      const config = newConfig[0];
      if (config.tem_foto_inicial === 1) config.foto_inicial_url = '/api/configuracoes/foto-inicial';
      if (config.tem_foto_historia === 1) config.foto_historia_url = '/api/configuracoes/foto-historia';
      return res.json({ success: true, data: config });
    }
    
    // Atualizar existente
    const updateFields = ['telefone = ?', 'email = ?', 'horario = ?', 'historia = ?', 'mapa_url = ?'];
    const updateValues = [telefone, email, horario, historia, mapa_url || null];
    
    if (foto_inicial !== undefined) {
      updateFields.push('foto_inicial = ?');
      updateValues.push(fotoInicialBuffer);
    }
    
    if (foto_historia !== undefined) {
      updateFields.push('foto_historia = ?');
      updateValues.push(fotoHistoriaBuffer);
    }
    
    updateValues.push(configs[0].id);
    
    await query(
      `UPDATE configuracoes 
       SET ${updateFields.join(', ')} 
       WHERE id = ?`,
      updateValues
    );
    
    console.log('[CONFIG] Configurações atualizadas com sucesso');
    
    const updated = await query(`
      SELECT id, telefone, email, horario, historia, mapa_url, created_at, updated_at,
             CASE WHEN foto_inicial IS NOT NULL THEN 1 ELSE 0 END as tem_foto_inicial,
             CASE WHEN foto_historia IS NOT NULL THEN 1 ELSE 0 END as tem_foto_historia
      FROM configuracoes 
      WHERE id = ?
    `, [configs[0].id]);
    
    const config = updated[0];
    console.log('[CONFIG] Verificação após update - tem_foto_inicial:', config.tem_foto_inicial, 'tem_foto_historia:', config.tem_foto_historia);
    
    if (config.tem_foto_inicial === 1) config.foto_inicial_url = '/api/configuracoes/foto-inicial';
    if (config.tem_foto_historia === 1) config.foto_historia_url = '/api/configuracoes/foto-historia';
    
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar configurações' });
  }
});

// GET /api/configuracoes/foto-inicial - Obter foto inicial
router.get('/foto-inicial', async (req, res) => {
  try {
    const configs = await query('SELECT foto_inicial FROM configuracoes LIMIT 1');
    
    if (configs.length === 0 || !configs[0].foto_inicial) {
      console.log('[CONFIG] Foto inicial não encontrada no banco');
      return res.status(404).json({ success: false, error: 'Foto inicial não encontrada' });
    }
    
    const imageBuffer = configs[0].foto_inicial;
    console.log('[CONFIG] Servindo foto inicial, tamanho:', imageBuffer.length, 'bytes');
    
    // Detectar tipo de imagem pelo buffer (primeiros bytes)
    let contentType = 'image/jpeg'; // padrão
    if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
      contentType = 'image/png';
    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) {
      contentType = 'image/gif';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.send(imageBuffer);
  } catch (error) {
    console.error('Erro ao obter foto inicial:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter foto inicial' });
  }
});

// GET /api/configuracoes/foto-historia - Obter foto história
router.get('/foto-historia', async (req, res) => {
  try {
    const configs = await query('SELECT foto_historia FROM configuracoes LIMIT 1');
    
    if (configs.length === 0 || !configs[0].foto_historia) {
      console.log('[CONFIG] Foto história não encontrada no banco');
      return res.status(404).json({ success: false, error: 'Foto história não encontrada' });
    }
    
    const imageBuffer = configs[0].foto_historia;
    console.log('[CONFIG] Servindo foto história, tamanho:', imageBuffer.length, 'bytes');
    
    // Detectar tipo de imagem pelo buffer (primeiros bytes)
    let contentType = 'image/jpeg'; // padrão
    if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
      contentType = 'image/png';
    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) {
      contentType = 'image/gif';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.send(imageBuffer);
  } catch (error) {
    console.error('Erro ao obter foto história:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter foto história' });
  }
});

export default router;

