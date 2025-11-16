# Configuração de Envio de Emails

## Como usar o sistema de emails

### 1. Instalar dependências

Primeiro, instale as novas dependências do backend:

```bash
npm install
```

### 2. Iniciar os serviços

Todos os serviços (frontend e servidor de email) são iniciados automaticamente com:

```bash
npm run dev
```

Isso iniciará:
- **Frontend**: `http://localhost:8080` (Vite)
- **Servidor de Email**: `http://localhost:3001` (Express)

**Nota**: Se precisar rodar apenas um serviço:
- Frontend apenas: `npm run dev:frontend`
- Servidor apenas: `npm run server`

### 3. Configuração

As credenciais do Gmail devem estar configuradas no arquivo `.env`:

```env
EMAIL_USER=arthur.ielber.projetos@gmail.com
EMAIL_PASS=lbkx jojd pmvk abre
PORT=3001
VITE_EMAIL_API_URL=http://localhost:3001
```

**Importante**: 
- O arquivo `.env` já foi criado com as credenciais
- Este arquivo está no `.gitignore` e não será commitado
- Se precisar criar um novo `.env`, use o arquivo `.env.example` como template

### 4. Como funciona

O sistema envia emails automaticamente quando:

1. **Status da reserva é alterado** (Confirmado, Cancelado ou Finalizado)
   - O cliente recebe um email com o novo status
   - O email inclui todos os detalhes da reserva
   - O histórico completo de observações é incluído

2. **Uma observação é adicionada pelo admin**
   - O cliente recebe um email com a nova observação
   - O histórico completo de interação é incluído

### 5. Conteúdo do Email

O email enviado ao cliente contém:

- **Cabeçalho**: Nome do restaurante
- **Mensagem de status**: Confirmação, cancelamento ou finalização
- **Detalhes da reserva**:
  - Data formatada em português
  - Hora
  - Número de pessoas
- **Histórico de interação**: Todas as observações trocadas entre cliente e admin, com:
  - Autor (Cliente ou Admin)
  - Data e hora
  - Mensagem

### 6. Troubleshooting

Se os emails não estiverem sendo enviados:

1. Verifique se o servidor está rodando (`http://localhost:3001/api/health`)
2. Verifique o console do servidor para erros
3. Verifique se as credenciais do Gmail estão corretas
4. Certifique-se de que a senha de app do Gmail está ativa

### 7. Notas Importantes

- O email só é enviado quando o status muda para algo diferente de "Pendente"
- O email é enviado automaticamente quando uma observação é adicionada
- Se houver erro no envio, o status/observação ainda será salvo, mas um aviso será exibido

