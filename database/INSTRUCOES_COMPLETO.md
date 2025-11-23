# Instruções para Criar o Banco de Dados Completo

## Passo 1: Dropar e Recriar o Banco

1. Abra o MySQL Workbench
2. Execute:
```sql
DROP DATABASE IF EXISTS restaurante;
CREATE DATABASE restaurante;
USE restaurante;
```

## Passo 2: Executar o Schema Completo

1. Abra o arquivo `database/schema.sql`
2. Execute todo o script (Ctrl+Shift+Enter ou botão Execute)

O script irá criar todas as tabelas com:
- ✅ Campo `imagem_blob MEDIUMBLOB` na tabela `ementa` (para imagens dos pratos)
- ✅ Campos `foto_inicial MEDIUMBLOB` e `foto_historia MEDIUMBLOB` na tabela `configuracoes`
- ✅ Todas as outras tabelas (mesas, reservas, pedidos, usuarios, etc.)

## Passo 3: Verificar

Execute para verificar se tudo foi criado:

```sql
SHOW TABLES;
DESCRIBE configuracoes;
DESCRIBE ementa;
```

## Estrutura das Tabelas

### configuracoes
- `foto_inicial MEDIUMBLOB` - Foto inicial do site (máx 16MB)
- `foto_historia MEDIUMBLOB` - Foto da seção história (máx 16MB)

### ementa
- `imagem_blob MEDIUMBLOB` - Imagem do prato salva no banco (máx 16MB)
- `imagem_url TEXT` - URL alternativa (para compatibilidade)

## Limites de Upload

- **Máximo por imagem**: 15MB
- **Tipo de arquivo**: JPG, PNG, GIF, WEBP
- **Armazenamento**: MEDIUMBLOB no MySQL (suporta até 16MB)

## Notas

⚠️ **Importante**: 
- As imagens são salvas como BLOB no banco de dados
- Isso aumenta o tamanho do banco, mas facilita backups
- Para produção com muitas imagens, considere usar storage externo (S3, Cloudinary)

