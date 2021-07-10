
// Exports
module.exports = {
	requireWithoutCaching,
	requireWithoutCachingSync
}



/*
 |
 | Packages
 |
 */
// Native
const path = require( "path" );
// Third-party
const callsites = require( "callsites" );
const resolve = require( "resolve" );





function requireWithoutCaching ( modulePath ) {
	const requireRelativeTo = path.dirname( callsites()[ 1 ].getFileName() ) + "/";

	return new Promise( function ( promiseResolve, promiseReject ) {
		resolve( modulePath, { basedir: requireRelativeTo }, function ( e, resolvedNormalizedModulePath ) {
			if ( e )
				return promiseReject( e );

			const moduleExports = require( resolvedNormalizedModulePath );
			delete require.cache[ resolvedNormalizedModulePath ];
			return promiseResolve( moduleExports );
		} );
	} );
}

function requireWithoutCachingSync ( modulePath ) {
	const requireRelativeTo = path.dirname( callsites()[ 1 ].getFileName() ) + "/";

	let resolvedNormalizedModulePath = resolve.sync( modulePath, { basedir: requireRelativeTo } );

	const moduleExports = require( resolvedNormalizedModulePath );
	delete require.cache[ resolvedNormalizedModulePath ];
	return moduleExports;
}
