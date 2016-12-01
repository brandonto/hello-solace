Connect the board first:
Connect the LED to pin18 of the CANAKIT pinout strip
Connect the button to pin27 of the CANAKIT pinout strip

Before running the Java app:
1- make sure the "pi4j" Java GPIO library is properly installed:
   sudo -E curl -s get.pi4j.com | sudo -E bash
2- All Solace JCSMP API jars from ../solace-api/lib/ are under ./lib/

Run the following commands inside the current directory:
sudo javac -classpath .:classes:/opt/pi4j/lib/'*':./lib/'*' PushButton.java
sudo java -classpath .:classes:/opt/pi4j/lib/'*':./lib/'*' PushButton 69.20.234.126:22234 default default ghaith
