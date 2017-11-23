
var config = require('../modules/configuration.js');

// CONFIG data on the RFID/NFC Tag DB Service
// CONFIG data on the RFID/NFC Reader Service
const nfcReaderAppName = config.nfcReaderEndpoint.AppName;
const nfcReaderProtocol = config.nfcReaderEndpoint.Protocol;
const nfcReaderHost = config.nfcReaderEndpoint.Host;
const nfcReaderPort = Number(config.nfcReaderEndpoint.Port);
const nfcReaderApi = config.nfcReaderEndpoint.Api;
const nfcReaderUrl = config.nfcReaderEndpoint.Url;
const nfcReaderHealthUri = config.nfcReaderEndpoint.HealthUri;
const nfcReaderHelpUri = config.nfcReaderEndpoint.HelpUri;
const nfcReaderInfoUri = config.nfcReaderEndpoint.InfoUri;
const nfcReaderWelcomeUri = config.nfcReaderEndpoint.WelcomeUri;
const nfcReaderStatusUri = config.nfcReaderEndpoint.StatusUri;
const nfcReaderEndpointsUri = config.nfcReaderEndpoint.EndpointsUri;
const nfcReaderDescription = config.nfcReaderEndpoint.Description;

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
      }
    ]
  };
  return theEndpoints;
}

module.exports = {
  getEndpoints: getEndpoints
}
