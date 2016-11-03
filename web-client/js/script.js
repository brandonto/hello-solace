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
    function mesageEventCb (session, message) {
        console.log("msg event cb");
      
    };
	/**
     * Session event callback
     * @param session
     * @param event
     */
    function sessionEventCb (session, event) {
		
      console.log("session event cb");
    };
}
