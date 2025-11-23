-- =====================================================
-- Script para adicionar campo BLOB para imagens na tabela ementa
-- =====================================================
-- Execute este script no MySQL Workbench após criar as tabelas

USE restaurante;

-- Verificar se a coluna já existe antes de adicionar
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'restaurante' 
  AND TABLE_NAME = 'ementa' 
  AND COLUMN_NAME = 'imagem_blob';

-- Adicionar coluna imagem_blob (MEDIUMBLOB) para armazenar imagens diretamente no banco
-- MEDIUMBLOB suporta até 16MB, suficiente para a maioria das imagens
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE ementa ADD COLUMN imagem_blob MEDIUMBLOB NULL AFTER imagem_url',
  'SELECT "Coluna imagem_blob já existe" AS mensagem'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar se a coluna foi adicionada
DESCRIBE ementa;

-- =====================================================
-- NOTA: 
-- - MEDIUMBLOB pode armazenar até 16MB de dados (suficiente para imagens)
-- - LONGBLOB pode armazenar até 4GB, mas é desnecessário para imagens
-- - BLOB (64KB) é muito pequeno para imagens modernas
-- =====================================================

