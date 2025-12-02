
import paho.mqtt.client as mqtt

mqtt_addr = "192.168.50.1"
mqtt_user = "esp32"
mqtt_passwd = "sensormod"
mqtt_topic = "AgriMonitor"


def on_connect(client, userdata, flags, rc):
    print('Connected with result code ' + str(rc))
    client.subscribe(mqtt_topic)

def on_message(client, userdata, msg):

    print(msg.topic + ' '  + str(msg.payload))
    msg=str(msg.payload)

if __name__=='__main__':

    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.username_pw_set(mqtt_user, mqtt_passwd)

    mqtt_client.connect(mqtt_addr, 1883)
    mqtt_client.loop_forever()

