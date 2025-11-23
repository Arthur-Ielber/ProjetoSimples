-- =====================================================
-- Script para adicionar campos de foto
-- Execute este script no MySQL Workbench
-- Se der erro dizendo que a coluna já existe, ignore o erro
-- =====================================================

USE restaurante;

-- Adicionar foto_inicial (pode dar erro se já existir, ignore)
ALTER TABLE configuracoes 
ADD COLUMN foto_inicial MEDIUMBLOB NULL AFTER mapa_url;

-- Adicionar foto_historia (pode dar erro se já existir, ignore)
ALTER TABLE configuracoes 
ADD COLUMN foto_historia MEDIUMBLOB NULL AFTER foto_inicial;

-- Verificar estrutura
DESCRIBE configuracoes;

