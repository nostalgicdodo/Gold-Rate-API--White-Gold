
/*
 |
 | Returns the application status
 | Endpoint: /cache/update/:key
 |
 */
module.exports = routes;

function routes ( router, options, done ) {

	router.put( "/_internal/v1/cache/update/:key", function ( request, reply ) {

		let key = request.params.key;
		let value = request.body.value;

		return "stub"

	} );

	done();

}
