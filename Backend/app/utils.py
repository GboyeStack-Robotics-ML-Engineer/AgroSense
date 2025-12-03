import json
import ast
import paho.mqtt.client as mqtt
# import RPi.GPIO as GPIO
from time import sleep

mqtt_addr = "smart.local"
mqtt_user = "esp32"
mqtt_passwd = "sensormod"
mqtt_topic = "AgriMonitor"

with open('./app/pinconfig.json', 'r') as file:
        moduleData = json.load(file)

# GPIO.setwarnings(False)
# GPIO.setmode(GPIO.BCM)

for (key, value) in moduleData.items():
        # GPIO.setup(value["sprinkler"], GPIO.OUT)
        # GPIO.setup(value["pipe"], GPIO.OUT)
        pass


def on_connect(client, userdata, flags, rc):
        print('Connected with result code ' + str(rc))
        client.subscribe(mqtt_topic)

def on_message(client, userdata, msg):
        msg_payload = msg.payload.decode("utf-8")
        print(msg.topic + ' '  + msg_payload)
        data = ast.literal_eval(msg_payload)
        id = data["id"]
        if data["humidity"] < 80:
                # GPIO.output(moduleData[str(id)]["sprinkler"], True)
                # sleep(5)
                # GPIO.output(moduleData[str(id)]["sprinkler"], False)
                # sleep(5)
                pass

if __name__=='__main__':

        mqtt_client = mqtt.Client()
        mqtt_client.on_connect = on_connect
        mqtt_client.on_message = on_message
        mqtt_client.username_pw_set(mqtt_user, mqtt_passwd)

        mqtt_client.connect(mqtt_addr, 1883)
        mqtt_client.loop_forever()
