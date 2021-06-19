import RPi.GPIO as GPIO
import dht11
import time
import datetime
import json
# initialize GPIO
GPIO.setwarnings(True)
GPIO.setmode(GPIO.BCM)

# read data using pin 14
instance = dht11.DHT11(pin=14)

result = ""
try:
    while True:
        result = instance.read()
        if result.is_valid():
            data = {
                "temperature" : result.temperature,
                "humidity": result.humidity
            }
            with open("/home/admin/Goods_Resources/dht11", "w") as f:
                f.write(json.dumps(data))
            time.sleep(10)
        else:
            print("error!")
except KeyboardInterrupt:
    print("Cleanup")
    GPIO.cleanup()
