var inspect = require("util").inspect;
var MariaSQLClient = require("mariasql");

// main
function main(){
	var database = new Database (
		"mysqltestdb.cvv9tiyz79ju.eu-west-1.rds.amazonaws.com", // host
		"admin", // username
		"admin234" // password
	);

	database.query (
		"SHOW DATABASES",
		databaseQueryComplete,
		null // thisForQuery
	);
}

function databaseQueryComplete(rowsRetrieved){
	console.log("Rows retrieved:");

	for (var i = 0; i < rowsRetrieved.length; i++){
		var row = rowsRetrieved[i];
		console.log(row);
	}
}

// classes

function Database(host, username, password){
	this.client = new MariaSQLClient();
	this.client.connect({
	  		host: host,
	  		user: username,
	  		password: password
	});

	this.client.on(
		"connect",
		this.handleEventClientConnect.bind(this)
	).on(
		"error",
		this.handleEventClientError.bind(this)
	).on(
		"close",
		this.handleEventClientClose.bind(this)
	);
}
{
	Database.prototype.query = function(queryText, callback, thisForCallback){
		this.client.query(queryText).on(
			"result",
			this.handleEventQueryResult.bind(this, callback, thisForCallback)
		).on(
			"end",
			this.handleEventQueryEnd.bind(this)
		);

		this.client.end();
	}

	// events
	Database.prototype.handleEventClientClose = function(hadError){
		console.log("Client closed.");
	}

	Database.prototype.handleEventClientConnect = function(){
		console.log("Client connected.");
	}

	Database.prototype.handleEventClientError = function(error){
		{ console.log("Client error: " + error); }
	}

	Database.prototype.handleEventQueryEnd = function(){
		console.log("Done with all results.");
	}

	Database.prototype.handleEventQueryResult = function(
		callback, thisForCallback, result
	){
		var rowsRetrieved = [];

		result.on(
			"row",
			this.handleEventQueryResultRow.bind(
				this,
				rowsRetrieved
			)
		).on(
			"error",
			this.handleEventQueryResultError.bind(this)
		).on(
			"end",
			this.handleEventQueryResultEnd.bind(
				this, rowsRetrieved, callback, thisForCallback
			)
		);
	}

	Database.prototype.handleEventQueryResultEnd = function(
		rowsRetrieved, callback, thisForCallback, info
	){
		console.log("Result finished successfully.");
		callback.call(thisForCallback, rowsRetrieved);
	}

	Database.prototype.handleEventQueryResultError = function(error){
		console.log("Result error: " + inspect(error));
	}

	Database.prototype.handleEventQueryResultRow = function(rowsRetrieved, row){
		var rowAsString = inspect(row);
		rowsRetrieved.push(rowAsString);
	}
}

// run
main();
