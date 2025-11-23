-- =====================================================
-- Script SQL para MySQL Workbench
-- Sistema de Gestão de Restaurante
-- =====================================================
-- Execute este script no MySQL Workbench após criar o banco de dados
-- Comando: CREATE DATABASE restaurante; USE restaurante;

-- =====================================================
-- TABELA: configuracoes
-- Armazena as configurações gerais do restaurante
-- =====================================================
CREATE DATABASE IF NOT EXISTS restaurante;
USE restaurante;

CREATE TABLE IF NOT EXISTS configuracoes (
  id VARCHAR(36) PRIMARY KEY,
  telefone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  horario TEXT NOT NULL,
  historia TEXT NOT NULL,
  mapa_url TEXT,
  -- Campos para armazenar imagens como BLOB (até 16MB cada)
  foto_inicial MEDIUMBLOB NULL COMMENT 'Foto que aparece na página inicial (Hero Section)',
  foto_historia MEDIUMBLOB NULL COMMENT 'Foto que aparece na seção "Nossa História"',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados iniciais
INSERT INTO configuracoes (id, telefone, email, horario, historia, mapa_url)
VALUES (
  UUID(),
  '+351 21 123 4567',
  'contato@restaurante.pt',
  'Segunda a Sábado: 12:00 - 23:00 | Domingo: 12:00 - 22:00',
  'Desde 1985, o nosso restaurante tem servido a melhor gastronomia portuguesa com um toque contemporâneo. Combinamos tradição, qualidade e paixão em cada prato.',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3112.7269739394823!2d-9.142685!3d38.708163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDQyJzI5LjQiTiA5wrAwOCczMy43Ilc!5e0!3m2!1spt-PT!2spt!4v1234567890'
)
ON DUPLICATE KEY UPDATE id=id;

-- =====================================================
-- TABELA: menu_secoes
-- =====================================================
CREATE TABLE IF NOT EXISTS menu_secoes (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  ordem INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir seções padrão
INSERT INTO menu_secoes (id, nome, ordem) VALUES
('1', 'Entradas', 1),
('2', 'Pratos Principais', 2),
('3', 'Sobremesas', 3),
('4', 'Bebidas', 4)
ON DUPLICATE KEY UPDATE nome=nome;

-- =====================================================
-- TABELA: ementa
-- Armazena os itens do menu (pratos, bebidas, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS ementa (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL,
  secao VARCHAR(255) NOT NULL,
  destaque TINYINT(1) DEFAULT 0,
  ativo TINYINT(1) DEFAULT 1,
  -- Campo para URL de imagem (opcional, para imagens externas)
  imagem_url TEXT,
  -- Campo para armazenar imagem como BLOB (até 16MB)
  -- Prioridade: se imagem_blob existir, usa ele; senão, usa imagem_url
  imagem_blob MEDIUMBLOB NULL COMMENT 'Imagem do prato armazenada como BLOB (máximo 15MB)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_secao (secao),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir pratos padrão (com IDs fixos para evitar duplicação)
INSERT INTO ementa (id, nome, descricao, preco, secao, destaque, ativo, imagem_url) VALUES
('1', 'Bacalhau à Brás', 'Bacalhau desfiado com batata palha, cebola e ovos', 16.50, 'Pratos Principais', 1, 1, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop'),
('2', 'Polvo à Lagareiro', 'Polvo assado com batatas a murro e azeite', 22.00, 'Pratos Principais', 1, 1, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop'),
('3', 'Bife à Portuguesa', 'Bife grelhado com molho especial e batata frita', 18.50, 'Pratos Principais', 1, 1, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop'),
('4', 'Caldo Verde', 'Sopa tradicional portuguesa', 4.50, 'Entradas', 0, 1, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop'),
('5', 'Pastéis de Bacalhau', '4 unidades de pastéis crocantes', 6.00, 'Entradas', 0, 1, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'),
('6', 'Pastel de Nata', 'Pastel de nata tradicional', 1.20, 'Sobremesas', 0, 1, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop'),
('7', 'Mousse de Chocolate', 'Mousse cremosa de chocolate negro', 3.50, 'Sobremesas', 0, 1, 'https://images.unsplash.com/photo-1606312619070-d48d4eccf4c2?w=400&h=300&fit=crop')
ON DUPLICATE KEY UPDATE nome=nome;

-- =====================================================
-- TABELA: mesas
-- =====================================================
CREATE TABLE IF NOT EXISTS mesas (
  id VARCHAR(36) PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  capacidade INT NOT NULL,
  ativa TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ativa (ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir mesas padrão (com IDs fixos para evitar duplicação)
INSERT INTO mesas (id, numero, capacidade, ativa) VALUES
('1', '1', 4, 1),
('2', '2', 4, 1),
('3', '3', 2, 1),
('4', '4', 6, 1),
('5', '5', 4, 1),
('6', '6', 8, 1)
ON DUPLICATE KEY UPDATE numero=numero;

-- =====================================================
-- TABELA: reservas
-- =====================================================
CREATE TABLE IF NOT EXISTS reservas (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  apelido VARCHAR(255) NOT NULL,
  telefone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  data_reserva DATE NOT NULL,
  hora_reserva TIME NOT NULL,
  numero_pessoas INT NOT NULL,
  estado ENUM('pendente', 'aguardando_cliente', 'confirmado_cliente', 'cliente_na_mesa', 'cancelado', 'finalizado') DEFAULT 'pendente',
  mesa_id VARCHAR(36),
  token_confirmacao VARCHAR(255) UNIQUE,
  token_cancelamento VARCHAR(255) UNIQUE COMMENT 'Token único para cancelamento de reserva pelo cliente via email',
  confirmado_pelo_cliente TINYINT(1) DEFAULT 0 COMMENT 'Indica se o cliente confirmou a reserva através do link do email',
  resposta_cliente TEXT COMMENT 'Resposta do cliente à reserva',
  observacoes_restaurante TEXT COMMENT 'Observações internas do restaurante',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_estado (estado),
  INDEX idx_data_reserva (data_reserva),
  INDEX idx_mesa_id (mesa_id),
  INDEX idx_token (token_confirmacao),
  INDEX idx_token_cancelamento (token_cancelamento),
  INDEX idx_confirmado_cliente (confirmado_pelo_cliente),
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar constraint para número de pessoas (MySQL 8.0+)
-- Se der erro, comente esta linha (MySQL 5.7 não suporta CHECK)
ALTER TABLE reservas ADD CONSTRAINT chk_numero_pessoas CHECK (numero_pessoas > 0 AND numero_pessoas <= 20);

-- =====================================================
-- TABELA: reserva_observacoes
-- =====================================================
CREATE TABLE IF NOT EXISTS reserva_observacoes (
  id VARCHAR(36) PRIMARY KEY,
  reserva_id VARCHAR(36) NOT NULL,
  mensagem TEXT NOT NULL,
  autor ENUM('cliente', 'admin') NOT NULL,
  autor_nome VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
  INDEX idx_reserva_id (reserva_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pedidos
-- =====================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id VARCHAR(36) PRIMARY KEY,
  nome_cliente VARCHAR(255) NOT NULL,
  mesa_id VARCHAR(36),
  reserva_id VARCHAR(36) COMMENT 'ID da reserva associada (se aplicável)',
  subtotal DECIMAL(10, 2) DEFAULT 0.00,
  taxa DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) DEFAULT 0.00,
  forma_pagamento VARCHAR(100),
  observacoes TEXT,
  observacoes_finalizacao TEXT,
  status ENUM('aberta', 'pendente', 'finalizada', 'cancelada') DEFAULT 'aberta',
  data DATE NOT NULL,
  hora TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_mesa_id (mesa_id),
  INDEX idx_reserva_id (reserva_id),
  INDEX idx_data (data),
  FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE SET NULL,
  FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: pedido_itens
-- =====================================================
CREATE TABLE IF NOT EXISTS pedido_itens (
  id VARCHAR(36) PRIMARY KEY,
  pedido_id VARCHAR(36) NOT NULL,
  menu_item_id VARCHAR(36) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  INDEX idx_pedido_id (pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'atualizador') NOT NULL,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir usuário admin padrão (senha: Admin@123!)
-- NOTA: Em produção, a senha deve ser hash (bcrypt)
INSERT INTO usuarios (id, email, password, role, active)
VALUES (UUID(), 'admin@admin.com', 'Admin@123!', 'admin', 1)
ON DUPLICATE KEY UPDATE email=email;

-- =====================================================
-- NOTAS IMPORTANTES SOBRE ARMAZENAMENTO DE IMAGENS
-- =====================================================
-- 
-- 1. CAMPOS BLOB:
--    - foto_inicial (configuracoes): Foto da página inicial (Hero Section)
--    - foto_historia (configuracoes): Foto da seção "Nossa História"
--    - imagem_blob (ementa): Imagens dos pratos do menu
--
-- 2. TAMANHO MÁXIMO:
--    - MEDIUMBLOB suporta até 16MB por campo
--    - Limite recomendado: 15MB por imagem
--    - Formato aceito: JPG, PNG, GIF
--
-- 3. PRIORIDADE DE EXIBIÇÃO:
--    - Para ementa: Se imagem_blob existir, usa ele; senão, usa imagem_url
--    - Para configuracoes: Sempre usa BLOB se existir
--
-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- 
-- COMANDOS ÚTEIS PARA VERIFICAR:
-- 
-- Verificar se as tabelas foram criadas:
-- SHOW TABLES;
--
-- Ver estrutura de uma tabela:
-- DESCRIBE configuracoes;
-- DESCRIBE ementa;
--
-- Verificar se há imagens salvas:
-- SELECT 
--   id,
--   CASE WHEN foto_inicial IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_foto_inicial,
--   CASE WHEN foto_historia IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_foto_historia
-- FROM configuracoes;
--
-- SELECT 
--   id, nome,
--   CASE WHEN imagem_blob IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_imagem_blob
-- FROM ementa;
--
-- =====================================================
