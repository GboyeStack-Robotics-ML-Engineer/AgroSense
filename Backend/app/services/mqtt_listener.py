import json
from typing import Any
import asyncio
import threading
import time
import paho.mqtt.client as mqtt
from ..database import SessionLocal
from ..models import SensorReading
from ..routers.websocket import broadcast_sensor_reading
import ast

MQTT_HOST = "smart.local"
MQTT_PORT = 1883
MQTT_USER = "esp32"
MQTT_PASSWORD = "sensormod"
MQTT_TOPIC = "AgriMonitor"

class MQTTListener:
    def __init__(self) -> None:
        self.client = mqtt.Client()
        self.client.username_pw_set(MQTT_USER, MQTT_PASSWORD)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        self.is_connected = False
        self._shutdown = False
        self._reconnect_thread = None

    def start(self) -> None:
        """Start MQTT connection in a non-blocking way."""
        self._shutdown = False
        self._reconnect_thread = threading.Thread(target=self._connect_with_retry, daemon=True)
        self._reconnect_thread.start()
        print("[MQTT] Connection thread started")

    def _connect_with_retry(self) -> None:
        """Try to connect to MQTT broker with retries."""
        retry_delay = 5  # seconds
        
        while not self._shutdown:
            if not self.is_connected:
                try:
                    print(f"[MQTT] Attempting to connect to {MQTT_HOST}:{MQTT_PORT}...")
                    self.client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
                    self.client.loop_start()
                    self.is_connected = True
                    print("[MQTT] Connection successful!")
                    break
                except Exception as e:
                    print(f"[MQTT] Connection failed: {e}")
                    print(f"[MQTT] Retrying in {retry_delay} seconds... (Broker may be offline)")
                    time.sleep(retry_delay)
            else:
                break

    def shutdown(self) -> None:
        """Stop MQTT client gracefully."""
        self._shutdown = True
        self.client.loop_stop()
        self.client.disconnect()
        print("[MQTT] Disconnected")

    def on_connect(self, client: mqtt.Client, userdata: Any, flags: Any, rc: int) -> None:
        if rc == 0:
            print(f"[MQTT] Connected successfully!")
            self.is_connected = True
            client.subscribe(MQTT_TOPIC)
            print(f"[MQTT] Subscribed to topic: {MQTT_TOPIC}")
        else:
            print(f"[MQTT] Connection failed with code: {rc}")
            self.is_connected = False

    def on_disconnect(self, client: mqtt.Client, userdata: Any, rc: int) -> None:
        print(f"[MQTT] Disconnected (rc={rc})")
        self.is_connected = False
        
        # Auto-reconnect if not shutting down
        if not self._shutdown and rc != 0:
            print("[MQTT] Unexpected disconnect, will attempt to reconnect...")
            threading.Thread(target=self._connect_with_retry, daemon=True).start()

    def on_message(self, client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage) -> None:
        msg_payload = msg.payload.decode("utf-8")
        try:
            data = ast.literal_eval(msg_payload)
            print(data)
            data['ph']=0 #Remove this line when ph sensor is available
            self.persist_reading(data)
        except Exception as exc:
            print(f"[MQTT] Invalid payload '{msg_payload}': {exc}")

    def persist_reading(self, data: dict[str, Any]) -> None:
        db = SessionLocal()
        try:
            reading = SensorReading(
                sensor_id=data.get("id", 1),  # Hardware sensor ID from MQTT
                moisture=data["moisture"],
                temperature=data["temperature"],
                humidity=data["humidity"],
                ph=data["ph"],
                zone=data.get("zone", "main"),
            )
            db.add(reading)
            db.commit()
            db.refresh(reading)

            # Broadcast to WebSocket clients
            reading_data = {
                "id": reading.id,  # Database ID
                "sensorId": reading.sensor_id,  # Hardware sensor ID
                "timestamp": reading.timestamp.isoformat(),
                "moisture": reading.moisture,
                "temperature": reading.temperature,
                "humidity": reading.humidity,
                "ph": reading.ph,
                "zone": reading.zone,
            }
            
            print(f"[MQTT] Broadcasting reading: {reading_data}")
            
            # Create task to broadcast (don't block MQTT thread)
            try:
                loop = asyncio.get_event_loop()
                loop.create_task(broadcast_sensor_reading(reading_data))
            except RuntimeError:
                # If no event loop in thread, use asyncio.run
                asyncio.run(broadcast_sensor_reading(reading_data))
        except Exception as e:
            print(f"[MQTT] Error persisting reading: {e}")
        finally:
            db.close()

mqtt_listener = MQTTListener()  