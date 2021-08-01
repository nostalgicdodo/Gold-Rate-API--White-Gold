
/*
 |
 | This module has functions to handle databases
 |
 */

module.exports = {
	getClient,
	getDatabase
};





// Constants
let rootDir = __dirname + "/../";
let databaseConfigurationFilename = rootDir + "environment/configuration/database.json";


// Third-party packages
let { MongoClient } = require( "mongodb" );

// Our custom imports
let log = require( `${ rootDir }/lib/logging.js` );
let databaseConfiguration = require( databaseConfigurationFilename );




let mongoDBClientIsConnected = false;
let connectionURI = databaseConfiguration.mongodb.connectionURI;
let mongoDBClient = new MongoClient( connectionURI );
let database;
async function connectToMongoDBServer () {
	if ( mongoDBClientIsConnected )
		return mongoDBClient;
	await mongoDBClient.connect();
	await mongoDBClient.db( "admin" ).command( { ping: 1 } )
	await setupSchema( mongoDBClient );
	mongoDBClientIsConnected = true
	log.toConsole( "Opened connection to the Mongo database." );
	return mongoDBClient;
}

async function getClient () {
	return await connectToMongoDBServer();
}

async function getDatabase () {
	if ( database )
		return database;
	return await getClient().then( function ( client ) {
		database = client.db( databaseConfiguration.mongodb.database )
		return database;
	} );
}





/*
 *
 * Setup the database schemas and constraints and indexes and the like
 *
 */
async function setupSchema ( client ) {
	let databaseName = databaseConfiguration.mongodb.database;
	let collections = databaseConfiguration.mongodb.collections || [ ];
	for ( let c of collections ) {
		let collection = await client.db( databaseName ).collection( c.name );
		if ( ! c.indices )
			continue;
		for ( let i of c.indices ) {
			let fields = i.fields.map( function ( fieldNameAndSortOrder ) {
				if ( ! Array.isArray( fieldNameAndSortOrder ) )
					return [ fieldNameAndSortOrder, 1 ];
				return fieldNameAndSortOrder;
			} );
			collection.createIndex(
				Object.fromEntries( fields ),
				i.options || { }
			)
		}
	}
	return client;
}





/*
 * Handle process shutdown
 *
 * - Close the connection to the database
 *
 */
async function shutdownGracefully ( e ) {
	log.toConsole( e );
	try {
		log.toConsole( "Closing connection to the Mongo database..." );
		await mongoDBClient.close();
		log.toConsole( "Closed connection to the Mongo database." );
	}
	catch ( e ) {
		log.toConsole( e );
		return;
	}
}
process.on( "SIGINT", shutdownGracefully );
