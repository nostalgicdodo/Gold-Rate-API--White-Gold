
/*
 |
 | Constants and Configurations
 |
 */
let rootDir = `${ __dirname }/../..`;



/*
 |
 | Packages
 |
 */
// Custom
let {
	InvalidInputError,
	DataNotFoundError,
} = require( `${ rootDir }/lib/errors.js` );
let DataPipeline = require( `${rootDir}/lib/models/data-pipeline.js` );



/*
 |
 | Returns the application status
 | Endpoint: /gold-rates/current
 |
 */
module.exports = routes;

function routes ( router, options, done ) {

	router.get( "/v1/pipelines/:name/parameters", async function ( request, reply ) {

		let name = request.params?.name

		if ( typeof name !== "string" || name.trim() === "" )
			throw new InvalidInputError( "The data pipeline name is required." )

		let pipeline = await DataPipeline.getMostRecent( name )

		if ( ! ( pipeline instanceof DataPipeline ) )
			throw new DataNotFoundError( "The data pipeline was not found." )

		reply.successResponse( pipeline )

	} )

	router.post( "/v1/pipelines", async function ( request, reply ) {

		let name = request.body.name
		let path = request.body.path
		let context = request.body.context || { }

		if ( typeof name !== "string" || name.trim() === "" )
			throw new InvalidInputError( "The data pipeline name is required." )

		if ( typeof path !== "string" || path.trim() === "" ) {
			const mostRecentPipeline = await DataPipeline.getMostRecent( name )
			path = mostRecentPipeline.path
		}

		let pipeline = new DataPipeline( name, path, context )
		await pipeline.save()

		reply.successResponse( "The pipeline has been added." )

	} );

	done()

}
