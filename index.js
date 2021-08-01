
// Our custom imports
let log = require( "./lib/logging.js" );
let httpServer = require( "./endpoints/index.js" );



/*
 * Constants
 */
let httpPort = process.env.HTTP_PORT || 9996;

/*
 * -/-/-/-/-/
 * Set up the HTTP API server and plug-in the router
 * -/-/-/-/-/
 */
httpServer.listen( httpPort )
	.then( function ( httpPort ) {
		if ( process.env.NODE_ENV != "production" )
			log.toConsole( "HTTP server is listening at " + httpPort + "." );
		if ( process.send )
			process.send( "ready" );
	} )
	.catch( function ( e ) {
		log.toConsole( e );
		process.exit( 1 );
	} )



/*
 * Handle process shutdown
 *
 * - Shut down the HTTP server.
 *
 */
process.on( "SIGINT", async function ( signal, code ) {

	log.toConsole( "Shutting down HTTP server..." );
	await httpServer.close();
	log.toConsole( "HTTP server has been shut down." );
	log.toConsole( "All done." );

} );

// When unexpected and unhandled exceptions or errors are thrown
async function shutdownGracefully ( e ) {

	let context = "There was an uncaught error or unhandled rejection";

	if ( process.env.NODE_ENV === "production" ) {
		let message = e.toString();
		if ( e.stack )
			message += "\n```\n" + e.stack + "\n```";

		if ( log && log.toUs )
			await log.toUs( {
				context: context,
				message: message,
				data: e
			} );
	}
	else {
		console.error( e );
	}

	setTimeout( function () {
		console.log( "Terminating process right now." );
		process.exit( 1 );
	}, 1000 );

}
// process.on( "uncaughtException", shutdownGracefully );
// process.on( "unhandledRejection", shutdownGracefully );
