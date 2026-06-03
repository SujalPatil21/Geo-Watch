# Automated Benchmark Driver for GeoWatch Phase 7
$K6Path = "C:\Program Files\k6\k6.exe"
$PsqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$DbConnString = "-h localhost -p 5433 -U postgres -d crowd_safety"
$ResultsDir = "c:\Github\Geo-Watch\benchmark\results"

# Ensure results directory exists
if (!(Test-Path -Path $ResultsDir)) {
    New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null
}

function Reset-Database {
    Write-Host "Resetting database..."
    $env:PGPASSWORD='postgre'
    & $PsqlPath -h localhost -p 5433 -U postgres -d crowd_safety -f "c:\Github\Geo-Watch\benchmark\setup_db.sql" | Out-Null
}

function Run-K6-Test {
    param (
        [string]$ScriptName,
        [string]$TestType,
        [int]$Vus,
        [string]$RampUp,
        [string]$Duration,
        [int]$TotalDurationSec
    )
    
    $RunName = "${TestType}_vu${Vus}"
    Write-Host "`n=================== STARTING TEST: $RunName ($TotalDurationSec sec) ==================="

    # 1. Reset Database
    Reset-Database

    # 2. Capture Pre-Snapshot
    & powershell -File "c:\Github\Geo-Watch\benchmark\monitor.ps1" -Action start -RunName $RunName

    # 3. Start Background Metric Sampling
    $SampleJob = Start-Job -ScriptBlock {
        param($name, $duration)
        & powershell -File "c:\Github\Geo-Watch\benchmark\monitor.ps1" -Action sample -RunName $name -DurationSec $duration -IntervalSec 2
    } -ArgumentList $RunName, $TotalDurationSec

    # 4. Run k6 Load Test
    Write-Host "Running k6 for $RunName..."
    & $K6Path run --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" -e VUS=$Vus -e RAMP_UP=$RampUp -e DURATION=$Duration "c:\Github\Geo-Watch\benchmark\$ScriptName" > "$ResultsDir\${RunName}_k6_output.txt" 2>&1

    # 5. Wait for Background Sampling to finish
    Write-Host "Waiting for background monitor job to complete..."
    Wait-Job $SampleJob | Out-Null
    Receive-Job $SampleJob | Out-Null
    Remove-Job $SampleJob

    # 6. Capture Post-Snapshot
    & powershell -File "c:\Github\Geo-Watch\benchmark\monitor.ps1" -Action stop -RunName $RunName
    Write-Host "Completed test: $RunName"
    
    # Rest database connection pool and let JVM settle
    Start-Sleep -Seconds 5
}

# --- 1. REST API Load Testing (POST, GET nearby, GET clusters) ---
$RestConfigs = @(
    @{ Vus = 10;   Ramp = "15s"; Hold = "45s";  Total = 60 },
    @{ Vus = 25;   Ramp = "15s"; Hold = "45s";  Total = 60 },
    @{ Vus = 50;   Ramp = "30s"; Hold = "90s";  Total = 120 },
    @{ Vus = 100;  Ramp = "30s"; Hold = "90s";  Total = 120 },
    @{ Vus = 250;  Ramp = "60s"; Hold = "120s"; Total = 180 },
    @{ Vus = 500;  Ramp = "60s"; Hold = "120s"; Total = 180 },
    @{ Vus = 750;  Ramp = "60s"; Hold = "120s"; Total = 180 },
    @{ Vus = 1000; Ramp = "90s"; Hold = "210s"; Total = 300 }
)

foreach ($c in $RestConfigs) {
    Run-K6-Test -ScriptName "api_benchmark.js" -TestType "rest_api" -Vus $c.Vus -RampUp $c.Ramp -Duration $c.Hold -TotalDurationSec $c.Total
}

# --- 2. Dedicated Incident Ingestion Stress Test ---
foreach ($c in $RestConfigs) {
    Run-K6-Test -ScriptName "ingestion_stress_test.js" -TestType "ingestion_stress" -Vus $c.Vus -RampUp $c.Ramp -Duration $c.Hold -TotalDurationSec $c.Total
}

# --- 3. WebSocket Capacity Test ---
Write-Host "`n=================== STARTING WEBSOCKET CAPACITY BENCHMARKS ==================="
Reset-Database
& powershell -File "c:\Github\Geo-Watch\benchmark\monitor.ps1" -Action start -RunName "websocket_capacity"
node "c:\Github\Geo-Watch\benchmark\websocket_benchmark.js" > "$ResultsDir\websocket_capacity_output.txt" 2>&1
& powershell -File "c:\Github\Geo-Watch\benchmark\monitor.ps1" -Action stop -RunName "websocket_capacity"

# --- 4. End-to-End Mix Scenario (100 VUs) ---
Run-K6-Test -ScriptName "e2e_benchmark.js" -TestType "e2e_mix" -Vus 100 -RampUp "30s" -Duration "90s" -TotalDurationSec 120

Write-Host "`n=================== ALL BENCHMARKS COMPLETED SUCCESSFULLY ==================="
