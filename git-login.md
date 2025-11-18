# Como fazer login no GitHub

## Passo a passo para autenticar

### Opção 1: Usar GitHub CLI (Recomendado)

1. Instale o GitHub CLI se ainda não tiver:
   ```bash
   winget install GitHub.cli
   ```

2. Faça login:
   ```bash
   gh auth login
   ```
   - Escolha GitHub.com
   - Escolha HTTPS
   - Autentique no navegador

### Opção 2: Usar Personal Access Token

1. Crie um token no GitHub:
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Dê um nome (ex: "ProjetoSimples")
   - Selecione escopo: `repo` (todas as permissões)
   - Clique em "Generate token"
   - **Copie o token** (você só verá uma vez!)

2. Quando fizer push, use:
   - Username: `Arthur-Ielber`
   - Password: `[seu-token]`

### Opção 3: Limpar credenciais e fazer push

Execute estes comandos:

```bash
# Limpar credenciais do Windows
cmdkey /delete:git:https://github.com

# Tentar push novamente (vai pedir credenciais)
git push origin main
```

Quando pedir credenciais:
- Username: `Arthur-Ielber`
- Password: Seu token ou senha do GitHub

### Opção 4: Configurar SSH (Mais seguro)

1. Gere uma chave SSH:
   ```bash
   ssh-keygen -t ed25519 -C "arthurmiranda270@gmail.com"
   ```

2. Adicione a chave ao GitHub:
   - Copie o conteúdo de `~/.ssh/id_ed25519.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key

3. Mude a URL do remote:
   ```bash
   git remote set-url origin git@github.com:Arthur-Ielber/ProjetoSimples.git
   ```

4. Faça push:
   ```bash
   git push origin main
   ```

