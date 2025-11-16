# Scripts de Inicialização

## Como iniciar a aplicação

### Opção 1: Script PowerShell (Recomendado)
```bash
npm start
```
ou
```bash
powershell -ExecutionPolicy Bypass -File ./start.ps1
```

### Opção 2: Script Batch (Windows)
```bash
npm run start:bat
```
ou
```bash
start.bat
```

### Opção 3: Iniciar manualmente
```bash
npm run dev
```

## O que os scripts fazem

Os scripts `start.ps1` e `start.bat` fazem o seguinte:

1. **Parar processos nas portas 8080 e 3001**
   - Identifica processos que estão usando essas portas
   - Encerra esses processos automaticamente
   - Libera as portas para uso

2. **Aguardar 2 segundos**
   - Garante que as portas foram completamente liberadas

3. **Iniciar a aplicação**
   - Executa `npm run dev`
   - Inicia o frontend (porta 8080) e o servidor de email (porta 3001)

## Resolução de problemas

### Erro de permissão no PowerShell
Se receber um erro de política de execução, execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Portas ainda em uso
Se as portas ainda estiverem em uso após executar o script:
1. Feche manualmente os processos:
   ```powershell
   # Para porta 8080
   Get-NetTCPConnection -LocalPort 8080 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
   
   # Para porta 3001
   Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
   ```

2. Ou reinicie o computador

### Script não funciona
Use a opção manual:
```bash
npm run dev
```

