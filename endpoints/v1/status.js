
/*
 |
 | Returns the application status
 | Endpoint: /status
 |
 */
module.exports = routes;

function routes ( router, options, done ) {

	router.all( "/v1/status", function ( request, reply ) {
		reply.successResponse( "All good.", { method: request.method } );
	} );

	done();

}
