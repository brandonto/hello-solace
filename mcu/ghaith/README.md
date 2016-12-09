This program can only be run on a Raspberry Pi.
After connecting a button and (optional) an LED to the RasPi, you can run this program
to send a message through a Solace Router to a web client by pushing the button.
For demo purposes, a message of topic `ghaith` sent to `69.20.234.126:22234` currently
controls a GUI element on a web page that first needs to be hosted (see /web-client).

RasPi setup:
Connect the LED (with its resistor) to pin18 of the CANAKIT pinout strip
Connect the button to pin27 of the CANAKIT pinout strip

To build:
Run `gradle build` in this directory.

To run:
```java -jar ./build/libs/hello-solace-1.0-SNAPSHOT.jar <msg_backbone_ip:port> <vpn> <client-username> <topic>```
e.g. `java -jar ./build/libs/hello-solace-1.0-SNAPSHOT.jar 69.20.234.126:22234 default default ghaith`

Note that the appliance `69.20.234.126:22234` has already been configured to listen to the topic `ghaith`
coming from the RasPi.