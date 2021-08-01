
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
// Third-party
let axios = require( "axios" )
let { DateTime } = require( "luxon" )
// Custom
let { runOnlyOneInstanceOf } = require( `${ rootDir }/lib/utilities.js` );
let { InvalidInputError } = require( `${ rootDir }/lib/errors.js` );
let GoldRate = require( `${ rootDir }/lib/models/gold-rate.js` );
let DataPipeline = require( `${ rootDir }/lib/models/data-pipeline.js` );



/*
 |
 | Returns the application status
 | Endpoint: /gold-rates
 |
 */
module.exports = routes;

function routes ( router, options, done ) {

	router.get( "/v2/gold-rates", async function ( request, reply ) {

		let region = request.query.region;
		let internal = request.query._int === "true";	// Determines whether to encrypt the response

		if ( ![ "ka", "tn", "kl", "test" ].includes( region ) )
			throw new InvalidInputError( "The region code provided is invalid.", { region } );

		let goldRates = await GoldRate.getRelevantRatesFromTheDay();
		if ( ! goldRates.length ) {
			reply.cacheFor( 1 )	// if this is not explicitly set, then CloudFlare will cache it for who knows how long
			reply.successResponse( [ ] )
			return;
		}

		let dataPipelines = await DataPipeline.getVersionsBetween(
			region,
			goldRates[ 0 ].timestamp,
			goldRates[ goldRates.length - 1 ].timestamp
		);

		let derivedGoldRates = [ ];
		for ( let goldRate of goldRates ) {
			for ( let pipeline of dataPipelines ) {
				if ( goldRate.timestamp < pipeline.inEffectFrom )
					continue;

				let derivedGoldRate = await pipeline.execute( goldRate );
				derivedGoldRates = derivedGoldRates.concat( derivedGoldRate );
				break;
			}
		}

		if ( internal ) {
			reply.cacheFor( 1 )	// if this is not explicitly set, then CloudFlare will cache it for who knows how long
			reply.successResponse( derivedGoldRates )
		}
		else {
			reply.cacheFor( 60 )
			reply.successResponseEncrypted( derivedGoldRates )
		}

	} );

	done();

}
