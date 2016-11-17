window.onload = function() {

    function changeBackgroundColor(color) {
        document.body.style.backgroundColor = color;
    }

    changeBackgroundColor('#D1BB40');
    //changeBackgroundColor('#000000');

    var socket = new WebSocket('ws://127.0.0.1:5001');

    socket.onopen = function() {
        console.log('connection opened');
    }

    socket.onclose = function() {
        console.log('connection closed');
    }

    socket.onmessage = function(event) {
        console.log('message received');
    }
}
