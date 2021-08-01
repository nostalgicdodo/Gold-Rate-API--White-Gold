
// Exports
module.exports = {
	requireWithoutCaching,
	requireWithoutCachingSync,
	runOnlyOneInstanceOf
}



/*
 |
 | Constants and Configurations
 |
 */
const rootDir = `${ __dirname }`;



/*
 |
 | Packages
 |
 */
// Native
const path = require( "path" );
// Third-party
const callsites = require( "callsites" );
const resolve = require( "resolve" );





function requireWithoutCaching ( modulePath ) {
	const requireRelativeTo = path.dirname( callsites()[ 1 ].getFileName() ) + "/";

	return new Promise( function ( promiseResolve, promiseReject ) {
		resolve( modulePath, { basedir: requireRelativeTo }, function ( e, resolvedNormalizedModulePath ) {
			if ( e )
				return promiseReject( e );

			const moduleExports = require( resolvedNormalizedModulePath );
			delete require.cache[ resolvedNormalizedModulePath ];
			return promiseResolve( moduleExports );
		} );
	} );
}

function requireWithoutCachingSync ( modulePath ) {
	const requireRelativeTo = path.dirname( callsites()[ 1 ].getFileName() ) + "/";

	let resolvedNormalizedModulePath = resolve.sync( modulePath, { basedir: requireRelativeTo } );

	const moduleExports = require( resolvedNormalizedModulePath );
	delete require.cache[ resolvedNormalizedModulePath ];
	return moduleExports;
}

/*
 |
 | A task runner that ensures only instance of a task is running at any given moment
 |
 */
let tasksInProgress = [ ];
function runOnlyOneInstanceOf ( id, fn, errorHandler ) {
	if ( typeof id !== "string" )
		throw new Error( "An id needs to be provided for the task." );

	let existingTask = tasksInProgress.find( task => task.id === id );
	if ( existingTask ) {
		// console.info( "Task runner: " + id + ": Already in progress." )
		return existingTask.returnValuePromise;
	}

	if ( typeof errorHandler !== "function" )
		errorHandler = function () {};

	const newTask = { id };
	// console.info( "Task runner: " + id + ": Set to run." );
	newTask.returnValuePromise = fn()
			.finally( function () {
				tasksInProgress = tasksInProgress.filter( task => task.id !== id );
				// console.info( "Task runner: " + id + ": Completed." );
			} )
			.catch( errorHandler )

	tasksInProgress = tasksInProgress.concat( newTask );

	return newTask.returnValuePromise;

}

/*

function waitFor ( seconds ) {
	if ( typeof seconds !== "number" || Number.isNaN( seconds ) || seconds <= 0 )
		seconds = 1;
	let milliseconds = seconds * 1000;
	return new Promise( function ( resolve ) {
		setTimeout( resolve, milliseconds )
	} );
}

let funOne = async function () {
	await waitFor( 5 )
	return "fun one"
}
let funTwo = async function () {
	await waitFor( 1 )
	throw new Error( "fun two fail" )
	return "fun two"
}

setTimeout( async function () {
	let r = await runOnlyOneInstanceOf( "funOne", funOne )
	console.log( "Result: Task 1 execution attempt #1: " + r )
}, 1000 )
setTimeout( async function () {
	let r = await runOnlyOneInstanceOf( "funTwo", funTwo, function ( e ) {
		console.error( "ERRR..." + e.message )
	} )
	console.log( "Result: Task 2 execution attempt #1: " + r )
}, 1500 )
setTimeout( async function () {
	let r = await runOnlyOneInstanceOf( "funOne", funOne )
	console.log( "Result: Task 1 execution attempt #2: " + r )
}, 1900 )
*/
