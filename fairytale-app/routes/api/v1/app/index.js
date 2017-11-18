const app = require('express').Router();

var config = require('../../../../modules/configuration.js');
var appController = require('../../../../controller/appController.js');

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

const DEBUG = config.debugging.DEBUG;
const TRACE = config.debugging.TRACE;

const welcome = require('./welcome');
const endpoints = require('./endpoints');
const status = require('./status');

app.get('/', welcome);
app.get('/welcome', welcome);
app.get('/endpoints', endpoints);
app.get('/status', status);

module.exports = app;
