from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import asyncio
from datetime import datetime, timedelta

router = APIRouter()

# Track sensor connection status
# Key: sensor_id, Value: last_seen timestamp
sensor_last_seen: Dict[int, datetime] = {}
sensor_status: Dict[int, bool] = {}  # True = online, False = offline

SENSOR_TIMEOUT_SECONDS = 30  # Mark sensor offline if no data for 30 seconds


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                dead_connections.append(connection)
        
        # Clean up dead connections
        for conn in dead_connections:
            if conn in self.active_connections:
                self.active_connections.remove(conn)


manager = ConnectionManager()


@router.websocket("/sensor-data")
async def websocket_sensor_data(websocket: WebSocket):
    """
    WebSocket endpoint for real-time sensor data streaming.
    Clients connect and receive live sensor updates.
    """
    await manager.connect(websocket)
    
    # Send current sensor status to newly connected client
    try:
        await websocket.send_json({
            "type": "sensor_status_init",
            "data": {
                sensor_id: {
                    "online": status,
                    "lastSeen": sensor_last_seen.get(sensor_id, datetime.utcnow()).isoformat()
                }
                for sensor_id, status in sensor_status.items()
            },
            "timestamp": datetime.utcnow().isoformat()
        })
    except:
        pass
    
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


def update_sensor_status(sensor_id: int) -> bool:
    """
    Update the last seen timestamp for a sensor and mark it online.
    Returns True if sensor status changed from offline to online.
    """
    global sensor_last_seen, sensor_status
    
    was_offline = sensor_status.get(sensor_id, None) == False
    sensor_last_seen[sensor_id] = datetime.utcnow()
    sensor_status[sensor_id] = True
    
    return was_offline or sensor_id not in sensor_status


async def check_sensor_timeouts():
    """
    Check all sensors and mark any that haven't sent data recently as offline.
    Should be called periodically.
    """
    global sensor_status
    
    now = datetime.utcnow()
    timeout_threshold = timedelta(seconds=SENSOR_TIMEOUT_SECONDS)
    
    sensors_went_offline = []
    
    for sensor_id, last_seen in sensor_last_seen.items():
        if now - last_seen > timeout_threshold:
            if sensor_status.get(sensor_id, True):  # Was online
                sensor_status[sensor_id] = False
                sensors_went_offline.append(sensor_id)
                print(f"[SENSOR] Sensor {sensor_id} marked OFFLINE (no data for {SENSOR_TIMEOUT_SECONDS}s)")
    
    # Broadcast status change for any sensors that went offline
    for sensor_id in sensors_went_offline:
        await broadcast_sensor_status(sensor_id, False)


async def broadcast_sensor_status(sensor_id: int, online: bool):
    """Broadcast sensor online/offline status to all clients."""
    message = {
        "type": "sensor_status",
        "data": {
            "sensorId": sensor_id,
            "online": online,
            "lastSeen": sensor_last_seen.get(sensor_id, datetime.utcnow()).isoformat()
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(message)


async def broadcast_sensor_reading(reading_data: dict):
    """
    Utility function to broadcast new sensor readings to all connected clients.
    Call this from your sensor data creation endpoint.
    """
    sensor_id = reading_data.get("sensorId", 1)
    
    # Update sensor status and check if it came back online
    came_online = update_sensor_status(sensor_id)
    
    # If sensor just came online, broadcast status change first
    if came_online:
        print(f"[SENSOR] Sensor {sensor_id} is now ONLINE")
        await broadcast_sensor_status(sensor_id, True)
    
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
