
var config = require('../modules/configuration.js');

// CONFIG data on the app
const svrAppName = config.appEndpoint.AppName;
const svrProtocol = config.appEndpoint.Protocol;
const svrHost = config.appEndpoint.Host;
const svrPort = Number(config.appEndpoint.Port);
const svrApi = config.appEndpoint.Api;
const svrUrl = config.appEndpoint.Url;
const svrHealthUri = config.appEndpoint.HealthUri;
const svrHelpUri = config.appEndpoint.HelpUri;
const svrDescription = config.appEndpoint.Description;

// CONFIG data on the file Upload Service
const fileServiceAppName = config.fileServiceEndpoint.AppName;
const fileServiceProtocol = config.fileServiceEndpoint.Protocol;
const fileServiceHost = config.fileServiceEndpoint.Host;
const fileServicePort = Number(config.fileServiceEndpoint.Port);
const fileServiceApi = config.fileServiceEndpoint.Api;
const fileServiceUrl = config.fileServiceEndpoint.Url;
const fileServiceHealthUri = config.fileServiceEndpoint.HealthUri;
const fileServiceHelpUri = config.fileServiceEndpoint.HelpUri;
const fileServiceDescription = config.fileServiceEndpoint.Description;

// CONFIG data on the RFID/NFC Reader Service
const nfcReaderAppName = config.nfcReaderEndpoint.AppName;
const nfcReaderProtocol = config.nfcReaderEndpoint.Protocol;
const nfcReaderHost = config.nfcReaderEndpoint.Host;
const nfcReaderPort = Number(config.nfcReaderEndpoint.Port);
const nfcReaderApi = config.nfcReaderEndpoint.Api;
const nfcReaderUrl = config.nfcReaderEndpoint.Url;
const nfcReaderHealthUri = config.nfcReaderEndpoint.HealthUri;
const nfcReaderHelpUri = config.nfcReaderEndpoint.HelpUri;
const nfcReaderDescription = config.nfcReaderEndpoint.Description;

// CONFIG data on the RFID/NFC Tag DB Service
const tagDbServiceAppName = config.tagDbServiceEndpoint.AppName;
const tagDbServiceProtocol = config.tagDbServiceEndpoint.Protocol;
const tagDbServiceHost = config.tagDbServiceEndpoint.Host;
const tagDbServicePort = Number(config.tagDbServiceEndpoint.Port);
const tagDbServiceApi = config.tagDbServiceEndpoint.Api;
const tagDbServiceUrl = config.tagDbServiceEndpoint.Url;
const tagDbServiceHealthUri = config.tagDbServiceEndpoint.HealthUri;
const tagDbServiceHelpUri = config.tagDbServiceEndpoint.HelpUri;
const tagDbServiceDescription = config.tagDbServiceEndpoint.Description;

// CONFIG data on the MP3 Player
const playerAppName = config.playerEndpoint.AppName;
const playerProtocol = config.playerEndpoint.Protocol;
const playerHost = config.playerEndpoint.Host;
const playerPort = Number(config.playerEndpoint.Port);
const playerApi = config.playerEndpoint.Api;
const playerUrl = config.playerEndpoint.Url;
const playerHealthUri = config.playerEndpoint.HealthUri;
const playerHelpUri = config.playerEndpoint.HelpUri;
const playerDescription = config.playerEndpoint.Description;

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const soundDir = config.directories.SoundDir;
const mediaDir = config.directories.MediaDir;
const tagDB = config.directories.TagDB;
var nfcTagDir = tagDB;

// this is a synchronous function that returns all the endpoints.
var getEndpoints = function() {
  if (DEBUG) console.log('getEndpoints called');
  const theEndpoints = {
    endpoints: [
      {AppName: svrAppName, endpoint: svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrUrl, description: svrDescription},
      {AppName: svrAppName, endpoint: svrProtocol+'://'+svrHost+':'+svrPort+svrApi+'/status', description: ' Component status'},
      {AppName: svrAppName, endpoint: svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrHealthUri, description: svrDescription + ' Health interface'},
      {AppName: svrAppName, endpoint: svrProtocol+'://'+svrHost+':'+svrPort+svrApi+svrHelpUri, description: svrDescription + ' Help interface'},

      {AppName: tagDbServiceAppName, endpoint: tagDbServiceProtocol+'://'+tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceUrl, description: tagDbServiceDescription},
      {AppName: tagDbServiceAppName, endpoint: tagDbServiceProtocol+'://'+tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceHealthUri, description: tagDbServiceDescription + ' Health interface'},
      {AppName: tagDbServiceAppName, endpoint: tagDbServiceProtocol+'://'+tagDbServiceHost+':'+tagDbServicePort+tagDbServiceApi+tagDbServiceHelpUri, description: tagDbServiceDescription + ' Help interface'},

      {AppName: playerAppName, endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerUrl, description: playerDescription},
      {AppName: playerAppName, endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerHealthUri, description: playerDescription + ' Health interface'},
      {AppName: playerAppName, endpoint: playerProtocol + '://' + playerHost+':'+playerPort+playerApi+playerHelpUri, description: playerDescription + ' Help interface'},

      {AppName: nfcReaderAppName, endpoint: nfcReaderProtocol + '://' + nfcReaderHost+':'+nfcReaderPort+nfcReaderApi+nfcReaderUrl, description: nfcReaderDescription},
      {AppName: nfcReaderAppName, endpoint: nfcReaderProtocol + '://' + nfcReaderHost+':'+nfcReaderPort+nfcReaderApi+nfcReaderHealthUri, description: nfcReaderDescription + ' Health interface'},
      {AppName: nfcReaderAppName, endpoint: nfcReaderProtocol + '://' + nfcReaderHost+':'+nfcReaderPort+nfcReaderApi+nfcReaderHealthUri, description: nfcReaderDescription + ' Help interface'},

      {AppName: fileServiceAppName, endpoint: fileServiceProtocol + '://' + fileServiceHost+':'+fileServicePort+fileServiceApi+fileServiceUrl, description: fileServiceDescription + ' Upload Form'},
    ]
  };
  return theEndpoints;
}

module.exports = {
  getEndpoints: getEndpoints
}
