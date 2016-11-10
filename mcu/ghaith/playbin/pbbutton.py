import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup(18, GPIO.IN,pull_up_down=GPIO.PUD_UP)

i=0
while True:
    inputValue = GPIO.input(18)
    if (inputValue == False):
	i=i+1
        print(i)
    time.sleep(0.2)
