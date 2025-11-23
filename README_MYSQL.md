# Configuração do MySQL

Este guia explica como conectar o projeto ao banco de dados MySQL local.

## Pré-requisitos

1. MySQL instalado e rodando localmente
2. Acesso ao MySQL (usuário e senha)

## Passo 1: Criar o Banco de Dados

Abra o MySQL Workbench ou terminal MySQL e execute:

```sql
CREATE DATABASE restaurante;
USE restaurante;
```

## Passo 2: Executar o Script SQL

Execute o script `database/schema.sql` no MySQL para criar todas as tabelas:

**Opção 1: Via MySQL Workbench**
1. Abra o MySQL Workbench
2. Conecte-se ao servidor MySQL
3. Abra o arquivo `database/schema.sql`
4. Execute o script (Ctrl+Shift+Enter ou botão Execute)

**Opção 2: Via Terminal**
```bash
mysql -u root -p restaurante < database/schema.sql
```

## Passo 3: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e configure as credenciais do MySQL:

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

2. Acesse no navegador ou faça uma requisição:
```
http://localhost:3001/api/database/test
```

Se a conexão estiver OK, você verá:
```json
{
  "success": true,
  "message": "Conexão com MySQL estabelecida com sucesso"
}
```

## Estrutura das Tabelas

O script SQL cria as seguintes tabelas:

- `configuracoes` - Configurações do restaurante
- `menu_secoes` - Seções do menu (Entradas, Pratos Principais, etc.)
- `ementa` - Itens do menu
- `mesas` - Mesas do restaurante
- `reservas` - Reservas de clientes
- `reserva_observacoes` - Observações das reservas
- `pedidos` - Comandas/pedidos
- `pedido_itens` - Itens de cada comanda
- `usuarios` - Usuários do sistema (admin e atualizadores)

## Próximos Passos

Após configurar o MySQL, você precisará:

1. Criar uma API REST no backend para substituir o localStorage
2. Atualizar o frontend para usar a API ao invés de localStorage
3. Migrar dados existentes do localStorage para o MySQL (se houver)

## Solução de Problemas

### Erro: "Access denied for user"
- Verifique se o usuário e senha estão corretos no `.env`
- Verifique se o usuário tem permissões para acessar o banco `restaurante`

### Erro: "Can't connect to MySQL server"
- Verifique se o MySQL está rodando
- Verifique se a porta está correta (padrão: 3306)
- Verifique se o host está correto (localhost)

### Erro: "Unknown database 'restaurante'"
- Execute o comando `CREATE DATABASE restaurante;` no MySQL
- Verifique se o nome do banco está correto no `.env`

