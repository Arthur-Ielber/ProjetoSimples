# Script para parar processos nas portas e iniciar a aplicação

Write-Host "🛑 Parando processos Node.js e liberando portas..." -ForegroundColor Yellow

# Função para matar processo na porta
function Stop-ProcessOnPort {
    param([int]$Port)
    
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($processes) {
        foreach ($pid in $processes) {
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "   Parando processo $($process.ProcessName) (PID: $pid) na porta $Port..." -ForegroundColor Cyan
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Start-Sleep -Milliseconds 500
                }
            } catch {
                # Ignorar erros
            }
        }
        Write-Host "   ✓ Porta $Port liberada" -ForegroundColor Green
    } else {
        Write-Host "   ✓ Porta $Port já está livre" -ForegroundColor Green
    }
}

# Parar processos nas portas específicas
Stop-ProcessOnPort -Port 8080
Stop-ProcessOnPort -Port 3001

# Parar todos os processos Node.js relacionados ao projeto (opcional, mais agressivo)
Write-Host ""
Write-Host "🛑 Parando todos os processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        try {
            Write-Host "   Parando processo Node.js (PID: $($proc.Id))..." -ForegroundColor Cyan
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        } catch {
            # Ignorar erros
        }
    }
    Write-Host "   ✓ Processos Node.js parados" -ForegroundColor Green
} else {
    Write-Host "   ✓ Nenhum processo Node.js encontrado" -ForegroundColor Green
}

# Aguardar um pouco para garantir que as portas foram liberadas
Write-Host ""
Write-Host "⏳ Aguardando liberação das portas..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🔄 Executando reset do sistema..." -ForegroundColor Yellow
npm run reset

Write-Host ""
Write-Host "🧪 Testando conexões..." -ForegroundColor Yellow
npm run test:connections

Write-Host ""
Write-Host "🚀 Iniciando aplicação..." -ForegroundColor Green
Write-Host ""

# Iniciar a aplicação
npm run dev

