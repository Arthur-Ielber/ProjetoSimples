# Como Configurar a Conexão com MySQL

## Passo 1: Criar o Banco de Dados

No MySQL Workbench ou terminal MySQL, execute:

```sql
CREATE DATABASE restaurante;
USE restaurante;
```

## Passo 2: Executar o Script SQL

Execute o arquivo `database/schema.sql` no MySQL para criar todas as tabelas.

**No MySQL Workbench:**
1. Abra o arquivo `database/schema.sql`
2. Execute o script (Ctrl+Shift+Enter)

**No Terminal:**
```bash
mysql -u root -p restaurante < database/schema.sql
```

## Passo 3: Configurar o Arquivo .env

1. Se ainda não tiver um arquivo `.env`, copie o `.env.example`:
```bash
cp .env.example .env
```

2. Adicione as configurações do MySQL no arquivo `.env`:

```env
# Configurações do MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=restaurante
```

**Importante:** Substitua `sua_senha_mysql` pela sua senha real do MySQL.

## Passo 4: Testar a Conexão

1. Inicie o servidor:
```bash
npm run dev
```

2. Verifique no console se apareceu a mensagem:
```
[DATABASE] Conexão com MySQL estabelecida com sucesso
```

3. Ou teste via navegador/Postman:
```
GET http://localhost:3001/api/database/test
```

## Pronto! ✅

Agora o sistema está conectado ao MySQL. As tabelas foram criadas e você pode começar a usar o banco de dados.

## Próximos Passos

O sistema ainda está usando `localStorage` para armazenar dados. Para migrar completamente para MySQL, será necessário:

1. Criar endpoints da API REST no backend
2. Atualizar o frontend para usar a API ao invés de localStorage
3. Migrar dados existentes (se houver)

## Solução de Problemas

**Erro: "Access denied for user"**
- Verifique usuário e senha no `.env`
- Verifique se o usuário tem permissões no banco `restaurante`

**Erro: "Can't connect to MySQL server"**
- Verifique se o MySQL está rodando
- Verifique a porta (padrão: 3306)
- Verifique o host (localhost)

**Erro: "Unknown database 'restaurante'"**
- Execute `CREATE DATABASE restaurante;` no MySQL
- Verifique o nome do banco no `.env`

