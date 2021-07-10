
async function main () {

	const dep_A = require( "./one/dep-A" )

	console.log( dep_A.children[ 0 ].toString() )

	// Edit the `dep-E.js` file during this timeout
	setTimeout( function () {

		const dep_B = require( "./one/trois/dep-B" )

		// Dep A still holds an in-memory cache of Dep E
		console.log( dep_A.children[ 0 ].toString() )
		// Whereas, Dep B holds a fresh instance of Dep E
		console.log( dep_B.children[ 0 ].toString() )

	}, 5000 )

}
main().catch( () => {} )
