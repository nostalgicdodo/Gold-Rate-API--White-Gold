
let rootDir = __dirname

let GoldRate = require( `${ rootDir }/lib/models/gold-rate.js` )

;( async function main () {

	let goldRates = await GoldRate.getRelevantRatesFromTheDay()
	console.log( goldRates )

	process.exit( 0 )

}() )
