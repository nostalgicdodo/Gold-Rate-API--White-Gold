
// Exports
module.exports = {

	/*
	 | ----- Middleware
	 */
	allowPreFlightRequest,

	/*
	 | ----- Response helpers
	 */
	successResponse,
	invalidCredentialsResponse,
	notFoundResponse,
	invalidInputResponse,
	serverErrorResponse,

	successResponseEncrypted,

	cacheFor

}





/*
 |
 | ----- Middleware
 |
 */
function allowPreFlightRequest ( origin ) {
	this.code( 200 );
	this.header( "Access-Control-Allow-Origin", origin );
	this.header( "Access-Control-Allow-Credentials", "true" );
	this.header( "Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, DELETE" );
	this.header( "Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With" );
	this.send();
}





/*
 |
 | ----- Response helpers
 |
 */
function respond ( statusCode, message, data ) {
	let body = {
		code: statusCode
	}
	if ( typeof message === "string" )
		body.message = message;
	if ( typeof data === "object" )
		body.data = data;

	if ( ! this.hasHeader( "Cache-Control" ) )
		preventCaching.call( this );

	this.code( statusCode );
	this.send( body );
}

function successResponse ( message, data ) {
	if ( typeof message === "object" ) {
		data = message;
		message = null;
	}
	return respond.call( this, 200, message, data );
}

function notFoundResponse ( message, data ) {
	return respond.call( this, 404, message, data );
}

function invalidInputResponse ( message, data ) {
	return respond.call( this, 422, message, data );
}

function serverErrorResponse ( message, data ) {
	return respond.call( this, 500, message, data );
}

function invalidCredentialsResponse ( message, data ) {
	return respond.call( this, 403, message, data );
}

function successResponseEncrypted ( message, data ) {
	const statusCode = 200
	let body = {
		code: statusCode
	}
	if ( typeof message === "object" )
		data = message

	if ( typeof message === "string" )
		body.message = message;
	if ( typeof data === "object" )
		body.data = data;

	let encodedBody = Buffer.from( JSON.stringify( body ) ).toJSON().data
	let obfuscatedBody

	// Obfuscation approach #1: Uniformly offset every element in the buffer array
	// obfuscatedBody = new Array( encodedBody.length )
	// let _index = 0
	// for ( let point of encryptedBody )
	// 	obfuscatedBody[ _index++ ] = ( point + 1 ) % 256

	// Obfuscation approach #2: Offset only the first element in the buffer array
	obfuscatedBody = encodedBody
	obfuscatedBody[ 0 ] = ( obfuscatedBody[ 0 ] + 1 ) % 256


	this.code( statusCode );
	this.send( obfuscatedBody );
}


function cacheFor ( durationInSeconds ) {
	this.header( "Cache-Control", `s-maxage=${ durationInSeconds }` );
}
function preventCaching () {
	this.header( "Cache-Control", "no-store" );
}
