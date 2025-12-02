# Start script for Windows
Write-Host "🚀 Starting AgroSense Backend Server..." -ForegroundColor Green

# Activate virtual environment if not already activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Activating virtual environment..." -ForegroundColor Cyan
    & .\AgroSense\Scripts\Activate.ps1
}

# Start the server
Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Yellow
Write-Host "API Documentation: http://localhost:8000/docs`n" -ForegroundColor Yellow

uvicorn app.main:app --reload --port 8000
