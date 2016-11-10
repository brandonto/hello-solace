var gpio = require("pi-gpio");

gpio.open(18, "input", function(err) {
	gpio.read(18, function(err, value) {
		console.log(value);
		gpio.close(18);
	});
});

