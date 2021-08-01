
// Exports
// module.exports = GoldRate;





/*
 |
 | Constants and Configurations
 |
 */
const rootDir = `${ __dirname }/../..`;
const databaseConfigurationFilename = `${rootDir}/environment/configuration/database.json`;
const goldRateDataConfigurationFilename = `${rootDir}/environment/configuration/gold-rate-data-management.json`;

const databaseConfiguration = require( databaseConfigurationFilename );
const goldRateDataConfiguration = require( goldRateDataConfigurationFilename );

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
const FIVE_SECONDS = 5 * 1000

// const apiURL = "http://nammauzhavan.com/aditya"
const apiURL = goldRateDataConfiguration.apiEndpoint;



/*
 |
 | Packages
 |
 */
// Third-party
let axios = require( "axios" )
let { DateTime } = require( "luxon" )
// Custom
let { runOnlyOneInstanceOf } = require( `${rootDir}/lib/utilities.js` );
let dbms = require( `${rootDir}/lib/dbms.js` )



/*
 |
 | Setup
 |
 */
const httpClient = axios.create( {
	headers: { "Cache-Control": "no-store" },
	timeout: 5000
} );
httpClient.defaults.headers.common[ "User-Agent" ] = "BFS";
// httpClient.defaults.headers.common[ "X-Forwarded-For" ] = "128.199.22.44";
// httpClient.defaults.headers.common[ "Forwarded" ] = "for=128.199.22.44";





class GoldRate {

	static requiredFields = [ "timestamp", "bid" ];

	static #cache = { };

	static #mostRecent;

	static #relevantTimesOfTheDay = [ ];
	static #relevantRatesFromTheDay = [ ];

	constructor ( data, timestamp ) {
		this.timestamp = timestamp;
		this.bid = data.bid;
		this.ask = data.ask;
		this.high = data.high;
		this.low = data.low;

		// Schema version is helpful for potential data migrations
		this.__schema__ = 1;
		// Data that is stored purely because Mongo supports certain queries that might have need for them
		this.__mongo__ = { };
			this.__mongo__.timestamp = new Date( timestamp );
		// Provision for external services (that consume this data) to tag this record as being "read"
		// this.__consumers__ = { };

		// Any derived data can be stored back in here
		// this.__derived__ = { };
			// this.__derived__.goldRate = {
			// 	context: { ts: 1626719220000, formula: "equations.js", parameters: { } },
			// 	value: 519
			// };
	}

	async save () {

		// If the record has already saved to the database before, then "update", else "insert"
		if ( this._id )
			return this.updateRecordOnDatabase();
		else
			return this.createRecordOnDatabase();

	}

	async createRecordOnDatabase () {

		// Check if the required properties have been provided
		for ( let property of this.constructor.requiredFields )
			if ( [ null, void 0 ].includes( this[ property ] ) )
				throw new Error( `The property "${ property }" is required and has not been provided or is invalid.` );

		// Set meta fields
		this.__createdOn__ = new Date();
		this._id = this.timestamp;
		this.__expireAt__ = new Date( Date.now() + ONE_WEEK );

		// Get database client
		const database = await dbms.getDatabase();
		const collection = database.collection( "gold-rates" );

		// Create the record
		let operation;
		try {
			operation = await collection.insertOne( this )
		}
		catch ( e ) {
			this._id = null;
			if ( e.code == 11000 ) {
				let error = new Error( "A Gold Rate at this timestamp has already been recorded." )
				error.code = "already-exists";
				throw error;
			}
			else
				throw e;
		}

		// if ( operation.insertedCount !== 1 ) {
		if ( ! operation.acknowledged ) {
			this._id = null;
			throw new Error( "The Gold Rate could not be saved (i.e. added) to the database." );
		}

		this._id = operation.insertedId
		return this;

	}

	async updateRecordOnDatabase () {

		// Check if the required properties have been provided
		for ( let property of this.constructor.requiredFields )
			if ( [ null, void 0 ].includes( this[ property ] ) )
				throw new Error( `The property "${ property }" is required and has not been provided or is invalid.` );

		// Yes, we're naively assuming that changes have been made
		this.__lastModifiedAt__ = new Date();

		// Get database client
		const database = await dbms.getDatabase();
		const collection = database.collection( "gold-rates" );

		// Update the record
		let operation = await collection.updateOne( {
			_id: this._id
		}, {
			$set: this
		} );

		if ( operation.modifiedCount < 1 )
			throw new Error( "The Gold Rate could not be saved (i.e. updated) to the database." )

		return this;

	}

	static get relevantTimesOfTheDay () {
		let startOfToday = DateTime.utc().setZone( "Asia/Kolkata" ).set( { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 } );
		/*
		 | If:
		 | 	A. the relevant times have already been cached, **and**
		 | 	B. the relevant times are from the present day (not a prior date)
		 */
		if (
			this.#relevantTimesOfTheDay.length !== 0	// if the array is populated
			&& this.#relevantTimesOfTheDay[ 0 ] > startOfToday
		)
			return this.#relevantTimesOfTheDay;

		// Determine / Calculate the relevant times for today
		let startTimeRange = DateTime.utc().setZone( "Asia/Kolkata" ).set( { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 } );
		let endTimeRange = startTimeRange.set( { hours: 18 } );
		let relevantTimesOfTheDay = [ startTimeRange.ts ];
		let currentTime = startTimeRange;
		while ( currentTime.ts < endTimeRange.ts ) {
			currentTime = currentTime.plus( { minutes: 15 } );
			relevantTimesOfTheDay = relevantTimesOfTheDay.concat( currentTime.ts );
		}
		// Cache the relevant times
		this.#relevantTimesOfTheDay = relevantTimesOfTheDay;

		return this.#relevantTimesOfTheDay;
	}

