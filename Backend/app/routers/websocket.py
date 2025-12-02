from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio
from datetime import datetime

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                # Remove dead connections
                self.active_connections.remove(connection)


manager = ConnectionManager()


@router.websocket("/sensor-data")
async def websocket_sensor_data(websocket: WebSocket):
    """
    WebSocket endpoint for real-time sensor data streaming.
    Clients connect and receive live sensor updates.
    """
    await manager.connect(websocket)
    
    try:
        while True:
            # Keep connection alive and wait for messages
            data = await websocket.receive_text()
            
            # Echo back or handle client messages if needed
            await websocket.send_json({
                "type": "acknowledgment",
                "message": "Connected to sensor data stream",
                "timestamp": datetime.utcnow().isoformat()
            })
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected from sensor data stream")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def broadcast_sensor_reading(reading_data: dict):
    """
    Utility function to broadcast new sensor readings to all connected clients.
    Call this from your sensor data creation endpoint.
    """
    message = {
        "type": "sensor_reading",
        "data": reading_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(message)


async def broadcast_alert(alert_data: dict):
    """
    Utility function to broadcast new alerts to all connected clients.
    Call this when creating new alerts.
    """
    message = {
        "type": "alert",
        "data": alert_data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(message)
