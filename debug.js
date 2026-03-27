
let rootDir = __dirname

let GoldRate = require( `${ rootDir }/lib/models/gold-rate.js` )

let axios = require( "axios" )

;( async function main () {

	const httpClient = axios.create( {
		headers: { "Cache-Control": "no-store" },
		timeout: 5000
	} );
	httpClient.defaults.headers.common[ "User-Agent" ] = "BFS";

	// let goldRate = await GoldRate.fetchCurrentLiveRate()
	let response
	try {
		response = await httpClient.get( "http://nammauzhavan.com/aditya" );
	}
	catch ( e ) {
		console.log( e.message )
		return
	}
	console.log( response.data )

	process.exit( 0 )

}() )
