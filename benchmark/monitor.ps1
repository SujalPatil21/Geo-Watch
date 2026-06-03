param (
    [string]$Action = "sample", # start, stop, sample
    [string]$RunName = "benchmark_run",
    [int]$IntervalSec = 2,
    [int]$DurationSec = 60
)

# Ensure results directory exists
$ResultsDir = "c:\Github\Geo-Watch\benchmark\results"
if (!(Test-Path -Path $ResultsDir)) {
    New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null
}

function Get-ActuatorMetric {
    param (
        [string]$Name,
        [string]$Tag = $null,
        [string]$Statistic = $null
    )
    $url = "http://localhost:8082/actuator/metrics/$Name"
    if ($Tag) {
        $url += "?tag=$Tag"
    }
    try {
        $resp = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($resp -and $resp.measurements) {
            if ($Statistic) {
                $m = $resp.measurements | Where-Object { $_.statistic -eq $Statistic }
                if ($m) {
                    return $m.value
                }
            }
            return $resp.measurements[0].value
        }
    } catch {}
    return $null
}

function Get-TelemetryMetrics {
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:8082/api/admin/metrics" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $resp
    } catch {
        return $null
    }
}

function Get-ResourceSnapshot {
    $cpu = Get-ActuatorMetric "system.cpu.usage"
    if ($cpu -ne $null) { $cpu = [math]::Round($cpu * 100, 2) } else { $cpu = "N/A" }

    $heapUsedBytes = Get-ActuatorMetric "jvm.memory.used" "area:heap"
    $heapUsed = "N/A"
    if ($heapUsedBytes -ne $null) { $heapUsed = [math]::Round($heapUsedBytes / 1024 / 1024, 2) }

    $nonHeapUsedBytes = Get-ActuatorMetric "jvm.memory.used" "area:nonheap"
    $nonHeapUsed = "N/A"
    if ($nonHeapUsedBytes -ne $null) { $nonHeapUsed = [math]::Round($nonHeapUsedBytes / 1024 / 1024, 2) }

    $gcPause = Get-ActuatorMetric "jvm.gc.pause" $null "MAX"
    if ($gcPause -eq $null) { $gcPause = 0.0 }

    $tomcatActive = Get-ActuatorMetric "tomcat.threads.current"
    if ($tomcatActive -eq $null) { $tomcatActive = 0 }
    
    $tomcatBusy = Get-ActuatorMetric "tomcat.threads.busy"
    if ($tomcatBusy -eq $null) { $tomcatBusy = 0 }

    $hikariActive = Get-ActuatorMetric "hikaricp.connections.active"
    if ($hikariActive -eq $null) { $hikariActive = 0 }

    $hikariIdle = Get-ActuatorMetric "hikaricp.connections.idle"
    if ($hikariIdle -eq $null) { $hikariIdle = 0 }

    $hikariPending = Get-ActuatorMetric "hikaricp.connections.pending"
    if ($hikariPending -eq $null) { $hikariPending = 0 }

    $hikariTotal = Get-ActuatorMetric "hikaricp.connections.acquire" $null "TOTAL_TIME"
    $hikariCount = Get-ActuatorMetric "hikaricp.connections.acquire" $null "COUNT"
    $hikariAcquire = 0.0
    if ($hikariCount -gt 0 -and $hikariTotal -ne $null) {
        $hikariAcquire = [math]::Round(($hikariTotal / $hikariCount) * 1000, 2)
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    return [PSCustomObject]@{
        Timestamp = $timestamp
        CPU_Pct = $cpu
        HeapUsed_MB = $heapUsed
        NonHeapUsed_MB = $nonHeapUsed
        GCPause_Sec = $gcPause
        TomcatActiveThreads = $tomcatActive
        TomcatBusyThreads = $tomcatBusy
        HikariActive = $hikariActive
        HikariIdle = $hikariIdle
        HikariPending = $hikariPending
        HikariAcquireLatency_ms = $hikariAcquire
    }
}

if ($Action -eq "start") {
    # Capture before telemetry
    Write-Host "Capturing pre-benchmark metrics for $RunName..."
    $telemetry = Get-TelemetryMetrics
    if ($telemetry) {
        $telemetry | ConvertTo-Json -Depth 10 | Out-File "$ResultsDir\${RunName}_telemetry_before.json"
    }
    $resources = Get-ResourceSnapshot
    $resources | ConvertTo-Json | Out-File "$ResultsDir\${RunName}_resources_before.json"
    Write-Host "Pre-benchmark metrics captured."
}
elseif ($Action -eq "stop") {
    # Capture after telemetry
    Write-Host "Capturing post-benchmark metrics for $RunName..."
    $telemetry = Get-TelemetryMetrics
    if ($telemetry) {
        $telemetry | ConvertTo-Json -Depth 10 | Out-File "$ResultsDir\${RunName}_telemetry_after.json"
    }
    $resources = Get-ResourceSnapshot
    $resources | ConvertTo-Json | Out-File "$ResultsDir\${RunName}_resources_after.json"
    Write-Host "Post-benchmark metrics captured."
}
elseif ($Action -eq "sample") {
    # Sample periodically in the background
    Write-Host "Starting periodic metric sampling for $RunName for $DurationSec seconds..."
    $samples = New-Object System.Collections.Generic.List[PSCustomObject]
    $elapsed = 0
    while ($elapsed -lt $DurationSec) {
        $snapshot = Get-ResourceSnapshot
        $samples.Add($snapshot)
        
        # Log to console in single line format
        Write-Host "SAMPLE: CPU=$($snapshot.CPU_Pct)% Heap=$($snapshot.HeapUsed_MB)MB TomcatActive=$($snapshot.TomcatActiveThreads) TomcatBusy=$($snapshot.TomcatBusyThreads) HikariActive=$($snapshot.HikariActive) HikariPending=$($snapshot.HikariPending)"
        
        Start-Sleep -Seconds $IntervalSec
        $elapsed += $IntervalSec
    }
    $samples | ConvertTo-Json | Out-File "$ResultsDir\${RunName}_samples.json"
    Write-Host "Metric sampling completed."
}
