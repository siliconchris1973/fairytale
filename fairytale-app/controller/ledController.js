//var gpio = require('rpi-gpio');
//var gpio = require('onoff').Gpio;

var config = require('../modules/configuration.js');

// CONFIG data on the led Service
const ledServiceAppName = config.ledServiceEndpoint.AppName;
const ledServiceProtocol = config.ledServiceEndpoint.Protocol;
const ledServiceHost = config.ledServiceEndpoint.Host;
const ledServicePort = Number(config.ledServiceEndpoint.Port);
const ledServiceApi = config.ledServiceEndpoint.Api;
const ledServiceUrl = config.ledServiceEndpoint.Url;
const ledServiceHealthUri = config.ledServiceEndpoint.HealthUri;
const ledServiceHelpUri = config.ledServiceEndpoint.HelpUri;
const ledServiceDescription = config.ledServiceEndpoint.Description;

const REDLED = Number(config.leds.trippLED.REDLED);
const GREENLED = Number(config.leds.trippLED.GREENLED);
const BLUELED = Number(config.leds.trippLED.BLUELED);
const BLINK_SLOW = Number(config.leds.blinkspeed.slow);
const BLINK_NORMAL = Number(config.leds.blinkspeed.normal);
const BLINK_FAST = Number(config.leds.blinkspeed.fast);

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

// this is a synchronous function that returns all the endpoints.
var getEndpoints = function() {
  if (DEBUG) console.log('getEndpoints called');
  const theEndpoints = {
    endpoints: [
      {
        shortcut: 'cycle',
        endpoint: ledServiceProtocol + '://' + ledServiceHost+':'+ledServicePort+ledServiceApi+ledServiceUrl+'/cycle',
        method: 'GET',
        description: 'issue a cycle command',
        alive: 'false'
      },
      {
        shortcut: 'blink',
        endpoint: ledServiceProtocol + '://' + ledServiceHost+':'+ledServicePort+ledServiceApi+ledServiceUrl+'/blink/:led',
        method: 'GET',
        description: 'set blink command on an led',
        alive: 'false'
      },
      {
        shortcut: 'status',
        endpoint: ledServiceProtocol + '://' + ledServiceHost+':'+ledServicePort+ledServiceApi+ledServiceUrl+ledServiceStatusUri,
        method: 'GET',
        description: 'returns a status page',
        alive: 'false'
      },
      {
        shortcut: 'info',
        endpoint: ledServiceProtocol + '://' + ledServiceHost+':'+ledServicePort+ledServiceApi+ledServiceUrl+ledServiceInfoUri,
        method: 'GET',
        description: 'returns an info page',
        alive: 'false'
      },
      {
        shortcut: 'help',
        endpoint: ledServiceProtocol + '://' + ledServiceHost+':'+ledServicePort+ledServiceApi+ledServiceUrl+ledServiceHelpUri,
        method: 'GET',
        description: 'returns a help page',
        alive: 'false'
      },
      {
        shortcut: 'health',
        endpoint: ledServiceProtocol + '://' + ledServiceHost+':'+ledServicePort+ledServiceApi+ledServiceUrl+ledServiceHealthUri,
        method: 'GET',
        description: 'health status interface',
        alive: 'false'
      }
    ]
  };
  return theEndpoints;
}

var blink = function(led){
  var drivepin = REDLED;
  if (led == 'red') drivepin = REDLED;
  if (led == 'green') drivepin = GREENLED;
  if (led == 'blue') drivepin = BLUELED;
  /*
  var drivespeed = 1;
  if (speed == 'slow') drivespeed = BLINK_SLOW;
  if (speed == 'normal') drivespeed = BLINK_NORMAL;
  if (speed == 'fast') drivespeed = BLINK_FAST;

  var driveiterations = 3;
  */
  var blinkInterval = setInterval(blinkLED, 250);

  function blinkLED(LED) { //function to start blinking
    if (LED.readSync() === 0) { //check the pin state, if the state is 0 (or off)
      LED.writeSync(1); //set pin state to 1 (turn LED on)
    } else {
      LED.writeSync(0); //set pin state to 0 (turn LED off)
    }
  }

  function endBlink(LED) { //function to stop blinking
    clearInterval(blinkInterval); // Stop blink intervals
    LED.writeSync(0); // Turn LED off
    LED.unexport(); // Unexport GPIO to free resources
  }

  var LED = new Gpio(drivepin, 'out');
  setTimeout(endBlink, 5000);
}

module.exports = {
  getEndpoints: getEndpoints,
  blink: blink
}
