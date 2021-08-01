
// Exports
// module.exports = DataPipeline;





/*
 |
 | Constants and Configurations
 |
 */
const rootDir = `${ __dirname }/../..`;
const pipelineDir = `${rootDir}/environment/pipelines`;



/*
 |
 | Packages
 |
 */
// Native
const { URL } = require( "url" );
// Third-party
let luxon = require( "luxon" );
// Custom
let dbms = require( `${rootDir}/lib/dbms.js` );
let { requireWithoutCaching, runOnlyOneInstanceOf } = require( `${rootDir}/lib/utilities.js` );
let { InvalidInputError, ServerError } = require( `${rootDir}/lib/errors.js` );



/*
 |
 | Setup
 |
 */





class DataPipeline {

	static requiredFields = [ "name", "path" ]

	static #cache = { }

	constructor ( name, path, context, inEffectFrom ) {
		this.name = name;
		this.path = path;
		this.setContext( context );
		this.inEffectFrom = inEffectFrom || Date.now();

		// Schema version is helpful for potential data migrations
		this.__schema__ = 1;
	}

	// Supports passing a single key-value pair or an object of key-value pairs
	setContext ( key__OR__KeyValuePairs, value ) {
		if ( typeof key__OR__KeyValuePairs === "string" )
			this.context[ key__OR__KeyValuePairs ] = value;
		else if ( typeof key__OR__KeyValuePairs === "object" && !Array.isArray( key__OR__KeyValuePairs ) )
			this.context = { ...this.context, ...key__OR__KeyValuePairs }
		else
			this.context = { };

		return this;
	}

	_setPath ( path ) {
		// Is the path is a valid URL?
		try {
			new URL( path );
			this.pathIsAURL = true;
			this.pathIsAFile = false;
		}
		catch {
			this.path = path;
			this.pathIsAURL = false;
		}

		this.path = path;

		return this;
	}

	async execute () {
		if ( typeof this.pipeline !== "function" )
			this.pipeline = await requireWithoutCaching( `${pipelineDir}/${this.path}` );
		return this.pipeline.call( this.context, ...arguments );
	}

	save () {
		return this.createRecordOnDatabase()
				.then( () => {
					this.constructor.#cache[ this.name ] = this;
				} )
	}

	async createRecordOnDatabase () {

		// Check if the required properties have been provided
		for ( let property of this.constructor.requiredFields )
			if ( [ null, void 0 ].includes( this[ property ] ) )
				throw new InvalidInputError( `The property "${ property }" is required and has not been provided or is invalid.` );

		let record = {
			__mongo__: { __createdOn__: new Date() },
			name: this.name,
			path: this.path,
			context: this.context,
			inEffectFrom: this.inEffectFrom
		}

		// Get database client
		const database = await dbms.getDatabase();
		const collection = database.collection( "data-pipelines" );

		// Create the record
		let operation = await collection.insertOne( record );

		if ( ! operation.acknowledged )
			throw new ServerError( "The pipeline could not be saved to the database." );

		return this;

	}

	static getMostRecent ( name ) {

		if ( this.#cache[ name ] )
			return this.#cache[ name ];

		return runOnlyOneInstanceOf( "fetchMostRecent__DataPipeline", async () => {

			// Get database client
			const database = await dbms.getDatabase();
			const collection = database.collection( "data-pipelines" );

			let records = await collection.find( { name } ).sort( { inEffectFrom: -1 } ).limit( 1 ).toArray();
			let record = records[ 0 ];

			if ( ! record )
				return null;

			let dataPipeline = new DataPipeline( record.name, record.path, record.context, record.inEffectFrom );

			this.#cache[ name ] = dataPipeline;

			return dataPipeline;

		}, function ( e ) {
			console.error( e.message );
		} );

	}

	static async getPreviousVersion ( pipeline ) {

		// Get database client
		const database = await dbms.getDatabase();
		const collection = database.collection( "data-pipelines" );

		let records = await collection.find( {
			name: pipeline.name,
			inEffectFrom: { $lt: pipeline.inEffectFrom }
		} ).sort( { inEffectFrom: -1 } ).limit( 1 ).toArray();
		let record = records[ 0 ];

		let previousDataPipeline = new DataPipeline( record.name, record.path, record.context, record.inEffectFrom );

		return previousDataPipeline;

	}

	static async getVersionsBetween ( name, startTimeRange, endTimeRange ) {

		return runOnlyOneInstanceOf( `fetch__DataPipelines__${name}__${startTimeRange}-${endTimeRange}`, async function () {

			// Get database client
			const database = await dbms.getDatabase();
			const collection = database.collection( "data-pipelines" );

			let records = await collection.find( {
				name,
				inEffectFrom: { $gt: startTimeRange, $lte: endTimeRange }
			} ).sort( { inEffectFrom: 1 } ).toArray();
			let preceedingRecord = await collection.find( {
				name,
				inEffectFrom: { $lte: startTimeRange }
			} ).sort( { inEffectFrom: -1 } ).limit( 1 ).toArray();

			let allRelevantRecords;
			if ( preceedingRecord.length === 1 )
				allRelevantRecords = preceedingRecord.concat( records );
			else
				allRelevantRecords = records;

			let dataPipelines = [ ];
			for ( let record of allRelevantRecords )
				dataPipelines = dataPipelines.concat( new DataPipeline(
					record.name,
					record.path,
					record.context,
					record.inEffectFrom
				) );

			return dataPipelines;

		}, function ( e ) {
			console.error( e.message );
		} );

	}

}





module.exports = DataPipeline;
