window.onload = function() {
var mySession = null;
var mySessionProperties = null;

    function changeBackgroundColor(color) {
        document.body.style.backgroundColor = color;
    }

    //changeBackgroundColor('#cbcbcb');
    changeBackgroundColor('#000000');

            mySessionProperties = new solace.SessionProperties();


            mySessionProperties.connectTimeoutInMsecs = 25000;
            mySessionProperties.transportDowngradeTimeoutInMsecs = 5000;

            //mySessionProperties.readTimeoutInMsecs = OPERATION_TIMEOUT;
            mySessionProperties.keepAliveIntervalsLimit = 10;
            mySessionProperties.userName = "default";
            mySessionProperties.vpnName = "";
            mySessionProperties.password = "default";
            mySessionProperties.url = "http://69.20.234.126:8134";
            //mySessionProperties.reapplySubscriptions = autoReconnect;
            mySessionProperties.keepAliveIntervalInMsecs = 3000;
var topic = solace.SolclientFactory.createTopic("brandon");
            
            mySession = solace.SolclientFactory.createSession(mySessionProperties,
                    new solace.MessageRxCBInfo(function(session, message) {
                            messageEventCb(session, message);
                    }, this),
                    new solace.SessionEventCBInfo(function(session, event) {
                        sessionEventCb(session, event);
                    }, this));
					
			mySession.connect();
			
			
			
	    /**
     * Direct message receive callback
     * @param session
     * @param message
     */
    function messageEventCb (session, message) {
		var num = Number(message.getSdtContainer().getValue());
		console.log(num);
		var newColor;
		if (num < 200){
			newColor = '#ffffff';
		}else if (num < 300){
			newColor = '#eeeeee';
		}else if (num < 400){
			newColor = '#dddddd';
		}else if (num < 500){
			newColor = '#cccccc';
		}else if (num < 600){
			newColor = '#bbbbbb';
		}else if (num < 700){
			newColor = '#aaaaaa';
		}else if (num < 800){
			newColor = '#999999';
		}else if (num < 900){
			newColor = '#888888';
		}else if (num < 1000){
			newColor = '#777777';
		}else if (num < 1100){
			newColor = '#666666';
		}else if (num < 1200){
			newColor = '#555555';
		}else if (num < 1300){
			newColor = '#444444';
		}
		changeBackgroundColor(newColor);
		
    };
	/**
     * Session event callback
     * @param session
     * @param event
     */
    function sessionEventCb (session, event) {
			if (event.sessionEventCode === solace.SessionEventCode.UP_NOTICE) {
				var requestConfirmation = true;
				mySession.subscribe(topic, requestConfirmation);
				console.log("session event cb: UP_NOTICE");
			}
    };
}
