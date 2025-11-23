import express from 'express';
import { query } from '../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/auth/login - Fazer login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
    }
    
    // Buscar usuário
    const users = await query(
      'SELECT * FROM usuarios WHERE email = ? AND password = ? AND active = 1',
      [email.toLowerCase().trim(), password]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Email ou senha incorretos' });
    }
    
    const user = users[0];
    
    // Não retornar a senha
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        ...userWithoutPassword,
        active: user.active === 1
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ success: false, error: 'Erro ao fazer login' });
  }
});

// GET /api/auth/me - Obter usuário atual (requer autenticação via token/session)
router.get('/me', async (req, res) => {
  try {
    // Por enquanto, retornar erro - implementar autenticação JWT depois
    res.status(401).json({ success: false, error: 'Autenticação não implementada' });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter usuário' });
  }
});

// GET /api/auth/usuarios - Obter todos os usuários (apenas admin)
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await query('SELECT id, email, role, active, created_at, updated_at FROM usuarios ORDER BY created_at DESC');
    const formatted = usuarios.map(user => ({
      ...user,
      active: user.active === 1
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Erro ao obter usuários:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter usuários' });
  }
});

// POST /api/auth/usuarios - Criar novo usuário (apenas admin)
router.post('/usuarios', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Email, senha e role são obrigatórios' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'A senha deve ter pelo menos 6 caracteres' });
    }
    
    if (!['admin', 'atualizador'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role inválido' });
    }
    
    // Verificar se email já existe
    const existing = await query('SELECT * FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Este email já está cadastrado' });
    }
    
    const id = uuidv4();
    await query(
      'INSERT INTO usuarios (id, email, password, role, active) VALUES (?, ?, ?, ?, 1)',
      [id, email.toLowerCase().trim(), password, role]
    );
    
    const newUser = await query('SELECT id, email, role, active, created_at, updated_at FROM usuarios WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Usuário criado com sucesso!',
      data: {
        ...newUser[0],
        active: newUser[0].active === 1
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
  }
});

// PATCH /api/auth/usuarios/:id/toggle - Ativar/Desativar usuário
router.patch('/usuarios/:id/toggle', async (req, res) => {
  try {
    const existing = await query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    
    const newActive = existing[0].active === 1 ? 0 : 1;
    await query('UPDATE usuarios SET active = ? WHERE id = ?', [newActive, req.params.id]);
    
    const updated = await query('SELECT id, email, role, active, created_at, updated_at FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      message: `Usuário ${newActive === 1 ? 'ativado' : 'desativado'} com sucesso!`,
      data: {
        ...updated[0],
        active: updated[0].active === 1
      }
    });
  } catch (error) {
    console.error('Erro ao ativar/desativar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao ativar/desativar usuário' });
  }
});

// DELETE /api/auth/usuarios/:id - Deletar usuário
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const existing = await query('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    
    await query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Usuário deletado com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar usuário' });
  }
});

export default router;

