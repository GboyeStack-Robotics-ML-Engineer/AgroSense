from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import asyncio
from .config import settings
from .database import engine, Base
from .routers import sensors, alerts, ai_analysis, websocket
from .routers.websocket import check_sensor_timeouts
from .services.mqtt_listener import mqtt_listener
from .services.camScript import SmartCamera

# Create database tables
Base.metadata.create_all(bind=engine)

# Background task for checking sensor timeouts
sensor_check_task = None
camera=None

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
    #Appl
    global sensor_check_task
    global camera
    
    # Startup
    mqtt_listener.start()
    sensor_check_task = asyncio.create_task(sensor_timeout_checker())
    print("[STARTUP] Sensor timeout checker started")

    camera = SmartCamera()
    security_task = asyncio.create_task(camera.run_security_loop())
    
    yield
    
    # Shutdown
    if sensor_check_task:
        sensor_check_task.cancel()
        try:
            await sensor_check_task
        except asyncio.CancelledError:
            pass

    if security_task:
        security_task.cancel()
        try:
            await security_task
        except asyncio.CancelledError:
            pass

    if camera:
        camera.destroy()
    
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


@app.get("/video_feed")
async def video_feed():
        return StreamingResponse(camera.stream(), media_type="multipart/x-mixed-replace; boundary=frame")