var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyACM0', {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
});

var solace = require('./lib/solclientjs');
var publisher = {}
var startSendingToSolace = false;

var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.logLevel = solace.LogLevel.WARN;
solace.SolclientFactory.init(factoryProps);

var sessionProperties = new solace.SessionProperties();
sessionProperties.url = 'http://69.20.234.126:8134';
sessionProperties.vpnName = 'default';
sessionProperties.userName = 'default';
publisher.session = solace.SolclientFactory.createSession(
    sessionProperties,
    new solace.MessageRxCBInfo(function (session, message) {
        console.log('message received = ' + message);
    }, publisher),
    new solace.SessionEventCBInfo(function (session, event) {
        if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE) {
            console.log('UP_NOTICE');
            startSendingToSolace = true;
        } else if (event.sessionEventCode === solace.SessionEventCode.CONNECTING) {
            console.log('CONNECTING');
        } else if (event.sessionEventCode === solace.SessionEventCode.DISCONNECTED) {
            console.log('DISCONNECTED');
            startSendingToSolace = false;
        }
    }, publisher)
);
try {
    publisher.session.connect();
} catch (error) {
    console.log(error.toString());
}

var recvString = "";
var recvLen = 0;

port.on('open', function (err) {
    if (err) {
        console.log('Error on open: ' + err.message);
        return;
    }
    console.log('open successful');

    port.flush(function (err) {
        console.log('flushed recv buffer');
    });

    port.write('start\0', function (err) {
        if (err) {
            console.log('Error on first write' + err.message);
            return;
        }
        console.log('send: start');
    });
});

port.on('data', function (data) {
    var outString = "";
    recvLen += data.length;
    recvString += data;
    //console.log('recvLen:'+recvLen+', recvString:'+recvString);
    if (recvLen < 4) {
        return;
    } else {
        recvLen -= 4;
        outString = recvString.substring(0, 4);
        recvString = recvString.slice(4);
    }
    console.log('recv:' + outString);

    if (startSendingToSolace && publisher.session != null) {
        var messageText = outString;
        var message = solace.SolclientFactory.createMessage();
        message.setDestination(solace.SolclientFactory.createTopic('brandon'));
        message.setSdtContainer(solace.SDTField.create(solace.SDTFieldType.STRING, messageText));
        message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
        try {
            publisher.session.send(message);
            console.log('Message published.');
        } catch (error) {
            console.log(error.toString());
        }
    }

    port.write('ack\0', function (err) {
        if (err) {
            console.log('Error on write' + err.message);
            return;
        }
        console.log('send: ack');
    });
});

