
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
        shortcut: 'help',
        endpoint: nfcReaderProtocol + '://' + nfcReaderHost+':'+nfcReaderPort+nfcReaderApi+nfcReaderUrl+nfcReaderHelpUri,
        method: 'GET',
        description: 'returns a help page',
        alive: 'false'
      },
      {
        shortcut: 'health',
        endpoint: nfcReaderProtocol + '://' + nfcReaderHost+':'+nfcReaderPort+nfcReaderApi+nfcReaderUrl+nfcReaderHealthUri,
        method: 'GET',
        description: 'health status interface',
        alive: 'false'
      }
    ]
  };
  return theEndpoints;
}

module.exports = {
  getEndpoints: getEndpoints
}
