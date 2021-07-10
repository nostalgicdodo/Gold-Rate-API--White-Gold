
const { requireWithoutCachingSync } = require( "../../utilities" )

module.exports = {
	level: 1,
	id: { number: 2 },
	children: [ requireWithoutCachingSync( `../../two/dep-E` ) ],
	toString: function () {
		return `${ this.id.number }/${ this.id.number }`
	}
}
