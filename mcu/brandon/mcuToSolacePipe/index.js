var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyACM0', {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
});

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
    port.write('world\0', function (err) {
        if (err) {
            console.log('Error on write' + err.message);
            return;
        }
        console.log('send: world');
    });
});

