# Quick start script for Windows
Write-Host "🌱 Setting up AgroSense Backend..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host "`n📦 Creating virtual environment..." -ForegroundColor Cyan
python -m venv AgroSense
    
# Activate virtual environment
Write-Host "🔌 Activating virtual environment..." -ForegroundColor Cyan
& .\AgroSense\Scripts\Activate.ps1

# Install dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nTo start the server, run:" -ForegroundColor Yellow
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White
Write-Host "`nAPI Documentation will be available at:" -ForegroundColor Yellow
Write-Host "  http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nTo access from other devices on the network, use your IP address:" -ForegroundColor Yellow
Write-Host "  http://<your-ip>:8000/docs" -ForegroundColor White
