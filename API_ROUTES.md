# API REST - Documentação de Rotas

Esta documentação lista todas as rotas da API REST criadas para substituir o localStorage.

**Base URL:** `http://localhost:3001/api`

---

## 📋 CONFIGURAÇÕES

### GET `/configuracoes`
Obter configurações do restaurante.

**Resposta:**
```json
{
  "id": "uuid",
  "telefone": "+351 21 123 4567",
  "email": "contato@restaurante.pt",
  "horario": "...",
  "historia": "...",
  "mapa_url": "...",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

### PUT `/configuracoes`
Atualizar configurações.

**Body:**
```json
{
  "telefone": "+351 21 123 4567",
  "email": "contato@restaurante.pt",
  "horario": "...",
  "historia": "...",
  "mapa_url": "..."
}
```

---

## 🍽️ EMENTA (MENU)

### GET `/ementa`
Obter todos os itens do menu.

### GET `/ementa/ativos`
Obter apenas itens ativos.

### GET `/ementa/destaque`
Obter itens em destaque.

### GET `/ementa/:id`
Obter item por ID.

### POST `/ementa`
Criar novo item.

**Body:**
```json
{
  "nome": "Bacalhau à Brás",
  "descricao": "Descrição do prato",
  "preco": 16.50,
  "secao": "Pratos Principais",
  "destaque": true,
  "ativo": true,
  "imagem_url": "https://..."
}
```

### PUT `/ementa/:id`
Atualizar item.

### PATCH `/ementa/:id/toggle-ativo`
Ativar/Desativar item.

### DELETE `/ementa/:id`
Deletar item.

---

## 📑 SEÇÕES DO MENU

### GET `/menu-secoes`
Obter todas as seções.

### POST `/menu-secoes`
Criar nova seção.

**Body:**
```json
{
  "nome": "Entradas"
}
```

### PUT `/menu-secoes/:id`
Atualizar seção.

### DELETE `/menu-secoes/:id`
Deletar seção.

---

## 📅 RESERVAS

### GET `/reservas`
Obter todas as reservas (com observações).

### GET `/reservas/:id`
Obter reserva por ID.

### POST `/reservas`
Criar nova reserva.

**Body:**
```json
{
  "nome": "João",
  "apelido": "Silva",
  "telefone": "+351 912 345 678",
  "email": "joao@example.com",
  "data_reserva": "2025-01-15",
  "hora_reserva": "20:00",
  "numero_pessoas": 4,
  "mesaId": "uuid",
  "observacoes": "Observação inicial (opcional)"
}
```

### PUT `/reservas/:id`
Atualizar reserva.

### POST `/reservas/:id/observacoes`
Adicionar observação à reserva.

**Body:**
```json
{
  "mensagem": "Mensagem da observação",
  "autor": "admin",
  "autor_nome": "Administrador"
}
```

### GET `/reservas/mesa/:mesaId/data/:data`
Obter reservas confirmadas para uma mesa em uma data.

### DELETE `/reservas/:id`
Deletar reserva.

---

## 🧾 PEDIDOS (COMANDAS)

### GET `/pedidos`
Obter pedidos do dia atual (ou filtrar por data com query `?data=2025-01-15`).

### GET `/pedidos/:id`
Obter pedido por ID.

### POST `/pedidos`
Criar novo pedido.

**Body:**
```json
{
  "nomeCliente": "João Silva",
  "mesaId": "uuid",
  "itens": [
    {
      "menuItemId": "uuid",
      "nome": "Bacalhau à Brás",
      "preco": 16.50,
      "quantidade": 2,
      "observacoes": "Sem cebola"
    }
  ],
  "observacoes": "Observações gerais"
}
```

### PUT `/pedidos/:id`
Atualizar pedido.

### PATCH `/pedidos/:id/marcar-pendente`
Marcar pedido como pendente.

**Body:**
```json
{
  "formaPagamento": "Cartão",
  "observacoesFinalizacao": "Observações"
}
```

### PATCH `/pedidos/:id/finalizar`
Finalizar pedido.

### PATCH `/pedidos/:id/reabrir`
Reabrir pedido pendente.

### POST `/pedidos/cancelar-comandas-antigas`
Cancelar comandas de reserva sem itens com mais de 30 minutos.

### DELETE `/pedidos/:id`
Deletar pedido (não permite deletar finalizados).

---

## 🪑 MESAS

### GET `/mesas`
Obter todas as mesas.

### GET `/mesas/ativas`
Obter apenas mesas ativas.

### GET `/mesas/:id`
Obter mesa por ID.

### GET `/mesas/:id/pedidos-ativos`
Obter pedidos ativos de uma mesa.

### POST `/mesas`
Criar nova mesa.

**Body:**
```json
{
  "numero": "5",
  "capacidade": 4,
  "ativa": true
}
```

### PUT `/mesas/:id`
Atualizar mesa.

### DELETE `/mesas/:id`
Deletar mesa (não permite se houver pedidos ou reservas).

---

## 🔐 AUTENTICAÇÃO

### POST `/auth/login`
Fazer login.

**Body:**
```json
{
  "email": "admin@admin.com",
  "password": "Admin@123!"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso!",
  "user": {
    "id": "uuid",
    "email": "admin@admin.com",
    "role": "admin",
    "active": true,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### GET `/auth/usuarios`
Obter todos os usuários.

### POST `/auth/usuarios`
Criar novo usuário.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123",
  "role": "atualizador"
}
```

### PATCH `/auth/usuarios/:id/toggle`
Ativar/Desativar usuário.

### DELETE `/auth/usuarios/:id`
Deletar usuário.

---

## 🔧 UTILITÁRIOS

### GET `/database/test`
Testar conexão com MySQL.

**Resposta:**
```json
{
  "success": true,
  "message": "Conexão com MySQL estabelecida com sucesso"
}
```

---

## 📝 Notas Importantes

1. **Todos os IDs são UUIDs** (VARCHAR(36))
2. **Booleanos no MySQL** são TINYINT(1) - convertidos para true/false na API
3. **Datas** são retornadas no formato ISO 8601
4. **Erros** retornam status HTTP apropriado com `{ success: false, error: "mensagem" }`
5. **Sucessos** retornam `{ success: true, data: {...} }` ou apenas os dados

## 🚀 Próximos Passos

Para usar a API no frontend, você precisará:

1. Criar um serviço/cliente HTTP (usando fetch ou axios)
2. Substituir todas as chamadas `localStorage.*` por chamadas à API
3. Implementar autenticação JWT (opcional, mas recomendado)
4. Adicionar tratamento de erros e loading states

