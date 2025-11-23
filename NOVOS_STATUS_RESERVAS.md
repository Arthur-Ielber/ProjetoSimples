# Novos Status de Reservas

## Status Implementados

O sistema agora possui **5 status** para as reservas:

1. **`pendente`** - Reserva criada, aguardando confirmação do restaurante
2. **`aguardando_cliente`** - Restaurante confirmou, aguardando confirmação do cliente via email
3. **`confirmado_cliente`** - Cliente confirmou a reserva através do link do email
4. **`cancelado`** - Reserva cancelada
5. **`finalizado`** - Reserva finalizada

## Fluxo de Confirmação

### 1. Criação da Reserva
- Status inicial: `pendente`
- Cliente cria a reserva através do formulário

### 2. Confirmação pelo Restaurante
- Quando o restaurante confirma a reserva no dashboard:
  - Status muda de `pendente` → `aguardando_cliente`
  - Sistema gera dois tokens únicos:
    - `token_confirmacao`: para o cliente confirmar
    - `token_cancelamento`: para o cliente cancelar
  - Email é enviado ao cliente com dois botões

### 3. Confirmação pelo Cliente
- Quando o cliente clica no botão "Confirmar Reserva" no email:
  - Status muda de `aguardando_cliente` → `confirmado_cliente`
  - Ambos os tokens são invalidados (uso único)
  - Campo `confirmado_pelo_cliente` é definido como `1`
  - Observação automática é adicionada

### 4. Cancelamento pelo Cliente
- Quando o cliente clica no botão "Desistir" no email:
  - Status muda para `cancelado`
  - Ambos os tokens são invalidados
  - Observação automática é adicionada

## Exibição no Dashboard

### Badges de Status
- **Pendente**: Badge secundário (cinza)
- **Aguardando Cliente**: Badge padrão (laranja)
- **Confirmado pelo Cliente**: Badge padrão (verde) + indicador visual
- **Cancelado**: Badge destrutivo (vermelho)
- **Finalizado**: Badge outline (cinza)

### Indicadores Visuais
Quando a reserva está com status `confirmado_cliente`:
- Badge verde no cabeçalho: "✓ Confirmada pelo cliente via email"
- Card destacado em verde no conteúdo com mensagem explicativa

## Filtros Disponíveis

No dashboard, os filtros são:
- Pendente
- Aguardando Cliente
- Confirmado pelo Cliente
- Cancelado
- Finalizado
- Todas

## Validações Implementadas

1. **Tokens de uso único**: Cada token só pode ser usado uma vez
2. **Exclusividade mútua**: 
   - Se confirmar, não pode cancelar
   - Se cancelar, não pode confirmar
3. **Status obrigatório**: Todas as reservas devem ter um status válido

## Banco de Dados

O ENUM foi atualizado no `schema.sql`:
```sql
estado ENUM('pendente', 'aguardando_cliente', 'confirmado_cliente', 'cancelado', 'finalizado') DEFAULT 'pendente'
```

## Arquivos Atualizados

- `database/schema.sql` - ENUM atualizado
- `src/components/dashboard/ReservasTab.tsx` - Interface e lógica
- `src/pages/ConfirmarReserva.tsx` - Lógica de confirmação do cliente
- `src/pages/CancelarReserva.tsx` - Lógica de cancelamento
- `src/routes/reservas.js` - API atualizada
- `src/lib/emailService.ts` - Tipos atualizados
- `src/lib/localStorage.ts` - Tipos atualizados
- `src/components/dashboard/GestaoTab.tsx` - Referências atualizadas

