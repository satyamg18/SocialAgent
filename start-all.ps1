# Start n8n + Next.js Dev Server together
# Usage: Right-click → Run with PowerShell, or: powershell -File start-all.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Social Media Agent - Starting Up..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
$dockerAvailable = $false
try {
    docker --version | Out-Null
    $dockerAvailable = $true
} catch {
    $dockerAvailable = $false
}

# Start n8n
if ($dockerAvailable) {
    Write-Host "[1/2] Starting n8n via Docker..." -ForegroundColor Yellow
    
    # Check if container already running
    $running = docker ps --filter "name=social-media-n8n" --format "{{.Names}}" 2>$null
    if ($running -eq "social-media-n8n") {
        Write-Host "  n8n is already running!" -ForegroundColor Green
    } else {
        # Remove stopped container if exists
        docker rm social-media-n8n 2>$null | Out-Null
        
        Push-Location "$PSScriptRoot\n8n"
        docker compose up -d
        Pop-Location
        
        Write-Host "  n8n starting at http://localhost:5678" -ForegroundColor Green
    }
} else {
    Write-Host "[1/2] Docker not found - starting n8n via npx..." -ForegroundColor Yellow
    Write-Host "  (Install Docker for persistent n8n data)" -ForegroundColor DarkGray
    
    # Start n8n in background via npx
    Start-Process -NoNewWindow powershell -ArgumentList "-Command", "npx -y n8n start" 
    Write-Host "  n8n starting at http://localhost:5678" -ForegroundColor Green
}

Write-Host ""

# Start Next.js
Write-Host "[2/2] Starting Next.js dev server..." -ForegroundColor Yellow
Write-Host "  App will be at http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  n8n UI:  http://localhost:5678" -ForegroundColor White
Write-Host "  App UI:  http://localhost:3000" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run Next.js (foreground — keeps terminal open)
npm run dev
