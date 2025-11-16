# Configuração do Arquivo .env

## Passo a passo

1. **Crie o arquivo `.env` na raiz do projeto** (mesmo nível do `package.json`)

2. **Adicione as seguintes variáveis**:

```env
# Configurações do Servidor
PORT=3001

# Configurações do Email (Gmail)
EMAIL_USER=arthur.ielber.projetos@gmail.com
EMAIL_PASS=lbkx jojd pmvk abre

# URL da API de Email (para o frontend)
VITE_EMAIL_API_URL=http://localhost:3001
```

3. **Salve o arquivo**

4. **Inicie os serviços**:
```bash
npm run dev
```

## Importante

- O arquivo `.env` está no `.gitignore` e **NÃO será commitado** no repositório
- Use o arquivo `.env.example` como referência
- **NUNCA** compartilhe o arquivo `.env` publicamente
- Se as variáveis não estiverem configuradas, o servidor não iniciará e mostrará um erro

