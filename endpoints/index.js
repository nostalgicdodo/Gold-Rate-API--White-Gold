
/*
 |
 | Constants
 |
 */
let rootDir = `${ __dirname }/..`;

/*
 |
 | Packages
 |
 */
// Our custom points
let { router } = require( `${ rootDir }/lib/routing.js` );





const routeFiles = [
	"/v1/status",
	// "/v1/cache/update",
	"/v1/gold-rates",
	"/v1/gold-rates/current",
	"/v1/pipelines",
]
for ( routeFile of routeFiles )
	router.register( require( `${ rootDir }/endpoints/${routeFile}` ) );





module.exports = router;
