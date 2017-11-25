//var gpio = require('rpi-gpio');
//var gpio = require('onoff').Gpio;

var config = require('../modules/configuration.js');

// CONFIG data on the led Service
const svrAppName = config.ledServiceEndpoint.AppName;
const svrProtocol = config.ledServiceEndpoint.Protocol;
const svrHost = config.ledServiceEndpoint.Host;
const svrPort = Number(config.ledServiceEndpoint.Port);
const svrApi = config.ledServiceEndpoint.Api;
const svrUrl = config.ledServiceEndpoint.Url;
const svrHealthUri = config.ledServiceEndpoint.HealthUri;
const svrHelpUri = config.ledServiceEndpoint.HelpUri;
const svrInfoUri = config.ledServiceEndpoint.InfoUri;
const svrStatusUri = config.ledServiceEndpoint.StatusUri;
const svrEndpointsUri = config.ledServiceEndpoint.EndpointsUri;
const svrDescription = config.ledServiceEndpoint.Description;
const svrFullUrl = svrProtocol + '://'+svrHost+':'+svrPort+svrApi+svrUrl;

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
        AppName: 'endpoints',
        endpoint: svrFullUrl+svrEndpointsUri,
        description: 'Endpoints of the Player API',
        alive: 'true'
      },
      {
        AppName: 'info',
        endpoint: svrFullUrl+svrInfoUri,
        description: 'Info Endpoint of the Player API',
        alive: 'true'
      },
      {
        AppName: 'welcome',
        endpoint: svrFullUrl+svrWelcomeUri,
        description: 'Welcome Endpoint of the Player API',
        alive: 'true'
      },
      {
        AppName: 'help',
        endpoint: svrFullUrl+svrHelpUri,
        description: 'Help Endpoint of the Player API',
        alive: 'true'
      },
      {
        AppName: 'health',
        endpoint: svrFullUrl+svrHealthUri,
        description: 'Health Endpoint of the Player API',
        alive: 'true'
      },
      {
        AppName: 'status',
        endpoint: svrFullUrl+svrStatusUri,
        description: 'Statu Endpoint of the Player API',
        alive: 'true'
      },
      {
        shortcut: 'cycle',
        endpoint: svrFullUrl+'/cycle',
        method: 'GET',
        description: 'issue a cycle command',
        alive: 'false'
      },
      {
        shortcut: 'blink',
        endpoint: svrFullUrl+'/blink/:led',
        method: 'GET',
        description: 'set blink command on an led',
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
