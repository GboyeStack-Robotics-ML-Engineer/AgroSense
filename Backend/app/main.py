from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from .config import settings
from .database import engine, Base
from .routers import sensors, alerts, ai_analysis, websocket
from .routers.websocket import check_sensor_timeouts
from .services.mqtt_listener import mqtt_listener

# Create database tables
Base.metadata.create_all(bind=engine)

# Background task for checking sensor timeouts
sensor_check_task = None

async def sensor_timeout_checker():
    """Background task to periodically check for sensor timeouts."""
    while True:
        try:
            await check_sensor_timeouts()
        except Exception as e:
            print(f"[SENSOR CHECK] Error: {e}")
        await asyncio.sleep(10)  # Check every 10 seconds


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global sensor_check_task
    
    # Startup
    mqtt_listener.start()
    sensor_check_task = asyncio.create_task(sensor_timeout_checker())
    print("[STARTUP] Sensor timeout checker started")
    
    yield
    
    # Shutdown
    if sensor_check_task:
        sensor_check_task.cancel()
        try:
            await sensor_check_task
        except asyncio.CancelledError:
            pass
    mqtt_listener.shutdown()
    print("[SHUTDOWN] Cleanup complete")


app = FastAPI(
    title="AgroSense API",
    description="Smart farming IoT backend with AI-powered insights",
    version="1.0.0",
    lifespan=lifespan
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
