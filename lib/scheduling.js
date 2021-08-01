
// module.exports = {
// Exports are specified at the end of the file
// }

let processIsSetToTerminate = false

process.on( "SIGINT", function () {
	processIsSetToTerminate = true
} );

function waitFor ( seconds_OR_options, minutes, hours ) {

	let seconds;

	if ( typeof seconds_OR_options === "object" ) {
		seconds = seconds_OR_options.seconds
		minutes = seconds_OR_options.minutes
		hours = seconds_OR_options.hours
	}
	else
		seconds = seconds_OR_options

	if ( typeof seconds === "number" && !Number.isNaN( seconds ) )
		seconds = seconds < 0 ? 1 : seconds
	else
		seconds = 1

	if ( typeof minutes === "number" && !Number.isNaN( minutes ) )
		minutes = minutes < 0 ? 0 : minutes
	else
		minutes = 0

	if ( typeof hours === "number" && !Number.isNaN( hours ) )
		hours = hours < 0 ? 0 : hours
	else
		hours = 0

	let milliseconds = ( seconds * 1000 )
					+ ( minutes * 60 * 1000 )
					+ ( hours * 60 * 60 * 1000 )

	return new Promise( function ( resolve, reject ) {
		setTimeout( function () {
			if ( processIsSetToTerminate )
				return reject( false )
			return resolve( Date.now() )
		}, milliseconds )
	} )

}

class Wait {
	static for () {
		return waitFor( ...arguments )
	}
}

class For {
	static aDurationOf () {
		return waitFor( ...arguments )
	}
}





module.exports = {
	Wait,
	For
}
