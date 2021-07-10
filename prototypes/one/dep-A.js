
const { requireWithoutCachingSync } = require( "../utilities" )

module.exports = {
	level: 1,
	id: { number: 1 },
	children: [ requireWithoutCachingSync( `${__dirname}/../two/dep-E` ) ],
	toString: function () {
		return `${ this.id.number }/${ this.id.number }`
	}
}
