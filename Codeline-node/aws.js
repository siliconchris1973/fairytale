var express    = require("express");
var inspect = require('util').inspect;
var Client = require('mariasql');

var client = new Client();
client.connect ({
    host     : 'mysqltestdb.cvv9tiyz79ju.eu-west-1.rds.amazonaws.com',
    port     : '3306',
    user     : 'admin',
    password : 'admin234'
});

console.log("startup");

client.on (
	'connect', function() { console.log('Client connected'); }
).on (
	'error', function(err) { console.log('Client error: ' + err); }
).on (
	'close', function(hadError) { console.log('Client closed'); }
);

client.query('SHOW DATABASES').on (
	'result',
	function(result) {
		result.on(
			'row',
			function(row) { console.log('Result row: ' + inspect(row)); }
		).on (
			'error',
			function(err) { console.log('Result error: ' + inspect(err)); }
		).on (
			'end',
			function(info) { console.log('Result finished successfully'); }
		);
 	}
).on (
	'end',
	function() { console.log('Done with all results'); }
);

client.end();
