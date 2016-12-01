import com.pi4j.io.gpio.GpioController;
import com.pi4j.io.gpio.GpioFactory;
import com.pi4j.io.gpio.GpioPinDigitalInput;
import com.pi4j.io.gpio.GpioPinDigitalOutput;
import com.pi4j.io.gpio.PinPullResistance;
import com.pi4j.io.gpio.RaspiPin;
import com.pi4j.io.gpio.event.GpioPinDigitalStateChangeEvent;
import com.pi4j.io.gpio.event.GpioPinListenerDigital;
import com.solacesystems.jcsmp.*;
import com.solacesystems.common.*;

/**
 *
 * @author Ghaith Dalla-Ali
 */
public class PushButton {

    public static void main(String[] args) throws InterruptedException {
        // Check command line arguments
        if (args.length < 4) {
            System.out.println("Usage: PushButton <msg_backbone_ip:port> <vpn> <client-username> <topic>");
            System.exit(-1);
        }
        PushButton pushButton = new PushButton();
        pushButton.run(args);
    }
    
    public static class SolPub {
        
        public static void pub(String... args) throws JCSMPException {

            System.out.println("Pub initializing...");

            // Create a JCSMP Session
            final JCSMPProperties properties = new JCSMPProperties();
            properties.setProperty(JCSMPProperties.HOST, args[0]);      // msg-backbone ip:port
            properties.setProperty(JCSMPProperties.VPN_NAME, args[1]);  // message-vpn
            properties.setProperty(JCSMPProperties.USERNAME, args[2]);  // client-username (assumes no password)
            final JCSMPSession session =  JCSMPFactory.onlyInstance().createSession(properties);
            
            final Topic topic = JCSMPFactory.onlyInstance().createTopic(args[3]);
            
            /** Anonymous inner-class for handling publishing events */
            XMLMessageProducer prod = session.getMessageProducer(new JCSMPStreamingPublishEventHandler() {
                public void responseReceived(String messageID) {
                    System.out.println("Producer received response for msg: " + messageID);
                }
                public void handleError(String messageID, JCSMPException e, long timestamp) {
                    System.out.printf("Producer received error for msg: %s@%s - %s%n",
                            messageID,timestamp,e);
                }
            });
            // Publish-only session is now hooked up and running!
            
            TextMessage msg = JCSMPFactory.onlyInstance().createMessage(TextMessage.class);
            final String text = "Hello world!";
            msg.setText(text);
            System.out.printf("Connected. About to send message '%s' to topic '%s'...%n",text,topic.getName());
            prod.send(msg,topic);
            System.out.println("Message sent. Exiting.");
            session.closeSession();
        }
    }

    public static void run(String[] args) throws InterruptedException {

        System.out.println("Started.");

        // create gpio controller
        final GpioController gpio = GpioFactory.getInstance();

        // provision gpio pin #01 & #03 as an output pins and blink
        final GpioPinDigitalOutput led1 = gpio.provisionDigitalOutputPin(RaspiPin.GPIO_01);
        final GpioPinDigitalOutput led2 = gpio.provisionDigitalOutputPin(RaspiPin.GPIO_03);

        // provision gpio pin #02 as an input pin with its internal pull down resistor enabled
        final GpioPinDigitalInput myButton = gpio.provisionDigitalInputPin(RaspiPin.GPIO_02, PinPullResistance.PULL_UP);


        // create and register gpio pin listener
        myButton.addListener(new GpioPinListenerDigital() {
            @Override
            public void handleGpioPinDigitalStateChangeEvent(GpioPinDigitalStateChangeEvent event) {
                System.out.println("pressed!");
                SolPub hwp = new SolPub();
                try {
                    // When message is sent, blink
                    if(event.getState().isHigh()){
                        led1.blink(1000,1000);
                        led2.blink(1000,1000);
                        hwp.pub(args);
                    }
                } catch(Exception e){
                    System.out.println("Error publishing message!");
                }

            }
        });

        // // continuously blink the led every 1/2 second for 15 seconds
        // led1.blink(500, 15000);
        
        System.out.println("PRESS <CTRL-C> TO STOP THE PROGRAM.");

        // keep program running until user aborts (CTRL-C)
        while(true) {
            Thread.sleep(500);
        } 


        // stop all GPIO activity/threads
        // (this method will forcefully shutdown all GPIO monitoring threads and scheduled tasks)
        // gpio.shutdown();   <--- implement this method call if you wish to terminate the Pi4J GPIO controller
    }
}

