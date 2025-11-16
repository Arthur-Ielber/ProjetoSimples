# Script para verificar se o servidor está rodando e respondendo

Write-Host "🔍 Verificando status do servidor..." -ForegroundColor Cyan
Write-Host ""

$healthUrl = "http://localhost:3001/api/health"

try {
    $response = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Servidor está rodando e respondendo!" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Resposta: $($response.Content)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Servidor respondeu com status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Servidor NÃO está respondendo!" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solução: Execute 'npm start' para reiniciar o servidor" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Verificando processos Node.js..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Processos Node.js encontrados: $($nodeProcesses.Count)" -ForegroundColor Yellow
    foreach ($proc in $nodeProcesses) {
        Write-Host "   - PID: $($proc.Id), Iniciado: $($proc.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "   Nenhum processo Node.js encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Verificando portas 8080 e 3001..." -ForegroundColor Cyan
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

if ($port8080) {
    Write-Host "   Porta 8080: Em uso (PID: $($port8080.OwningProcess))" -ForegroundColor Yellow
} else {
    Write-Host "   Porta 8080: Livre" -ForegroundColor Green
}

if ($port3001) {
    Write-Host "   Porta 3001: Em uso (PID: $($port3001.OwningProcess))" -ForegroundColor Yellow
} else {
    Write-Host "   Porta 3001: Livre" -ForegroundColor Green
}

