# Script de Diagnóstico DICOM - VetConnect
# Corre este script no PC da clínica (Windows) para testar a ligação ao RX
# Requer: PowerShell 5.1+ (nativo no Windows)
# Uso: Right-click -> "Run with PowerShell" ou abrir PowerShell e correr: .\dicom-diagnose.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VetConnect - Diagnostico DICOM RX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$RX_IP = Read-Host "IP do RX (default: 192.168.0.78)"
if ([string]::IsNullOrWhiteSpace($RX_IP)) { $RX_IP = "192.168.0.78" }

$PORTS = @(80, 443, 104, 11112, 4242, 8080, 8081)

Write-Host "`n[1] A testar conectividade TCP..." -ForegroundColor Yellow
Write-Host "    RX: $RX_IP`n"

foreach ($port in $PORTS) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $result = $client.BeginConnect($RX_IP, $port, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne(2000, $false)
        $client.Close()
        
        if ($success) {
            Write-Host "    Porta $port : ABERTA ✅" -ForegroundColor Green
        } else {
            Write-Host "    Porta $port : fechada/timeout ❌" -ForegroundColor Red
        }
    } catch {
        Write-Host "    Porta $port : erro ❌" -ForegroundColor Red
    }
}

Write-Host "`n[2] A testar ping..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName $RX_IP -Count 2 -Quiet
if ($pingResult) {
    Write-Host "    Ping: SUCESSO ✅" -ForegroundColor Green
} else {
    Write-Host "    Ping: FALHOU ❌" -ForegroundColor Red
}

Write-Host "`n[3] A descobrir AE Title na rede (mcast)..." -ForegroundColor Yellow
Write-Host "    (verificando ARP table)" -ForegroundColor Gray
$arp = arp -a | Select-String $RX_IP
if ($arp) {
    Write-Host "    MAC encontrado: $arp" -ForegroundColor Green
} else {
    Write-Host "    Nenhum registo ARP encontrado ❌" -ForegroundColor Red
}

Write-Host "`n[4] A verificar interfaces de rede deste PC..." -ForegroundColor Yellow
$adapters = Get-NetIPConfiguration | Where-Object { $_.NetAdapter.Status -eq "Up" }
foreach ($adapter in $adapters) {
    $ip = $adapter.IPv4Address.IPAddress
    $subnet = $adapter.IPv4Address.PrefixLength
    Write-Host "    Interface: $($adapter.InterfaceAlias)" -ForegroundColor Cyan
    Write-Host "    IP: $ip /$subnet" -ForegroundColor White
    if ($ip -match "192\.168\.0\.") {
        Write-Host "    => Esta interface esta na mesma rede do RX! ✅" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESULTADO:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Se a porta 104 ou 11112 estiver ABERTA, o RX aceita DICOM direto."
Write-Host "Se todas as portas estiverem fechadas, o X-AQS precisa de configuracao."
Write-Host ""
Write-Host "Proximo passo: Verifica o guia de configuracao X-AQS"
Write-Host "(scripts/dicom-config-guide.md)" -ForegroundColor Yellow
Write-Host ""

Read-Host "Pressiona ENTER para sair"
