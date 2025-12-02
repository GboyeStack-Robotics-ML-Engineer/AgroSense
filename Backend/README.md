# AgroSense Backend

FastAPI backend for the AgroSense smart farming application.

## Features

- 🌱 Real-time sensor data management (soil moisture, temperature, humidity, pH)
- 📊 WebSocket support for live data streaming
- 🤖 AI-powered plant health and security image analysis
- 📡 RESTful API endpoints
- 🔔 Alert management system

## Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment:**
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Gemini API key

5. **Run the server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
Backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API route handlers
│   └── services/            # Business logic
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables
```
