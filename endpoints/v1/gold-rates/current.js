
/*
 |
 | Constants
 |
 */
let rootDir = `${ __dirname }/../../..`;

/*
 |
 | Packages
 |
 */
// Custom
let { InvalidInputError } = require( `${ rootDir }/lib/errors.js` );
let GoldRate = require( `${ rootDir }/lib/models/gold-rate.js` );
let DataPipeline = require( `${ rootDir }/lib/models/data-pipeline.js` );



/*
 |
 | Returns the application status
 | Endpoint: /gold-rates/current
 |
 */
module.exports = routes;

function routes ( router, options, done ) {

	router.get( "/v2/gold-rates/current", async function ( request, reply ) {

		let region = request.query.region;
		let internal = request.query._int === "true";	// Determines whether to encrypt the response

		if ( ![ "ka", "tn", "kl", "test" ].includes( region ) )
			throw new InvalidInputError( "The region code provided is invalid.", { region } );

		let goldRate = await GoldRate.getMostRecent();
		let pipeline = await DataPipeline.getMostRecent( region );

		/*
		 | EDGE CASE
		 | The _most recent pipeline_ could have come into effect a few seconds after the _most recent gold rate_.
		 | Hence, we have to ensure that the pipeline that came into effect before the gold rate is selected.
		 */
		while ( goldRate.timestamp < pipeline.inEffectFrom )
			pipeline = await DataPipeline.getPreviousVersion( pipeline );

		let derivedGoldRate = await pipeline.execute( goldRate );

		if ( internal ) {
			reply.cacheFor( 1 )	// if this is not explicitly set, then CloudFlare will cache it for who knows how long
			reply.successResponse( { ...goldRate, ...derivedGoldRate } );
		}
		else {
			reply.cacheFor( 4 )
			reply.successResponseEncrypted( { ...goldRate, ...derivedGoldRate } );
		}

	} );

	done();

}
