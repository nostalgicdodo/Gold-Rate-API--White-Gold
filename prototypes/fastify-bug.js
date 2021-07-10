
const fastify = require( "fastify" )()

let requestCount = 0

fastify.get( "/one", function ( request, reply ) {

	requestCount += 1
	console.log( "Requests: " + requestCount )

	if ( requestCount % 2 === 1 ) {
		setTimeout( function () {
			reply.send( { message: "wait" } )
		}, 5000 )
	}
	else
		reply.send( { message: "ok" } )

} )

fastify.get( "/two", function ( request, reply ) {
	return { message: "two" }
} )

fastify.listen( 9996 )
	.then( function ( httpPort ) {
		console.log( "HTTP server is listening at " + httpPort + "." );
	} )
	.catch( function ( e ) {
		console.error( e );
		process.exit( 1 );
	} )
