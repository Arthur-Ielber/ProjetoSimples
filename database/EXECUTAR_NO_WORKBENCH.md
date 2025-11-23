# Como Executar no MySQL Workbench

## Passo 1: Criar o Banco de Dados

1. Abra o MySQL Workbench
2. Conecte-se ao servidor MySQL
3. Execute os seguintes comandos:

```sql
CREATE DATABASE restaurante;
USE restaurante;
```

## Passo 2: Executar o Script

1. No MySQL Workbench, clique em **File** → **Open SQL Script**
2. Navegue até a pasta `database` do projeto
3. Selecione o arquivo **`schema.sql`**
4. O arquivo será aberto em uma nova aba
5. Clique no botão **Execute** (raio) ou pressione **Ctrl+Shift+Enter**

## Passo 3: Verificar se Funcionou

Execute este comando para ver todas as tabelas criadas:

```sql
SHOW TABLES;
```

Você deve ver:
- configuracoes
- menu_secoes
- ementa
- mesas
- reservas
- reserva_observacoes
- pedidos
- pedido_itens
- usuarios

## Verificar Dados Inseridos

```sql
-- Ver configurações
SELECT * FROM configuracoes;

-- Ver pratos do menu
SELECT * FROM ementa;

-- Ver mesas
SELECT * FROM mesas;

-- Ver usuário admin
SELECT * FROM usuarios;
```

## Se Der Erro no CHECK Constraint

Se você estiver usando MySQL 5.7 e der erro na linha do `CHECK`, simplesmente comente essa linha no script:

```sql
-- ALTER TABLE reservas ADD CONSTRAINT chk_numero_pessoas CHECK (numero_pessoas > 0 AND numero_pessoas <= 20);
```

O MySQL 8.0+ suporta CHECK constraints, mas o MySQL 5.7 não.

## Pronto! ✅

Agora você pode configurar o arquivo `.env` com as credenciais do MySQL e testar a conexão!

