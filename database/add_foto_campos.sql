-- =====================================================
-- Script para adicionar campos de foto na tabela configuracoes
-- Execute este script se os campos não existirem
-- =====================================================

USE restaurante;

-- Verificar e adicionar foto_inicial se não existir
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'restaurante' 
    AND TABLE_NAME = 'configuracoes' 
    AND COLUMN_NAME = 'foto_inicial'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE configuracoes ADD COLUMN foto_inicial MEDIUMBLOB NULL AFTER mapa_url',
  'SELECT "Campo foto_inicial já existe" AS mensagem'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar foto_historia se não existir
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'restaurante' 
    AND TABLE_NAME = 'configuracoes' 
    AND COLUMN_NAME = 'foto_historia'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE configuracoes ADD COLUMN foto_historia MEDIUMBLOB NULL AFTER foto_inicial',
  'SELECT "Campo foto_historia já existe" AS mensagem'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar estrutura final
DESCRIBE configuracoes;

