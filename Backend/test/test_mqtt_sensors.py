"""
Test script to send sample sensor data via MQTT for testing the dashboard.
This simulates 2 different sensors sending data.

Requirements:
- pip install paho-mqtt

Usage:
python test_mqtt_sensors.py
"""

import paho.mqtt.client as mqtt
import json
import time
import random

MQTT_BROKER = "smart.local"  # Change this to your broker address
MQTT_PORT = 1883
MQTT_TOPIC = "sensor/data"

def send_sensor_reading(client, sensor_id, zone):
    """Send a simulated sensor reading."""
    reading = {
        "id": sensor_id,
        "moisture": round(random.uniform(30, 70), 1),
        "temperature": round(random.uniform(20, 30), 1),
        "humidity": round(random.uniform(50, 80), 1),
        "ph": round(random.uniform(6.0, 7.5), 2),
        "zone": zone
    }
    
    payload = json.dumps(reading)
    result = client.publish(MQTT_TOPIC, payload)
    
    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"✅ Sent data from Sensor #{sensor_id}: {reading}")
    else:
        print(f"❌ Failed to send data from Sensor #{sensor_id}")
    
    return result

def main():
    print("🚀 Starting MQTT Test - Sending data from 2 sensors...")
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Topic: {MQTT_TOPIC}\n")
    
    # Create MQTT client
    client = mqtt.Client()
    
    try:
        # Connect to broker
        print(f"Connecting to MQTT broker at {MQTT_BROKER}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        time.sleep(1)  # Wait for connection
        print("✅ Connected!\n")
        
        # Send readings from 2 different sensors every 5 seconds
        print("Sending readings every 5 seconds (Ctrl+C to stop)...\n")
        
        count = 0
        while True:
            count += 1
            print(f"\n--- Reading #{count} ---")
            
            # Sensor 1 in field A
            send_sensor_reading(client, sensor_id=1, zone="field_a")
            time.sleep(1)
            
            # Sensor 2 in field B
            send_sensor_reading(client, sensor_id=2, zone="field_b")
            
            # Wait before next batch
            time.sleep(4)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Stopped by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        print("Disconnected from broker")

if __name__ == "__main__":
    main()
