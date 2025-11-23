# Como Funciona a Confirmação de Reserva pelo Cliente

## Fluxo Completo

### 1. Restaurante Confirma a Reserva
Quando o restaurante confirma uma reserva no dashboard:
- O sistema gera **dois tokens únicos**:
  - `token_confirmacao`: para o cliente confirmar
  - `token_cancelamento`: para o cliente cancelar
- Um email é enviado ao cliente com **dois botões**:
  - Botão verde "Confirmar Reserva" (usa `token_confirmacao`)
  - Botão vermelho "Desistir" (usa `token_cancelamento`)

### 2. Cliente Clica no Botão de Confirmação
Quando o cliente clica no botão "Confirmar Reserva" no email:
1. Ele é redirecionado para: `/confirmar-reserva/{token_confirmacao}`
2. A página `ConfirmarReserva.tsx` processa a confirmação:
   - Busca a reserva pelo `token_confirmacao`
   - Verifica se o token ainda é válido (não foi usado)
   - Atualiza o banco de dados:
     - Define `confirmado_pelo_cliente = 1`
     - Invalida ambos os tokens (coloca como `null`)
   - Adiciona uma observação automática: "Cliente confirmou a reserva através do link do email."

### 3. Exibição no Dashboard
Quando a reserva é confirmada pelo cliente, aparecem **duas indicações visuais**:

#### No Cabeçalho do Card:
- Um **badge verde** com ícone de check: "✓ Confirmada pelo cliente via email"

#### No Conteúdo do Card:
- Um **card destacado em verde** com:
  - Ícone de check
  - Texto: "Reserva confirmada pelo cliente"
  - Descrição: "O cliente confirmou a reserva através do link enviado por email"

## Verificação

Para verificar se está funcionando:

1. **No Console do Navegador** (F12):
   - Procure por logs como: `[RESERVAS TAB] Nome: estado=confirmado, confirmadoPeloCliente=true`
   - Isso mostra se o campo está sendo carregado corretamente

2. **No Banco de Dados**:
   ```sql
   SELECT id, nome, estado, confirmado_pelo_cliente, token_confirmacao, token_cancelamento 
   FROM reservas 
   WHERE estado = 'confirmado';
   ```
   - `confirmado_pelo_cliente` deve ser `1` se o cliente confirmou
   - `token_confirmacao` e `token_cancelamento` devem ser `NULL` após a confirmação

3. **Na Interface**:
   - Se a reserva foi confirmada pelo cliente, você verá:
     - Badge verde no cabeçalho
     - Card verde destacado no conteúdo

## Importante

- **Tokens são de uso único**: Após o cliente confirmar, os tokens são invalidados
- **Exclusividade mútua**: Se o cliente confirmar, não pode mais cancelar (e vice-versa)
- **Validação**: O sistema verifica se a reserva já foi confirmada/cancelada antes de permitir a ação oposta

## Troubleshooting

Se a mensagem não aparecer:

1. Verifique se `confirmado_pelo_cliente = 1` no banco de dados
2. Verifique os logs do console do navegador
3. Verifique se a reserva está com estado `'confirmado'`
4. Recarregue a página do dashboard (F5)

