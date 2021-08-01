
// Exports
// See end of file





// Constants
let rootDir = __dirname + "/..";

/*
 *
 * Packages
 *
 */
// Third-party packages
let fastify = require( "fastify" );
// Custom
let errors = require( `${rootDir}/lib/errors.js` );
let http = require( `${rootDir}/lib/http.js` );






// Create the router
let router = fastify();


/*
 * -/-/-/-/-/-/
 * Middleware
 * -/-/-/-/-/-/
 */
router.register( require( "fastify-cors" ), {
	origin: true,
	credentials: true,
	methods: [ "OPTIONS", "GET", "POST", "PUT", "DELETE" ],
	// allowedHeaders: [ "Content-Type", "Authorization", "Content-Length", "X-Requested-With" ]
} );
router.decorateReply( "successResponse", http.successResponse );
router.decorateReply( "notFoundResponse", http.notFoundResponse );
router.decorateReply( "invalidInputResponse", http.invalidInputResponse );
router.decorateReply( "serverErrorResponse", http.serverErrorResponse );

router.decorateReply( "successResponseEncrypted", http.successResponseEncrypted );

router.decorateReply( "cacheFor", http.cacheFor );

router.decorateReply( "allowPreFlightRequest", http.allowPreFlightRequest );

router.setErrorHandler( function errorHandler ( e, request, reply ) {
	const message = e.message;
	let responseHandlerName;

	if ( e instanceof errors.InvalidInputError )
		responseHandlerName = "invalidInputResponse";
	else if ( e instanceof errors.DataNotFoundError )
		responseHandlerName = "notFoundResponse";
	else
		responseHandlerName = "serverErrorResponse";

	return reply[ responseHandlerName ]( message, e.data );
} );





module.exports = {
	router
};
