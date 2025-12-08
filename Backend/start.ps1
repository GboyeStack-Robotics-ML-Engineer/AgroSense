# Start script for Windows
Write-Host "🚀 Starting AgroSense Backend Server..." -ForegroundColor Green

# Activate virtual environment if not already activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Activating virtual environment..." -ForegroundColor Cyan
    & .\AgroSense\Scripts\Activate.ps1
}

# Start the server (listening on all interfaces for network access)
Write-Host "Starting FastAPI server on http://0.0.0.0:8000" -ForegroundColor Yellow
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "Access from other devices: http://<your-ip>:8000`n" -ForegroundColor Yellow

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