	static async getFirstRateBetween ( startTimeRange, endTimeRange ) {

		// Get database client
		const database = await dbms.getDatabase();
		const collection = database.collection( "gold-rates" );

		// Find the record
		let query = { _id: { } };
		if ( startTimeRange )
			query._id.$gte = startTimeRange;
		if ( endTimeRange )
			query._id.$lt = endTimeRange;

		let records = await collection.find( query ).sort( { _id: 1 } ).limit( 1 ).toArray();
		if ( records.length !== 1 )
			return null;

		let record = records[ 0 ];

		let goldRate = new GoldRate( {
			bid: record.bid,
			ask: record.ask,
			high: record.high,
			low: record.low
		}, record.timestamp );
		goldRate._id = record._id;

		return goldRate;

	}

	static async getRelevantRatesFromTheDay () {

		let currentDate = DateTime.utc().setZone( "Asia/Kolkata" );
		let startOfToday = currentDate.set( { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 } );

		// Regardless, fetch updated gold rate values and cache them
		let goldRates = runOnlyOneInstanceOf( "fetchAndStore__relevantGoldRatesFromTheDay", async () => {
			// TODO: Optimize further; don't fetch gold rates from scratch every single time
			let relevantRates = [ ];
			const currentTimeMS = Date.now();
			const relevantTimesOfTheDay = this.relevantTimesOfTheDay;
			for ( let _i = 0; _i < relevantTimesOfTheDay.length; _i += 1 ) {
				// Skip fetching gold rates for times after the current time
					// because well, those gold rates don't exist yet
				if ( relevantTimesOfTheDay[ _i ] >= currentTimeMS )
					break;
				let startTime = relevantTimesOfTheDay[ _i ];
				let endTime = relevantTimesOfTheDay[ _i + 1 ];
				let goldRate = await this.getFirstRateBetween( startTime, endTime );
				if ( goldRate instanceof GoldRate )
					relevantRates = relevantRates.concat( goldRate );
			}

			this.#relevantRatesFromTheDay = relevantRates;
			this.#cache.date = currentDate;

			return relevantRates;
		} );

		if (
			this.#cache.date && ( this.#cache.date.ts > startOfToday.ts )	// ensure that we don't send yesterday's data
			&& this.#relevantRatesFromTheDay.length > 0
		)
			return this.#relevantRatesFromTheDay;
		else
			return goldRates;

	}

	static async getMostRecent () {

		let mostRecentGoldRate = runOnlyOneInstanceOf( "fetchMostRecent__GoldRate", async () => {

			// Get database client
			const database = await dbms.getDatabase();
			const collection = database.collection( "gold-rates" );

			let records = await collection.find( { } ).sort( { _id: -1 } ).limit( 1 ).toArray();
			// let records = await collection.aggregate( [ { $sample: { size: 1 } } ] ).toArray();
			let record = records[ 0 ];

			let goldRate = new GoldRate( {
				bid: record.bid,
				ask: record.ask,
				high: record.high,
				low: record.low
			}, record.timestamp );
			goldRate._id = record._id;

			this.#mostRecent = goldRate;

			return record;

		}, function ( e ) {
			console.error( e.message );
		} );

		if ( ! this.#mostRecent )
			return mostRecentGoldRate;

		if ( Date.now() - this.#mostRecent.timestamp > FIVE_SECONDS )
			return mostRecentGoldRate;

		return this.#mostRecent;

	}

	/*
	 | - Fetch the live gold rate from the external provider
	 */
	static async fetchCurrentLiveRate () {

		/*
		 | - Fetch the data from an external API
		 */
		let response
		// try {
			response = await httpClient.get( apiURL );
		// }
		// catch ( e ) {
			// if ( e.code == "ECONNABORTED" )
			// 	return {
			// 		code: 500,
			// 		message: e.message
			// 	};
			// console.error( e )
		// }

		/*
		 | - Process the response
		 */
		let rawGoldRateData = Object.values( response.data.rows )
						.find( rate => rate.Symbol.includes( "GLD" ) );

		let timestamp = DateTime.fromFormat( rawGoldRateData.Time, "MM/dd/yyyy hh:mm:ss a", { zone: "Asia/Kolkata" } ).ts;
		let bid = parseFloat( rawGoldRateData.Bid );
		let ask = parseFloat( rawGoldRateData.Ask );
		let high = parseFloat( rawGoldRateData.High );
		let low = parseFloat( rawGoldRateData.Low );

		return new GoldRate( {
			bid,
			ask,
			high,
			low
		}, timestamp );
	}

}





module.exports = GoldRate;
