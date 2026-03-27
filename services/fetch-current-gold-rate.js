
/**
 |
 |
 | This service
 | 	- fetches the latest gold rate from an external API
 | 	- stores the fetched gold rate on the database
 | 	- communicates the gold rate to the Gold Rate server
 |
 |
 */

/*
 |
 | Constants
 |
 */
const rootDir = `${ __dirname }/..`;
const lastFetchedGoldRateLogFile = rootDir + "/environment/logs/lastFetchedGoldRate.json"

/*
 |
 | Packages
 |
 */
const fs = require( "fs/promises" )

// Custom
let logger = require( `${rootDir}/lib/logging.js` )
let GoldRate = require( `${rootDir}/lib/models/gold-rate.js` )
let { For } = require( `${rootDir}/lib/scheduling.js` )





async function logSomething ( thing ) {
	await fs.writeFile( lastFetchedGoldRateLogFile, JSON.stringify( thing, null, "\t" ) )
}

async function main () {

	while ( await For.aDurationOf( { seconds: 5 } ) ) {

		try {
			let goldRate = await GoldRate.fetchCurrentLiveRate();
			await logSomething( goldRate )
			await goldRate.save();
		}
		catch ( e ) {
			if ( e.code === "ECONNABORTED" )
				logger.toConsole( e.code + ": " + e.message )
			else
				logger.toConsole( e )
		}

	}

}

main()
	.catch( async function ( e ) {
		// await logger.toUs( e )
		console.error( e )
	} )
