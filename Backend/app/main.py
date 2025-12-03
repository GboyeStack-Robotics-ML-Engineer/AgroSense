from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers import sensors, alerts, ai_analysis, websocket
from .services.mqtt_listener import mqtt_listener
# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgroSense API",
    description="Smart farming IoT backend with AI-powered insights",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sensors.router, prefix="/api/sensors", tags=["Sensors"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(ai_analysis.router, prefix="/api/ai", tags=["AI Analysis"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])


@app.on_event("startup")
async def startup_event() -> None:
    mqtt_listener.start()

@app.get("/")
async def root():
    return {
        "message": "AgroSense API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
