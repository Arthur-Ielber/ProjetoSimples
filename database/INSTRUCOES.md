# Instruções para Executar o Schema MySQL

## ⚠️ IMPORTANTE: Use o arquivo correto!

**NÃO execute o arquivo do Supabase** (`supabase/migrations/...`) no MySQL. 
Esse arquivo é para PostgreSQL e não funcionará no MySQL.

**Use APENAS o arquivo:** `database/schema.sql`

## Passo a Passo

### 1. Criar o banco de dados

No MySQL Workbench ou terminal MySQL, execute:

```sql
CREATE DATABASE restaurante;
USE restaurante;
```

### 2. Executar o schema.sql

**Opção A: Via MySQL Workbench**
1. Abra o MySQL Workbench
2. Conecte-se ao servidor MySQL
3. Selecione o banco `restaurante`
4. Abra o arquivo `database/schema.sql`
5. Execute o script (Ctrl+Shift+Enter ou botão Execute)

**Opção B: Via Terminal**
```bash
mysql -u root -p restaurante < database/schema.sql
```

### 3. Verificar se funcionou

Execute no MySQL:

```sql
USE restaurante;
SHOW TABLES;
```

Você deve ver as seguintes tabelas:
- configuracoes
- menu_secoes
- ementa
- mesas
- reservas
- reserva_observacoes
- pedidos
- pedido_itens
- usuarios

## Diferenças entre PostgreSQL e MySQL

O arquivo `supabase/migrations/...` usa sintaxe PostgreSQL:
- `UUID PRIMARY KEY DEFAULT gen_random_uuid()` ❌ (não funciona no MySQL)
- `TEXT` sem tamanho
- `BOOLEAN` como tipo nativo

O arquivo `database/schema.sql` usa sintaxe MySQL:
- `VARCHAR(36) PRIMARY KEY` com `UUID()` na aplicação ✅
- `TINYINT(1)` para booleanos ✅
- `INSERT IGNORE` para evitar duplicatas ✅

## Solução de Problemas

**Erro: "You have an error in your SQL syntax near 'UUID PRIMARY KEY DEFAULT gen_random_uuid()'"**
- Você está executando o arquivo errado!
- Use `database/schema.sql`, não o arquivo do Supabase

**Erro: "Unknown database 'restaurante'"**
- Execute primeiro: `CREATE DATABASE restaurante;`

**Erro: "Table already exists"**
- Use `DROP DATABASE restaurante;` e crie novamente, ou
- O script usa `CREATE TABLE IF NOT EXISTS` então é seguro executar novamente

