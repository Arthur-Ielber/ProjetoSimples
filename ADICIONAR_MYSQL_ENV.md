# ⚠️ Configurar MySQL no arquivo .env

O arquivo `.env` existe, mas precisa das configurações do MySQL.

## Adicione estas linhas no seu arquivo `.env`:

```env
# Configurações do MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_MYSQL_AQUI
DB_NAME=restaurante
```

**Importante:** Substitua `SUA_SENHA_MYSQL_AQUI` pela sua senha real do MySQL.

## Exemplo completo do .env:

```env
# Configurações do Servidor
PORT=3001

# Configurações do Email (Gmail)
EMAIL_USER=arthur.ielber.projetos@gmail.com
EMAIL_PASS=lbkx jojd pmvk abre

# URL da API de Email (para o frontend)
VITE_EMAIL_API_URL=http://localhost:3001

# Configurações do MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=restaurante
```

## Depois de adicionar, teste novamente:

```bash
node test-db-connection.js
```

